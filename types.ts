
export interface CustomBloodValue {
  id: string;
  name: string;
  value: number;
  unit: string;
}

export interface BloodValues {
  iron: number;
  ferritin: number;
  b12: number;
  d3: number;
  wbc: number; // White Blood Cells
  hemoglobin: number;
  magnesium: number;
  glucose: number; // Fasting Glucose
  tsh: number; // Thyroid
  lastTestDate: string;
  customValues: CustomBloodValue[]; // New field for user-added tests
}

export interface SymptomLog {
  id: string;
  timestamp: string; // ISO Date
  symptom: string;
  severity?: string; // e.g., "High", "Mild", "3/10"
  duration?: string; // e.g., "2 days"
  notes?: string;
}

// --- NEW DIET INTERFACES ---
export interface Meal {
  id: string;
  name: string;
  calories: number;
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
}

export interface DailyExercise {
  id: string;
  name: string;
  durationMinutes: number;
  caloriesBurned: number;
}
// ---------------------------

// --- ATHLETE & PERFORMANCE INTERFACES ---
export interface PerformanceLog {
  id: string;
  date: string;
  activityType: string; // e.g., "Koşu", "Ağırlık", "HIIT"
  durationMinutes: number;
  intensity: number; // 1-10 (RPE)
  feeling: 'strong' | 'tired' | 'injured' | 'normal';
  notes: string;
  aiFeedback?: string;
}

export interface AppPreferences {
  theme: 'light' | 'dark';
  isAthleteMode: boolean;
}
// ----------------------------------------

export type MoodType = 'happy' | 'neutral' | 'sad' | 'anxious' | 'tired' | 'energetic';
export type DayType = 'school' | 'weekend' | 'exam' | 'sick' | 'holiday';

export interface DailyLog {
  date: string;
  stressLevel: number; // 1-10
  fatigueLevel: number; // 1-10
  nutritionScore: number; // 1-10
  sleepHours: number;
  waterIntake: number; // Liters
  symptoms: string[];
  immunityScore: number; // Calculated
  
  // New Enhanced Fields
  mood?: MoodType;
  screenTime?: number; // Hours
  dayType?: DayType;
  userNotes?: string;

  dailyAdvice?: string; // Auto-generated detailed feedback
  
  // Diet Tracking
  meals?: Meal[];
  exercises?: DailyExercise[];
  totalCaloriesIn?: number;
  totalCaloriesOut?: number; // Exercise + BMR (Active Energy)
}

export interface BodyMeasurements {
  neck: number; // cm
  waist: number; // cm
  hip: number; // cm (only needed for female)
  bodyFatPercentage?: number;
  calculatedDate?: string;
}

export interface UserProfile {
  name: string;
  age: number;
  weight: number;
  height: number;
  bmi: number; // Body Mass Index
  gender: 'male' | 'female' | 'other';
  bloodValues: BloodValues;
  dailyLogs: DailyLog[];
  symptomHistory: SymptomLog[];
  measurements?: BodyMeasurements; // New field for Fitness Page
  
  // New Preferences Field
  preferences: AppPreferences;
  performanceLogs: PerformanceLog[];

  // Device Integrations
  connectedDevice?: {
    id: string;
    name: string;
    type: 'watch' | 'band' | 'app';
    lastSync: string;
    isConnected: boolean;
  };
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  isOfflineResponse?: boolean;
}

export const INITIAL_PROFILE: UserProfile = {
  name: "Öğrenci",
  age: 17,
  weight: 70,
  height: 175,
  bmi: 22.8,
  gender: 'male',
  bloodValues: {
    iron: 80,
    ferritin: 50,
    b12: 400,
    d3: 30,
    wbc: 6000,
    hemoglobin: 14,
    magnesium: 2.1,
    glucose: 90,
    tsh: 1.5,
    lastTestDate: new Date().toISOString().split('T')[0],
    customValues: []
  },
  dailyLogs: [],
  symptomHistory: [],
  measurements: {
    neck: 0,
    waist: 0,
    hip: 0
  },
  preferences: {
    theme: 'light',
    isAthleteMode: false
  },
  performanceLogs: []
};

// Common Symptoms for selection - Expanded List
export const SYMPTOMS_LIST = [
  // Genel
  "Baş Ağrısı", "Ateş", "Halsizlik", "Yorgunluk", "Titreme", "Terleme", "Üşüme",
  // KBB & Solunum
  "Boğaz Ağrısı", "Öksürük", "Burun Akıntısı", "Burun Tıkanıklığı", "Nefes Darlığı", "Hapşırma", "Ses Kısıklığı", "Tat/Koku Kaybı",
  // Sindirim
  "Mide Bulantısı", "Kusma", "Karın Ağrısı", "İshal", "Kabızlık", "Mide Yanması", "İştahsızlık", "Şişkinlik",
  // Kas & İskelet
  "Kas Ağrısı", "Eklem Ağrısı", "Bel Ağrısı", "Boyun Ağrısı", "Sırt Ağrısı", "Kramp",
  // Nörolojik & Psikolojik
  "Baş Dönmesi", "Uykusuzluk", "Odaklanma Sorunu", "Sinirlilik", "Unutkanlık", "Göz Yorgunluğu", "Çarpıntı",
  // Cilt
  "Cilt Döküntüsü", "Kaşıntı", "Göz Kızarıklığı"
];
