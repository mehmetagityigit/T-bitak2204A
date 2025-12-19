
import { GoogleGenAI, Chat, FunctionDeclaration, Type, GenerateContentResponse } from "@google/genai";
import { UserProfile, PerformanceLog } from "../types";
import { getBMICategory } from "./ruleEngine";

const formatHealthContext = (profile: UserProfile): string => {
  const lastLog = profile.dailyLogs[profile.dailyLogs.length - 1];
  const bmiCategory = getBMICategory(profile.bmi || 22);
  const birthDateStr = `${profile.birthDate.day}/${profile.birthDate.month}/${profile.birthDate.year}`;
  
  let context = `
  --- KULLANICI PROFİLİ ---
  - İsim: ${profile.firstName} ${profile.lastName}
  - Doğum Tarihi: ${birthDateStr}
  - Cinsiyet: ${profile.gender === 'male' ? 'Erkek' : 'Kadın'}
  - Kan Grubu: ${profile.bloodGroup || 'Belirtilmedi'}
  - Kronik Rahatsızlıklar: ${profile.chronicIllnesses.join(', ') || 'Yok'}
  - Vücut: ${profile.height}cm, ${profile.weight}kg
  - VKİ (BMI): ${profile.bmi?.toFixed(1) || 'N/A'} (${bmiCategory})
  
  --- KAN DEĞERLERİ RAPORU ---
  * Demir (Iron): ${profile.bloodValues.iron}
  * B12 Vitamini: ${profile.bloodValues.b12}
  * D3 Vitamini: ${profile.bloodValues.d3}
  * WBC (Bağışıklık Hücresi): ${profile.bloodValues.wbc}
  `;

  if (lastLog) {
    context += `
    --- BUGÜNKÜ DURUM ---
    - Stres: ${lastLog.stressLevel}/10
    - Uyku: ${lastLog.sleepHours} saat
    - Semptomlar: ${lastLog.symptoms.join(', ') || 'Yok'}
    `;
  }

  return context;
};

const logSymptomTool: FunctionDeclaration = {
  name: 'logSymptom',
  parameters: {
    type: Type.OBJECT,
    description: 'Records a user symptom to their personal health memory.',
    properties: {
      symptom: { type: Type.STRING, description: 'Symptom name' },
      severity: { type: Type.STRING, description: 'Severity (Mild, High, etc.)' },
      duration: { type: Type.STRING, description: 'Duration' },
    },
    required: ['symptom'],
  },
};

export const createGeminiChat = (profile: UserProfile): Chat => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const healthContext = formatHealthContext(profile);

  const systemInstruction = `
  Sen "SağlıkAsist"sin. TÜBİTAK projesi kapsamında geliştirilmiş, bilgili ve samimi bir Sağlık Asistanısın.
  Kullanıcının adı: ${profile.firstName}.
  Cevaplarını samimi, motive edici ve tıbbi teşhis koymadan (doğal öneriler vererek) oluştur.
  ${healthContext}
  `;

  return ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      systemInstruction: systemInstruction,
      temperature: 0.8,
      tools: [{ functionDeclarations: [logSymptomTool] }],
    },
  });
};

export const analyzeBloodResult = async (base64Image: string, mimeType: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Analyze this medical blood test report image and extract keys like hemoglobin, iron, b12, d3. Return ONLY JSON.`;

  const response: GenerateContentResponse = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: { parts: [{ inlineData: { mimeType, data: base64Image } }, { text: prompt }] },
    config: { responseMimeType: "application/json" }
  });

  try {
    return JSON.parse(response.text || "{}");
  } catch (e) {
    return {};
  }
};

export const estimateCalories = async (foodName: string, amount: string): Promise<number | null> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Calculate calories for ${amount} of ${foodName}. Return ONLY numeric value.`;
  const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
  const cals = parseInt(response.text?.trim() || "0");
  return isNaN(cals) ? 0 : cals;
};

export const analyzePerformance = async (log: PerformanceLog, profile: UserProfile): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Analyze this workout for ${profile.firstName}: ${log.activityType}, ${log.durationMinutes}min. Brief feedback.`;
  const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
  return response.text || "Antrenman kaydedildi.";
};
