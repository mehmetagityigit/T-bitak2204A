
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
  wbc: number;
  hemoglobin: number;
  magnesium: number;
  glucose: number;
  tsh: number;
  lastTestDate: string;
  customValues: CustomBloodValue[];
}

export interface SymptomLog {
  id: string;
  timestamp: string;
  symptom: string;
  severity?: string;
  duration?: string;
  notes?: string;
}

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

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  startDate: string;
  endDate: string;
  timesPerDay: number;
  times: string[]; // Specific times array: ["08:00", "20:00"]
  dosesTakenToday: number;
  lastTakenDate?: string;
}

export interface PerformanceLog {
  id: string;
  date: string;
  activityType: string;
  durationMinutes: number;
  intensity: number;
  feeling: 'strong' | 'tired' | 'injured' | 'normal';
  notes: string;
  aiFeedback?: string;
}

export interface AppPreferences {
  theme: 'light' | 'dark';
  isAthleteMode: boolean;
  accessibilityMode: boolean;
}

export type MoodType = 'happy' | 'neutral' | 'sad' | 'anxious' | 'tired' | 'energetic';
export type DayType = 'school' | 'weekend' | 'exam' | 'sick' | 'holiday';

export interface DailyLog {
  date: string;
  stressLevel: number;
  fatigueLevel: number;
  nutritionScore: number;
  sleepHours: number;
  waterIntake: number;
  symptoms: string[];
  immunityScore: number;
  mood?: MoodType;
  screenTime?: number;
  dayType?: DayType;
  userNotes?: string;
  dailyAdvice?: string;
  meals?: Meal[];
  exercises?: DailyExercise[];
  totalCaloriesIn?: number;
  totalCaloriesOut?: number;
}

export interface BodyMeasurements {
  neck: number;
  waist: number;
  hip: number;
  bodyFatPercentage?: number;
  calculatedDate?: string;
}

export interface UserProfile {
  name: string;
  phoneNumber?: string; // Optional Phone Number
  age: number;
  weight: number;
  height: number;
  bmi: number;
  gender: 'male' | 'female' | 'other';
  bloodValues: BloodValues;
  dailyLogs: DailyLog[];
  symptomHistory: SymptomLog[];
  measurements?: BodyMeasurements;
  preferences: AppPreferences;
  performanceLogs: PerformanceLog[];
  medications: Medication[];
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
  measurements: { neck: 0, waist: 0, hip: 0 },
  preferences: { theme: 'light', isAthleteMode: false, accessibilityMode: false },
  performanceLogs: [],
  medications: []
};

export const SYMPTOMS_LIST = [
  "Baş Ağrısı", "Ateş", "Halsizlik", "Yorgunluk", "Titreme", "Terleme", "Üşüme",
  "Boğaz Ağrısı", "Öksürük", "Burun Akıntısı", "Burun Tıkanıklığı", "Nefes Darlığı", "Hapşırma", "Ses Kısıklığı", "Tat/Koku Kaybı",
  "Mide Bulantısı", "Kusma", "Karın Ağrısı", "İshal", "Kabızlık", "Mide Yanması", "İştahsızlık", "Şişkinlik",
  "Kas Ağrısı", "Eklem Ağrısı", "Bel Ağrısı", "Boyun Ağrısı", "Sırt Ağrısı", "Kramp",
  "Baş Dönmesi", "Uykusuzluk", "Odaklanma Sorunu", "Sinirlilik", "Unutkanlık", "Göz Yorgunluğu", "Çarpıntı",
  "Cilt Döküntüsü", "Kaşıntı", "Göz Kızarıklığı"
];
