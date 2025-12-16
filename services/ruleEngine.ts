
import { UserProfile, DailyLog } from '../types';
import { PYTHON_API_URL } from './config';

export const getBMICategory = (bmi: number): string => {
  if (bmi < 18.5) return "Zayıf";
  if (bmi < 24.9) return "Normal Kilolu";
  if (bmi < 29.9) return "Fazla Kilolu";
  return "Obezite";
};

/**
 * Calculates Basal Metabolic Rate (BMR) using Mifflin-St Jeor Equation
 */
export const calculateBMR = (
  weight: number,
  height: number,
  age: number,
  gender: 'male' | 'female' | 'other'
): number => {
  // Men: 10W + 6.25H - 5A + 5
  // Women: 10W + 6.25H - 5A - 161
  let bmr = (10 * weight) + (6.25 * height) - (5 * age);
  
  if (gender === 'male') {
    bmr += 5;
  } else {
    bmr -= 161;
  }
  return Math.round(bmr);
};

export const calculateBodyFat = (
  gender: 'male' | 'female' | 'other',
  waist: number,
  neck: number,
  height: number,
  hip: number = 0
): number => {
  if (waist === 0 || neck === 0 || height === 0) return 0;
  
  if (gender === 'female') {
    if (hip === 0) return 0;
    const result = 163.205 * Math.log10(waist + hip - neck) - 97.684 * Math.log10(height) - 78.387;
    return Number(result.toFixed(1));
  } else {
    if (waist - neck <= 0) return 0;
    const result = 86.010 * Math.log10(waist - neck) - 70.041 * Math.log10(height) + 36.76;
    return Number(result.toFixed(1));
  }
};

export const getBodyFatCategory = (bf: number, gender: string): string => {
  if (gender === 'female') {
    if (bf < 14) return "Esansiyel Yağ (Çok Düşük)";
    if (bf < 21) return "Sporcu";
    if (bf < 25) return "Fitness";
    if (bf < 32) return "Normal";
    return "Obezite Riski";
  } else {
    if (bf < 6) return "Esansiyel Yağ (Çok Düşük)";
    if (bf < 14) return "Sporcu";
    if (bf < 18) return "Fitness";
    if (bf < 25) return "Normal";
    return "Obezite Riski";
  }
};

export const calculateCaloriesBurned = (activityMet: number, weightKg: number, durationMinutes: number): number => {
  const durationHours = durationMinutes / 60;
  return Math.round(activityMet * weightKg * durationHours);
};

export const SPORTS_MET_VALUES: {[key: string]: number} = {
  "Yürüyüş (Hafif)": 2.5,
  "Yürüyüş (Tempolu)": 4.0,
  "Koşu (Hafif)": 7.0,
  "Koşu (Hızlı)": 10.0,
  "Bisiklet": 6.0,
  "Yüzme": 7.0,
  "Fitness / Ağırlık": 5.0,
  "Yoga / Pilates": 3.0,
  "Futbol / Basketbol": 8.0,
  "Dans": 5.0
};

export const getImmunityDescription = (score: number): { title: string, desc: string, color: string } => {
  if (score >= 80) {
    return {
      title: "Mükemmel Direnç",
      desc: "Bağışıklık sistemin şu an çok güçlü. Vücudun virüslere ve bakterilere karşı tam koruma modunda. Hasta olma ihtimalin çok düşük.",
      color: "text-green-600"
    };
  } else if (score >= 50) {
    return {
      title: "Dengeli",
      desc: "Bağışıklığın normal seviyede ancak stres veya uykusuzluk seni hızlıca düşürebilir. Mevsim geçişlerinde dikkatli olmalısın.",
      color: "text-yellow-600"
    };
  } else {
    return {
      title: "Riskli Seviye",
      desc: "Vücut direncin şu an düşük. Bu durum, sık sık hasta olmana, yorgun hissetmene ve iyileşme sürecinin uzamasına neden olabilir. Acilen dinlenmeye ihtiyacın var.",
      color: "text-red-600"
    };
  }
};

export const generateDailyFeedback = (log: DailyLog, profile: UserProfile): string => {
  // Enhanced Report Generation with Storytelling
  
  const intro = `Merhaba ${profile.name}, bugünkü verilerini detaylıca inceledim.`;
  
  // 1. Mood & Stress Context
  let moodSection = "";
  if (log.mood) {
    const moodMap: any = { happy: 'mutlu', energetic: 'enerjik', tired: 'yorgun', sad: 'üzgün', anxious: 'kaygılı', neutral: 'normal' };
    moodSection = `Bugün kendini **${moodMap[log.mood]}** hissediyorsun. `;
    if (log.mood === 'anxious' || log.mood === 'tired') {
       if (log.stressLevel > 6) moodSection += "Stres seviyenin yüksek olması bu hissi tetikliyor olabilir. ";
       else moodSection += "Stresin düşük olsa da belki fiziksel yorgunluk seni etkiliyor. ";
    }
  }

  // 2. Day Type Context
  let daySection = "";
  if (log.dayType === 'exam') {
    daySection = "Bugün bir **sınav günüydü**, bu yüzden stres seviyendeki artışlar çok normal. Vücudun 'savaş ya da kaç' modunda çalıştı. Şimdi dinlenme zamanı.";
  } else if (log.dayType === 'sick') {
    daySection = "Bugün **hasta** olduğunu belirttin. Geçmiş olsun! Şu an en önemli şey uyku ve sıvı tüketimi.";
  } else if (log.dayType === 'weekend') {
    daySection = "Hafta sonunun tadını çıkarıyorsun. ";
  }

  // 3. Screen Time Warning
  let screenSection = "";
  if (log.screenTime && log.screenTime > 6) {
    screenSection = `⚠️ **DİKKAT:** Ekran süren ${log.screenTime} saat ile oldukça yüksek. Bu durum 'dijital göz yorgunluğu'na ve uyku kalitesinde düşüşe yol açabilir. Yatmadan 1 saat önce mavi ışıktan uzak durmalısın.`;
  } else if (log.screenTime && log.screenTime > 3) {
    screenSection = "Ekran süren makul seviyede.";
  }

  // 4. Physical Analysis
  let physicalSection = "";
  if (log.sleepHours < 6.5) physicalSection += "Uyku süren biyolojik yenilenme için yetersiz kalmış. ";
  else physicalSection += "Uyku süren ideal aralıkta, bu bağışıklığını destekliyor. ";
  
  if (log.waterIntake < 2) physicalSection += "Ancak su tüketimin hedefin altında kalmış, baş ağrısı yaşamamak için 2 bardağa daha ihtiyacın var.";
  else physicalSection += "Hidrasyon seviyen harika.";

  // 5. Final Advice
  let advice = "";
  if (log.dayType === 'exam' || log.stressLevel > 7) {
    advice = "🧘‍♂️ **ÖNERİ:** Bugün zihnin çok yoruldu. Uyumadan önce ılık bir duş al ve 10 dakika telefonsuz zaman geçir.";
  } else if (log.nutritionScore > 7 && log.sleepHours > 7) {
    advice = "💪 **ÖNERİ:** Vücudun şu an çok dirençli! Yarın için zorlu hedefler koyabilirsin.";
  } else {
    advice = "💤 **ÖNERİ:** Vücudunu dinlendirmek için bu akşam erken uyu.";
  }

  return `
  ${intro}
  
  ${moodSection} ${daySection}
  
  📱 **DİJİTAL DENGE:** ${screenSection}
  
  🧪 **FİZİKSEL DURUM:** ${physicalSection}
  
  ${advice}
  `.trim();
};

export const processOfflineQuery = async (query: string, profile: UserProfile): Promise<string> => {
  try {
    const payload = {
      query: query,
      profile: profile,
      timestamp: new Date().toISOString()
    };

    const response = await fetch(PYTHON_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    return data.response || "Python API boş bir cevap döndürdü.";

  } catch (error) {
    console.error("Python API Connection Error:", error);
    return `⚠️ HATA: Python Kural Motoruna (${PYTHON_API_URL}) bağlanılamadı.\n\nEğer Vercel üzerindeydeniz, Python API'nin HTTPS destekli bir sunucuda olduğundan emin olun. (Hata: ${error})`;
  }
};