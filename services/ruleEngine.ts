
import { UserProfile, DailyLog, SymptomLog } from '../types';
import rulesData from './rules.json';

// --- PERSONAL HEALTH MEMORY (PHM) SCORE CALCULATION ---
// Bu skor artık günlük değil, hafıza tabanlı kümülatif bir kapasite skorudur.
export const calculateMemoryImmunityScore = (profile: UserProfile): number => {
  const logs = profile.dailyLogs;
  const symptoms = profile.symptomHistory;
  
  if (logs.length === 0) return 100; // Yeni kullanıcı için tam kapasite

  // Son 30 günlük pencereyi analiz et
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentLogs = logs.filter(l => new Date(l.date) >= thirtyDaysAgo);
  const recentSymptoms = symptoms.filter(s => new Date(s.timestamp) >= thirtyDaysAgo);

  // 1. Yaşam Tarzı Hafızası (%50 Etki)
  let lifestyleScore = 100;
  if (recentLogs.length > 0) {
    const avgStress = recentLogs.reduce((a, b) => a + b.stressLevel, 0) / recentLogs.length;
    const avgSleep = recentLogs.reduce((a, b) => a + b.sleepHours, 0) / recentLogs.length;
    const avgNutrition = recentLogs.reduce((a, b) => a + (b.nutritionScore || 5), 0) / recentLogs.length;
    const avgWater = recentLogs.reduce((a, b) => a + b.waterIntake, 0) / recentLogs.length;

    lifestyleScore -= (avgStress * 3); // Kronik stres en büyük düşman
    lifestyleScore -= (Math.max(0, 7.5 - avgSleep) * 8); // Uyku borcu
    lifestyleScore -= (Math.max(0, 8 - avgNutrition) * 4); // Beslenme eksikliği
    lifestyleScore -= (Math.max(0, 2 - avgWater) * 5); // Hidrasyon hafızası
  }

  // 2. Semptom Yükü Hafızası (%50 Etki)
  // Semptom adeti, sıklığı ve süresi bağışıklık hafızasını düşürür
  let symptomPenalty = 0;
  if (recentSymptoms.length > 0) {
    // Farklı semptom türlerinin sayısı (Çeşitlilik)
    const uniqueSymptoms = new Set(recentSymptoms.map(s => s.symptom)).size;
    symptomPenalty += uniqueSymptoms * 10;

    // Semptomların toplam sıklığı
    symptomPenalty += recentSymptoms.length * 2;

    // Şiddetli semptomlar varsa ek ceza
    const severeCount = recentSymptoms.filter(s => s.severity === 'High' || s.severity === '8/10').length;
    symptomPenalty += severeCount * 15;
  }

  const finalScore = (lifestyleScore * 0.5) + (Math.max(0, 100 - symptomPenalty) * 0.5);
  
  return Math.max(0, Math.min(100, Math.round(finalScore)));
};

export const generateDailyFeedback = (log: DailyLog, profile: UserProfile): string => {
  const currentMemoryScore = calculateMemoryImmunityScore(profile);
  
  const motivationMessages = [
    "Harikasın! Vücudun bu disiplini hafızasına kaydediyor. 🌟",
    "Adım adım daha güçlü bir bağışıklığa! Sağlık hafızan bugün parlıyor. ✨",
    "Vücudunla kurduğun bu bağ, gelecekteki 'sen' için en büyük yatırım. 💪",
    "Bugünkü seçimlerin, yarınki enerjin olacak. Hafıza güncellendi! 🚀"
  ];
  
  const randomMotivation = motivationMessages[Math.floor(Math.random() * motivationMessages.length)];

  let insight = `### Sağlık Hafızası Raporu\n\n`;
  insight += `**Genel Sağlık Kapasiten: %${currentMemoryScore}**\n\n`;
  insight += `> ${randomMotivation}\n\n`;

  if (log.symptoms.length > 0) {
    insight += `⚠️ **Semptom Analizi:** Bugün bildirdiğin belirtiler hafızaya işlendi. Eğer bu belirtiler son 7 günde 3'ten fazla tekrar ettiyse bir uzmana danışmanı öneririm.\n\n`;
  }

  if (log.sleepHours < 7) {
    insight += `💤 **Uyku Notu:** Hafızandaki uyku trendi düşüşte. Bağışıklık hücrelerinin yenilenmesi için bu gece 23:00'den önce uykuda olmaya çalış.\n\n`;
  }

  return insight;
};

export const getBMICategory = (bmi: number): string => {
  if (bmi < 18.5) return "Zayıf";
  if (bmi < 24.9) return "Normal Kilolu";
  if (bmi < 29.9) return "Fazla Kilolu";
  return "Obezite";
};

export const calculateBMR = (weight: number, height: number, age: number, gender: 'male' | 'female' | 'other'): number => {
  let bmr = (10 * weight) + (6.25 * height) - (5 * age);
  return gender === 'male' ? bmr + 5 : bmr - 161;
};

export const calculateCaloriesBurned = (activityMet: number, weightKg: number, durationMinutes: number): number => {
  return Math.round(activityMet * weightKg * (durationMinutes / 60));
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

export const calculateBodyFat = (gender: 'male' | 'female' | 'other', waist: number, neck: number, height: number, hip: number = 0): number => {
  if (waist <= 0 || neck <= 0 || height <= 0 || (gender === 'female' && hip <= 0)) return 0;
  let bodyFat = 0;
  if (gender === 'male' || gender === 'other') {
    bodyFat = 495 / (1.0324 - 0.19077 * Math.log10(waist - neck) + 0.15456 * Math.log10(height)) - 450;
  } else {
    bodyFat = 495 / (1.29579 - 0.35004 * Math.log10(waist + hip - neck) + 0.22100 * Math.log10(height)) - 450;
  }
  return Math.max(0, Math.round(bodyFat * 10) / 10);
};

export const getBodyFatCategory = (fat: number, gender: 'male' | 'female' | 'other'): string => {
  if (fat <= 0) return "Bilinmiyor";
  if (gender === 'male' || gender === 'other') {
    if (fat < 6) return "Temel Yağ";
    if (fat < 14) return "Sporcu";
    if (fat < 18) return "Fitness";
    if (fat < 25) return "Ortalama";
    return "Obezite";
  } else {
    if (fat < 14) return "Temel Yağ";
    if (fat < 21) return "Sporcu";
    if (fat < 25) return "Fitness";
    if (fat < 32) return "Ortalama";
    return "Obezite";
  }
};

export const processOfflineQuery = async (query: string, profile: UserProfile): Promise<{
  response: string;
  doctorNote?: string;
  risk: 'low' | 'medium' | 'high';
  disease?: string;
}> => {
  const q = query.toLowerCase();
  if (q.includes("baş ağrısı")) return { response: "Baş ağrısı birçok nedenden kaynaklanabilir. Sağlık hafızandaki stres düzeyine bakılırsa dinlenmen gerekebilir.", risk: 'low', disease: 'Gerilim Tipi Baş Ağrısı' };
  if (q.includes("ateş") || q.includes("öksürük")) return { response: "Ateş ve öksürük enfeksiyon belirtisi olabilir. PHM verilerine göre son 14 günde benzer şikayetin olduysa mutlaka doktora görün.", risk: 'medium', disease: 'Üst Solunum Yolu Enfeksiyonu' };
  return { response: "Çevrimdışı moddayım. Hafızadaki kural setine göre temel analiz yapabiliyorum.", risk: 'low' };
};
