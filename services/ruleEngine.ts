
import { UserProfile, DailyLog, SymptomLog } from '../types';
import rulesData from './rules.json';

// --- PERSONAL HEALTH MEMORY (PHM) ANALYZER ---
export const calculateMemoryImmunityScore = (profile: UserProfile): number => {
  const logs = profile.dailyLogs;
  const symptoms = profile.symptomHistory;
  
  if (logs.length === 0) return 80; // Default starting score

  const lastLog = logs[logs.length - 1];
  const last7Days = logs.slice(-7);
  const last14DaysSymptoms = symptoms.filter(s => {
    const symptomDate = new Date(s.timestamp);
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    return symptomDate > fourteenDaysAgo;
  });

  // 1. Current Stats Impact (40%)
  let currentBase = 100;
  currentBase -= (lastLog.stressLevel * 2);
  currentBase -= (lastLog.fatigueLevel * 2);
  currentBase -= ((10 - lastLog.nutritionScore) * 2);
  if (lastLog.sleepHours < 7) currentBase -= 10;
  if (lastLog.waterIntake < 2) currentBase -= 5;

  // 2. Memory/Trend Impact (40%)
  let trendPenalty = 0;
  const avgStress = last7Days.reduce((a, b) => a + b.stressLevel, 0) / (last7Days.length || 1);
  const avgSleep = last7Days.reduce((a, b) => a + b.sleepHours, 0) / (last7Days.length || 1);
  
  if (avgStress > 7) trendPenalty += 15; // Chronic stress
  if (avgSleep < 6.5) trendPenalty += 10; // Chronic sleep deprivation
  
  // 3. Symptom Frequency Impact (20%)
  // Frequent symptoms in short time are signs of low immunity
  const symptomPenalty = Math.min(last14DaysSymptoms.length * 8, 30);

  const finalScore = (currentBase * 0.4) + ((100 - trendPenalty) * 0.4) + ((100 - symptomPenalty) * 0.2);
  
  return Math.max(0, Math.min(100, Math.round(finalScore)));
};

export const getBMICategory = (bmi: number): string => {
  if (bmi < 18.5) return "Zayıf";
  if (bmi < 24.9) return "Normal Kilolu";
  if (bmi < 29.9) return "Fazla Kilolu";
  return "Obezite";
};

export const generateDailyFeedback = (log: DailyLog, profile: UserProfile): string => {
  const score = calculateMemoryImmunityScore(profile);
  const last7Days = profile.dailyLogs.slice(-7);
  
  let insight = `### Kişisel Sağlık Raporun\n\n`;
  insight += `**Bugünkü Bağışıklık Skorun: ${score}/100**\n\n`;

  // Memory based feedback
  const symptomsCount = profile.symptomHistory.length;
  if (symptomsCount > 3) {
    insight += `⚠️ **Hafıza Analizi:** Son zamanlarda semptom sıklığında bir artış gözlemliyorum. Vücudun sana biraz yavaşlaman gerektiğini söylüyor olabilir.\n\n`;
  }

  if (log.stressLevel > 7) {
    insight += `🧘 **Stres Yönetimi:** Stres seviyen bugün yüksek. Hafızamdaki verilere göre stresli günlerinde uykun da etkileniyor. Bu döngüyü kırmak için bu akşam bitki çayı ve kitap okumayı dene.\n\n`;
  }

  if (log.nutritionScore < 6) {
    insight += `🍎 **Beslenme:** Bugünkü beslenme kaliten ortalamanın altında. Bağışıklığını PHM (Sağlık Hafızası) üzerinden stabilize etmek için yarın C vitamini ağırlıklı beslenmelisin.\n\n`;
  } else {
    insight += `🌟 **Tebrikler:** Harika bir beslenme günü! Hafızandaki en iyi günlerden biri bu. Bu enerjiyle yarın çok daha zinde uyanacaksın.\n\n`;
  }

  insight += `*Unutma, her küçük adım senin büyük sağlık hikayenin bir parçası!*`;
  
  return insight;
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

// --- Missing functions fix ---

/**
 * Calculates Body Fat percentage using the U.S. Navy Method.
 */
export const calculateBodyFat = (gender: 'male' | 'female' | 'other', waist: number, neck: number, height: number, hip: number = 0): number => {
  if (waist <= 0 || neck <= 0 || height <= 0 || (gender === 'female' && hip <= 0)) return 0;

  let bodyFat = 0;
  if (gender === 'male' || gender === 'other') {
    // US Navy Method (Male)
    bodyFat = 495 / (1.0324 - 0.19077 * Math.log10(waist - neck) + 0.15456 * Math.log10(height)) - 450;
  } else {
    // US Navy Method (Female)
    bodyFat = 495 / (1.29579 - 0.35004 * Math.log10(waist + hip - neck) + 0.22100 * Math.log10(height)) - 450;
  }
  return Math.max(0, Math.round(bodyFat * 10) / 10);
};

/**
 * Categorizes body fat percentage based on gender.
 */
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

/**
 * Processes a query using a local rule set for offline availability.
 */
export const processOfflineQuery = async (query: string, profile: UserProfile): Promise<{
  response: string;
  doctorNote?: string;
  risk: 'low' | 'medium' | 'high';
  disease?: string;
}> => {
  const q = query.toLowerCase();
  
  if (q.includes("baş ağrısı")) {
    return {
      response: "Baş ağrısı birçok nedenden kaynaklanabilir. Su tüketiminizi kontrol edin ve dinlenin. Eğer şiddetliyse bir uzmana danışın.",
      risk: 'low',
      disease: 'Gerilim Tipi Baş Ağrısı'
    };
  }
  
  if (q.includes("ateş") || q.includes("öksürük")) {
    return {
      response: "Ateş ve öksürük enfeksiyon belirtisi olabilir. Bol sıvı tüketin ve dinlenin. Ateşiniz 38.5 derecenin üzerine çıkarsa doktora başvurun.",
      doctorNote: `Hasta şikayeti: ${query}\nYaş: ${profile.age}\nSon Bağışıklık Skoru: ${profile.dailyLogs[profile.dailyLogs.length-1]?.immunityScore || 'N/A'}`,
      risk: 'medium',
      disease: 'Üst Solunum Yolu Enfeksiyonu'
    };
  }

  if (q.includes("göğüs ağrısı") || q.includes("nefes darlığı")) {
    return {
      response: "DİKKAT: Göğüs ağrısı ve nefes darlığı acil bir durumun işareti olabilir. Lütfen HEMEN en yakın acil servise başvurun veya 112'yi arayın.",
      doctorNote: "ACİL DURUM ŞÜPHESİ. Hasta göğüs ağrısı/nefes darlığı bildirdi.",
      risk: 'high',
      disease: 'Kardiyovasküler Risk'
    };
  }

  return {
    response: "Çevrimdışı moddayım. Bu soru için geniş bir analiz yapamıyorum ancak genel sağlık verilerinizi takip etmeye devam ediyorum. Daha detaylı bilgi için lütfen internet bağlantınızı kontrol edin.",
    risk: 'low'
  };
};
