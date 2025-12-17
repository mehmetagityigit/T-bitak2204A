
import { GoogleGenAI, Chat, FunctionDeclaration, Type, GenerateContentResponse } from "@google/genai";
import { UserProfile, PerformanceLog } from "../types";
import { getBMICategory } from "./ruleEngine";

// Helper to format history for context
const formatHealthContext = (profile: UserProfile): string => {
  const lastLog = profile.dailyLogs[profile.dailyLogs.length - 1];
  const bmiCategory = getBMICategory(profile.bmi || 22);
  
  let context = `
  --- KULLANICI PROFİLİ ---
  - İsim: ${profile.name}
  - Yaş: ${profile.age}
  - Cinsiyet: ${profile.gender === 'male' ? 'Erkek' : 'Kadın'}
  - Vücut: ${profile.height}cm, ${profile.weight}kg
  - VKİ (BMI): ${profile.bmi?.toFixed(1) || 'N/A'} (${bmiCategory})
  
  --- KAN DEĞERLERİ RAPORU ---
  * Demir (Iron): ${profile.bloodValues.iron} (Düşükse halsizlik yapar)
  * Ferritin: ${profile.bloodValues.ferritin || 'Yok'}
  * B12 Vitamini: ${profile.bloodValues.b12} (Düşükse unutkanlık yapar)
  * D3 Vitamini: ${profile.bloodValues.d3} (Bağışıklık için kritik)
  * Şeker (Glucose): ${profile.bloodValues.glucose || 'Yok'}
  * WBC (Bağışıklık Hücresi): ${profile.bloodValues.wbc}
  `;

  // Add Custom Values if they exist
  if (profile.bloodValues.customValues && profile.bloodValues.customValues.length > 0) {
    context += `    * DİĞER TAHLİLLER:\n`;
    profile.bloodValues.customValues.forEach(val => {
      context += `      - ${val.name}: ${val.value} ${val.unit}\n`;
    });
  }

  if (lastLog) {
    context += `
    --- BUGÜNKÜ DURUM (${lastLog.date}) ---
    - Beslenme Puanı: ${lastLog.nutritionScore || 'Girilmedi'}/10
    - Stres Seviyesi: ${lastLog.stressLevel}/10
    - Yorgunluk: ${lastLog.fatigueLevel}/10
    - Uyku: ${lastLog.sleepHours} saat
    - Ruh Hali: ${lastLog.mood || 'Belirtilmedi'}
    - Su Tüketimi: ${lastLog.waterIntake} Litre
    - Semptomlar: ${lastLog.symptoms.join(', ') || 'Yok'}
    `;
  } else {
    context += `\nBugün henüz veri girişi yapılmadı. Kullanıcıya nazikçe veri girmesini hatırlat.`;
  }

  // Add recent symptom history context
  const recentSymptoms = profile.symptomHistory.slice(-3);
  if (recentSymptoms.length > 0) {
    context += `\n--- SON ŞİKAYETLER ---\n${recentSymptoms.map(s => `- ${s.timestamp}: ${s.symptom}`).join('\n')}`;
  }

  return context;
};

// Define the Tool
const logSymptomTool: FunctionDeclaration = {
  name: 'logSymptom',
  parameters: {
    type: Type.OBJECT,
    description: 'Records a user symptom to their personal health memory with details like severity and duration.',
    properties: {
      symptom: {
        type: Type.STRING,
        description: 'The name of the symptom or disease indication (e.g., Headache, Flu, Nausea).',
      },
      severity: {
        type: Type.STRING,
        description: 'The quality or intensity of the symptom (e.g., Mild, Throbbing, 8/10, Unbearable).',
      },
      duration: {
        type: Type.STRING,
        description: 'The quantity or time duration (e.g., Since yesterday, 2 hours, Chronic).',
      },
    },
    required: ['symptom'],
  },
};

export const createGeminiChat = (profile: UserProfile): Chat => {
  // Fix: Exclusively use process.env.API_KEY and initialize GoogleGenAI directly
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const healthContext = formatHealthContext(profile);

  const systemInstruction = `
  Sen "SağlıkAsist"sin. TÜBİTAK projesi kapsamında geliştirilmiş, **son derece bilgili, samimi, motive edici bir Yaşam Koçu ve Sağlık Asistanısın.**

  **GÖREVİN:**
  Kullanıcıyı bir hasta gibi değil, gelişime açık bir birey olarak gör. Onun verilerini analiz et, hayat kalitesini artıracak **uzun, detaylı ve tatmin edici** tavsiyeler ver. Kısa cevaplar verme. Konuşmayı sürdür.

  **KİŞİLİĞİN:**
  - **Samimi ve Enerjik:** "Merhaba" deyip geçme. "Harika görünüyorsun, bugün senin için neler yapabiliriz?" gibi enerjik gir.
  - **Yaşam Koçu:** Sadece hastalıktan konuşma. Uyku düzeni, su içme alışkanlığı, spor rutini ve stres yönetimi hakkında koçluk yap.
  - **Detaycı:** Kullanıcı "Yorgunum" derse, sadece "Dinlen" deme. Neden yorgun olabileceğini kan değerlerine (Demir, B12) bakarak yorumla ve çözüm önerileri sun.

  **YETENEKLERİN VE KURALLARIN:**

  1.  **BESLENME PROGRAMI HAZIRLAMA:**
      - Eğer kullanıcı kilo vermek, almak veya sağlıklı beslenmek istiyorsa, ona **günlük örnek beslenme programı** hazırla.
      - Programı hazırlarken kullanıcının kilosunu (${profile.weight}kg) ve VKİ'sini (${profile.bmi}) dikkate al.
      - Örnek: "Senin için protein ağırlıklı bir gün planladım: Sabah yumurta..." gibi somut ol.

  2.  **KAN DEĞERİ ANALİZİ:**
      - Kullanıcının kan değerlerini sürekli kontrol et.
      - Demir düşükse: "Demir değerin sınırda, bu halsizlik yapabilir. Kırmızı et, mercimek ve yanında C vitamini tüketmelisin." gibi spesifik beslenme önerisi ver.
      - D3 düşükse: "Güneş eksikliğin var gibi, D vitamini takviyesi veya öğle saatlerinde 15dk yürüyüş iyi gelir." de.

  3.  **SEMPTOM KAYDI (Çok Önemli):**
      - Kullanıcı belirgin bir fiziksel şikayetten (baş ağrısı, mide bulantısı vb.) bahsederse **HEMEN** \`logSymptom\` aracını kullan ve kaydet.
      - Kaydettikten sonra geçmiş olsun dileklerini ilet ve ilaç dışı doğal çözümler öner.

  4.  **TIBBİ GÜVENLİK SINIRI:**
      - ASLA "Sen kansersin" veya "Şu antibiyotiği iç" deme. Teşhis koyma.
      - Ama "Bu belirtiler gribi andırıyor, bol sıvı alıp dinlenmelisin" diyebilirsin.
      - Doğal yöntemleri (bitki çayları, egzersizler) önermekten çekinme.

  **FORMAT:**
  - Cevaplarında **kalın yazı**, madde işaretleri ve emojiler kullan. Okuması keyifli olsun.
  - Kullanıcıyla sohbet et, ona sorular sor. "Bugün kaç bardak su içtin?" gibi.

  ${healthContext}
  `;

  // Fix: Use 'gemini-3-flash-preview' as recommended for basic text tasks
  return ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      systemInstruction: systemInstruction,
      temperature: 0.85, 
      tools: [{ functionDeclarations: [logSymptomTool] }],
    },
  });
};

/**
 * Analyzes a blood test result image and extracts values.
 */
export const analyzeBloodResult = async (base64Image: string, mimeType: string) => {
  // Fix: Exclusively use process.env.API_KEY and initialize GoogleGenAI directly
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
  Analyze this medical blood test report image. Extract the following values if they exist.
  Return ONLY a JSON object.
  
  Keys to extract:
  - hemoglobin (number)
  - ferritin (number)
  - iron (number)
  - b12 (number)
  - d3 (number)
  - magnesium (number)
  - glucose (number)
  - tsh (number)
  - wbc (number)

  If a value is not found in the image, do not include the key in the JSON.
  Look for synonyms like "Demir" for iron, "Açlık Kan Şekeri" for glucose, "Lökosit" for WBC.
  Only return the numeric value, strip units.
  `;

  // Fix: Use 'gemini-3-flash-preview' for multimodal tasks
  const response: GenerateContentResponse = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: mimeType,
            data: base64Image
          }
        },
        { text: prompt }
      ]
    },
    config: {
      responseMimeType: "application/json"
    }
  });

  const text = response.text || "{}";
  const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
  
  try {
    return JSON.parse(cleanJson);
  } catch (e) {
    console.error("Failed to parse Gemini JSON response", text);
    return {};
  }
};

/**
 * Estimates calories for a given food name and amount using Gemini.
 */
export const estimateCalories = async (foodName: string, amount: string): Promise<number | null> => {
  try {
    // Fix: Exclusively use process.env.API_KEY and initialize GoogleGenAI directly
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `
    Sen uzman bir diyetisyensin.
    Yiyecek: "${foodName}"
    Miktar: "${amount}"

    Bu miktardaki yiyeceğin tahmini kalorisini hesapla.
    Sadece ve sadece tek bir sayı (integer) döndür. JSON veya metin ekleme.
    Örnek: "120"
    Eğer hesaplayamazsan "0" döndür.
    `;

    // Fix: Use 'gemini-3-flash-preview' for basic text tasks
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt
    });

    const text = response.text?.trim();
    const calories = parseInt(text || "0");
    
    return isNaN(calories) ? 0 : calories;
  } catch (error) {
    console.error("Calorie estimation error:", error);
    return null;
  }
};

/**
 * Analyzes athlete performance log.
 */
export const analyzePerformance = async (log: PerformanceLog, profile: UserProfile): Promise<string> => {
  // Fix: Exclusively use process.env.API_KEY and initialize GoogleGenAI directly
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `
  Sen uzman bir Spor Performans Koçusun.
  Kullanıcı Adı: ${profile.name}
  Yaş: ${profile.age}
  Kilo: ${profile.weight}kg
  
  Kullanıcı yeni bir antrenman yaptı:
  - Antrenman Türü: ${log.activityType}
  - Süre: ${log.durationMinutes} dakika
  - Zorluk (RPE 1-10): ${log.intensity}/10
  - Hissiyat: ${log.feeling}
  - Kullanıcı Notu: ${log.notes}

  Görevin:
  Bu antrenmanı analiz et ve kullanıcıya **kısa, motive edici ve toparlanma (recovery) odaklı** bir geri bildirim ver.
  Eğer zorluk yüksekse (8-10) protein ve uyku öner.
  Eğer hissiyat "yorgun" ise dinlenme öner.
  Samimi ol, emoji kullan.
  Maksimum 3 cümle olsun.
  `;

  try {
    // Fix: Use 'gemini-3-flash-preview' for general analysis tasks
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt
    });
    return response.text || "Antrenman kaydedildi.";
  } catch (error) {
    console.error("Performance analysis error:", error);
    return "Antrenman başarıyla kaydedildi ancak AI şu an yanıt veremiyor.";
  }
};
