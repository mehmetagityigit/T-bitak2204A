import { UserProfile, DailyLog } from '../types';
import rulesData from './rules.json'; // JSON dosyasını import ediyoruz

// --- HELPER FUNCTIONS FOR CALCULATIONS (Existing) ---
export const getBMICategory = (bmi: number): string => {
  if (bmi < 18.5) return "Zayıf";
  if (bmi < 24.9) return "Normal Kilolu";
  if (bmi < 29.9) return "Fazla Kilolu";
  return "Obezite";
};

export const calculateBMR = (
  weight: number,
  height: number,
  age: number,
  gender: 'male' | 'female' | 'other'
): number => {
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

export const generateDailyFeedback = (log: DailyLog, profile: UserProfile): string => {
  const intro = `Merhaba ${profile.name}, bugünkü verilerini detaylıca inceledim.`;
  let moodSection = "";
  if (log.mood) {
    const moodMap: any = { happy: 'mutlu', energetic: 'enerjik', tired: 'yorgun', sad: 'üzgün', anxious: 'kaygılı', neutral: 'normal' };
    moodSection = `Bugün kendini **${moodMap[log.mood]}** hissediyorsun. `;
  }

  let screenSection = "";
  if (log.screenTime && log.screenTime > 6) {
    screenSection = `⚠️ **DİKKAT:** Ekran süren ${log.screenTime} saat ile oldukça yüksek.`;
  } else {
    screenSection = "Ekran süren makul seviyede.";
  }

  let physicalSection = "";
  if (log.sleepHours < 6.5) physicalSection += "Uyku süren yetersiz kalmış. ";
  else physicalSection += "Uyku süren ideal aralıkta. ";
  
  return `
  ${intro}
  ${moodSection}
  📱 **DİJİTAL DENGE:** ${screenSection}
  🧪 **FİZİKSEL DURUM:** ${physicalSection}
  `.trim();
};

// --- OFFLINE RULE ENGINE LOGIC (FUZZY MATCHING) ---

export interface OfflineResponse {
  response: string;
  risk: 'Low' | 'Medium' | 'High';
  doctorNote?: string;
  disease?: string;
}

interface HealthRule {
  symptoms: string[];
  risk: string;
  advice: string;
  disease?: string;
}

// Levenshtein Distance Algorithm: Calculates the minimum number of single-character edits needed to change one word into another.
function levenshteinDistance(a: string, b: string): number {
  const matrix = [];
  let i, j;

  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  for (i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (i = 1; i <= b.length; i++) {
    for (j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          Math.min(
            matrix[i][j - 1] + 1, // insertion
            matrix[i - 1][j] + 1 // deletion
          )
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

// Calculates a similarity score (0 to 1) between two phrases based on word matching.
function calculatePhraseSimilarity(userQuery: string, symptom: string): number {
  const queryWords = userQuery.toLowerCase().split(/\s+/).filter(w => w.length > 2); // Filter short words
  const symptomWords = symptom.toLowerCase().split(/\s+/).filter(w => w.length > 2);

  if (symptomWords.length === 0 || queryWords.length === 0) return 0;

  let totalMaxScore = 0;

  // For each word in the symptom, find the best matching word in the user query
  for (const sWord of symptomWords) {
    let maxWordScore = 0;
    for (const qWord of queryWords) {
      // 1. Check for exact containment (substring)
      if (qWord.includes(sWord) || sWord.includes(qWord)) {
        maxWordScore = Math.max(maxWordScore, 0.9); // High score for substring match
      } else {
        // 2. Fuzzy match using Levenshtein
        const dist = levenshteinDistance(sWord, qWord);
        const maxLength = Math.max(sWord.length, qWord.length);
        const similarity = 1 - (dist / maxLength);
        
        if (similarity > maxWordScore) {
          maxWordScore = similarity;
        }
      }
    }
    totalMaxScore += maxWordScore;
  }

  // Average score across all symptom words
  return totalMaxScore / symptomWords.length;
}

export const processOfflineQuery = async (query: string, profile: UserProfile): Promise<OfflineResponse> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 600));

  let bestRule: HealthRule | null = null;
  let bestScore = 0;

  // Threshold for accepting a match (0.0 - 1.0)
  // 0.45 tolerates differences like "cildim" vs "ciltte" quite well combined with containment logic
  const THRESHOLD = 0.45; 

  const allRules = rulesData.rules as HealthRule[];

  for (const rule of allRules) {
    // Check each symptom in the rule against the user query
    for (const symptom of rule.symptoms) {
      const score = calculatePhraseSimilarity(query, symptom);
      
      if (score > bestScore) {
        bestScore = score;
        bestRule = rule;
      }
    }
  }

  console.log(`Query: "${query}" -> Best Match: "${bestRule?.symptoms[0]}" with Score: ${bestScore.toFixed(2)}`);

  if (bestRule && bestScore > THRESHOLD) {
    let doctorNote = undefined;
    const riskLevel = bestRule.risk as 'Low' | 'Medium' | 'High';
    
    // Generate a doctor note for Medium/High risks
    if (riskLevel === 'Medium' || riskLevel === 'High') {
      doctorNote = `
TARİH: ${new Date().toLocaleDateString('tr-TR')}
HASTA: ${profile.name} (${profile.age} Yaş, ${profile.gender})
ŞİKAYET: "${query}"

ÖN DEĞERLENDİRME (Yerel Algoritma):
Tespit Edilen Belirti: ${bestRule.symptoms.join(', ')} (Benzerlik: %${(bestScore * 100).toFixed(0)})
Risk Seviyesi: ${riskLevel}

NOT: Hasta yukarıdaki şikayetlerle başvurmuştur. Klinik değerlendirme önerilir.
      `.trim();
    }

    return {
      response: bestRule.advice,
      risk: riskLevel,
      disease: bestRule.disease, // Some rules might have this field
      doctorNote: doctorNote
    };
  }

  // Fallback if no match found
  return {
    response: "Bu şikayeti çevrimdışı veritabanımda tam eşleştiremedim. Ancak genel sağlık için bol su içmeni, dinlenmeni ve şikayetin devam ederse bir uzmana görünmeni öneririm. İnternetin olduğunda 'Online Mod' ile yapay zekaya daha detaylı sorabilirsin.",
    risk: "Low"
  };
};