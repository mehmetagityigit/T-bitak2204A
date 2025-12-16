import { UserProfile, DailyLog } from '../types';

// Vercel veya diğer platformlarda Environment Variable olarak tanımlayabilirsiniz.
// Tanımlı değilse varsayılan olarak localhost kullanılır.
const PYTHON_API_URL = process.env.REACT_APP_PYTHON_API_URL || "http://localhost:5000/api/chat";

export const getBMICategory = (bmi: number): string => {
  if (bmi < 18.5) return "Zayıf";
  if (bmi < 24.9) return "Normal Kilolu";
  if (bmi < 29.9) return "Fazla Kilolu";
  return "Obezite";
};

/**
 * Calculates Body Fat Percentage using U.S. Navy Method
 */
export const calculateBodyFat = (
  gender: 'male' | 'female' | 'other',
  waist: number,
  neck: number,
  height: number,
  hip: number = 0
): number => {
  // Constants for calculation
  if (waist === 0 || neck === 0 || height === 0) return 0;
  
  // Formulas require LOG10.
  // Values must be in cm.
  
  if (gender === 'female') {
    if (hip === 0) return 0;
    // Female Formula: 163.205 * log10(waist + hip - neck) - 97.684 * log10(height) - 78.387
    const result = 163.205 * Math.log10(waist + hip - neck) - 97.684 * Math.log10(height) - 78.387;
    return Number(result.toFixed(1));
  } else {
    // Male Formula: 86.010 * log10(abdomen - neck) - 70.041 * log10(height) + 36.76
    // Note: 'waist' is used as abdomen here
    // Ensure argument for log is positive
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

/**
 * Calculates estimated calories burned based on MET values
 */
export const calculateCaloriesBurned = (activityMet: number, weightKg: number, durationMinutes: number): number => {
  // Formula: Calories = MET * Weight(kg) * Time(hours)
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

/**
 * Generates a daily feedback message based on the log data.
 * Used for immediate feedback in the DailyEntry component.
 */
export const generateDailyFeedback = (log: DailyLog, profile: UserProfile): string => {
  const generalAdvice = [];
  const nutritionAdvice = [];
  let sportsAdvice = "";

  // --- 1. General Analysis ---
  if (log.sleepHours < 6) generalAdvice.push("Uyku süren yetersiz, bu durum gün boyu odaklanma sorunu yaratabilir.");
  else if (log.sleepHours > 9) generalAdvice.push("Fazla uyumak metabolizmanı yavaşlatıp halsizlik yapabilir.");
  else generalAdvice.push("Uyku düzenin ideal, vücudun yenilenmiş görünüyor.");

  if (log.waterIntake < 1.5) generalAdvice.push("Su tüketimin çok düşük, baş ağrısı riskin var.");
  
  if (log.stressLevel > 7) generalAdvice.push("Stres seviyen alarm veriyor, bugün kendine 10 dakika nefes molası ver.");

  // --- 2. Nutrition Analysis ---
  const nutriScore = log.nutritionScore || 5;
  if (nutriScore < 4) {
    nutritionAdvice.push("Bugün beslenmen zayıf kalmış. Vücudun direnç kazanmak için proteine ve vitamine ihtiyaç duyuyor.");
  } else if (nutriScore < 7) {
    nutritionAdvice.push("Beslenmen fena değil ama daha fazla taze sebze/meyve tüketebilirsin.");
  } else {
    nutritionAdvice.push("Beslenme düzenin harika! Vücuduna ihtiyacı olan yakıtı vermişsin.");
  }

  // --- 3. Sports Readiness Calculation ---
  const isSick = log.symptoms.length > 0;
  const isTired = log.fatigueLevel > 7;
  const isStressed = log.stressLevel > 8;
  const isHungry = nutriScore < 3;

  if (isSick) {
    sportsAdvice = "❌ SPOR UYGUN DEĞİL: Vücudunda hastalık belirtileri var. Enerjini iyileşmek için kullanmalısın.";
  } else if (isTired || isStressed) {
    sportsAdvice = "⚠️ HAFİF TEMPO: Bugün vücudun yorgun veya stresli. Ağır antrenman yerine yoga veya hafif yürüyüş yap.";
  } else if (isHungry) {
    sportsAdvice = "⚠️ DİKKAT: Beslenmen zayıf olduğu için sporda performansın düşebilir. Önce kaliteli karbonhidrat almalısın.";
  } else {
    sportsAdvice = "✅ SPORA UYGUN: Fiziksel ve zihinsel durumun gayet iyi. Bugün antrenman yapmak için harika bir gün!";
  }

  return `
  📝 **GENEL ANALİZ:** ${generalAdvice.join(' ')}
  
  🍎 **BESLENME:** ${nutritionAdvice.join(' ')}
  
  🏃‍♂️ **SPOR DURUMU:** ${sportsAdvice}
  `.trim();
};

/**
 * Sends the user query and profile to a Python API via HTTP POST.
 * Returns the text response from the Python backend.
 */
export const processOfflineQuery = async (query: string, profile: UserProfile): Promise<string> => {
  try {
    // Preparing the payload
    // We send the whole profile so Python has context about BMI, Blood Values, and Logs.
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
    
    // Expecting JSON format: { "response": "Your answer here" }
    return data.response || "Python API boş bir cevap döndürdü.";

  } catch (error) {
    console.error("Python API Connection Error:", error);
    return `⚠️ HATA: Python Kural Motoruna (${PYTHON_API_URL}) bağlanılamadı.\n\nEğer Vercel üzerindeydeniz, Python API'nin HTTPS destekli bir sunucuda olduğundan emin olun. (Hata: ${error})`;
  }
};