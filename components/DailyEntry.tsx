
import React, { useState, useEffect } from 'react';
import { DailyLog, SYMPTOMS_LIST, UserProfile, MoodType, DayType } from '../types';
import { Save, Clock, CalendarCheck, CheckCircle2, Utensils, Edit2, X, Smile, Meh, Frown, Zap, Coffee, Battery, Monitor, BookOpen, Thermometer, Calendar, ShieldCheck, Sparkles } from 'lucide-react';
import { generateDailyFeedback, calculateMemoryImmunityScore } from '../services/ruleEngine';

interface Props {
  onSave: (log: DailyLog) => void;
  profile: UserProfile;
}

const MOODS: { id: MoodType; label: string; icon: React.ReactNode; color: string }[] = [
  { id: 'happy', label: 'Mutlu', icon: <Smile size={24}/>, color: 'bg-green-100 text-green-600 border-green-200' },
  { id: 'energetic', label: 'Enerjik', icon: <Zap size={24}/>, color: 'bg-yellow-100 text-yellow-600 border-yellow-200' },
  { id: 'neutral', label: 'Normal', icon: <Meh size={24}/>, color: 'bg-gray-100 text-gray-600 border-gray-200' },
  { id: 'tired', label: 'Yorgun', icon: <Battery size={24}/>, color: 'bg-orange-100 text-orange-600 border-orange-200' },
  { id: 'anxious', label: 'Kaygılı', icon: <Coffee size={24}/>, color: 'bg-purple-100 text-purple-600 border-purple-200' },
  { id: 'sad', label: 'Üzgün', icon: <Frown size={24}/>, color: 'bg-blue-100 text-blue-600 border-blue-200' },
];

const DAY_TYPES: { id: DayType; label: string; icon: React.ReactNode }[] = [
  { id: 'school', label: 'Okul Günü', icon: <BookOpen size={18}/> },
  { id: 'exam', label: 'Sınav Günü', icon: <Edit2 size={18}/> },
  { id: 'weekend', label: 'Hafta Sonu', icon: <Coffee size={18}/> },
  { id: 'holiday', label: 'Tatil', icon: <Calendar size={18}/> },
  { id: 'sick', label: 'Hasta', icon: <Thermometer size={18}/> },
];

const formatReport = (text: string) => {
  if (!text) return null;
  return text.split(/(\*\*.*?\*\*|### .*?\n)/g).map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index} className="font-bold text-gray-900 dark:text-white">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('### ')) {
      return <h3 key={index} className="text-xl font-black text-teal-600 mb-2 mt-4">{part.slice(4)}</h3>;
    }
    return part;
  });
};

export const DailyEntry: React.FC<Props> = ({ onSave, profile }) => {
  const todayDateStr = new Date().toISOString().split('T')[0];
  const existingLog = profile.dailyLogs.find(log => log.date === todayDateStr);

  const [stress, setStress] = useState(5);
  const [fatigue, setFatigue] = useState(5);
  const [nutrition, setNutrition] = useState(5);
  const [sleep, setSleep] = useState(7);
  const [water, setWater] = useState(1.5);
  const [mood, setMood] = useState<MoodType>('neutral');
  const [screenTime, setScreenTime] = useState(4);
  const [dayType, setDayType] = useState<DayType>('school');
  const [notes, setNotes] = useState('');
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  
  const [isSaved, setIsSaved] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (existingLog) {
      setStress(existingLog.stressLevel);
      setFatigue(existingLog.fatigueLevel);
      setNutrition(existingLog.nutritionScore || 5);
      setSleep(existingLog.sleepHours);
      setWater(existingLog.waterIntake);
      setMood(existingLog.mood || 'neutral');
      setScreenTime(existingLog.screenTime || 4);
      setDayType(existingLog.dayType || 'school');
      setNotes(existingLog.userNotes || '');
      setSelectedSymptoms(existingLog.symptoms);
    }
  }, [existingLog]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Create temp log to calculate score with rules
    const tempLog: DailyLog = {
      date: todayDateStr,
      stressLevel: stress,
      fatigueLevel: fatigue,
      nutritionScore: nutrition,
      sleepHours: sleep,
      waterIntake: water,
      symptoms: selectedSymptoms,
      immunityScore: 0,
      mood,
      screenTime,
      dayType,
      userNotes: notes,
    };

    // Calculate score and advice using rule engine with memory
    const immunityScore = calculateMemoryImmunityScore({ ...profile, dailyLogs: [...profile.dailyLogs, tempLog] });
    const advice = generateDailyFeedback(tempLog, { ...profile, dailyLogs: [...profile.dailyLogs, tempLog] });
    
    onSave({ ...tempLog, immunityScore, dailyAdvice: advice });
    setIsSaved(true);
    setIsEditing(false);
  };

  if (existingLog && !isEditing) {
    return (
      <div className="p-4 pb-24 max-w-2xl mx-auto space-y-6">
        <header className="flex justify-between items-center">
           <h2 className="text-2xl font-black text-gray-900 dark:text-white">Günün Özeti</h2>
           <button onClick={() => setIsEditing(true)} className="p-3 bg-gray-100 dark:bg-navy-800 rounded-2xl text-gray-600 dark:text-gray-300">
             <Edit2 size={20} />
           </button>
        </header>

        {/* IMMUNITY CARD */}
        <div className="bg-gradient-to-br from-teal-600 to-emerald-700 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden">
           <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
           <div className="flex items-center justify-between mb-6">
              <ShieldCheck size={48} className="text-teal-200" />
              <div className="text-right">
                 <div className="text-xs font-bold uppercase tracking-widest opacity-70">Bağışıklık Skoru</div>
                 <div className="text-5xl font-black">{existingLog.immunityScore}</div>
              </div>
           </div>
           <p className="text-sm font-medium leading-relaxed opacity-90">
              Bu skor, bugünkü verilerin ve son 14 günlük sağlık hafızanın harmanlanmasıyla oluşturulmuştur.
           </p>
        </div>

        {/* AI ADVICE REPORT */}
        <div className="bg-white dark:bg-navy-900 p-8 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-navy-800">
           <div className="flex items-center gap-2 mb-6">
              <Sparkles size={24} className="text-indigo-500" />
              <h3 className="font-black text-lg text-gray-800 dark:text-gray-200">Asistan Analizi</h3>
           </div>
           <div className="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-400 whitespace-pre-wrap leading-relaxed">
              {formatReport(existingLog.dailyAdvice || "")}
           </div>
        </div>

        {/* QUICK STATS */}
        <div className="grid grid-cols-2 gap-4">
           <div className="bg-white dark:bg-navy-900 p-6 rounded-3xl border border-gray-50 dark:border-navy-800">
              <div className="text-xs font-bold text-gray-400 mb-1 uppercase">Su</div>
              <div className="text-2xl font-black text-blue-500">{existingLog.waterIntake} <span className="text-sm font-normal">Lt</span></div>
           </div>
           <div className="bg-white dark:bg-navy-900 p-6 rounded-3xl border border-gray-50 dark:border-navy-800">
              <div className="text-xs font-bold text-gray-400 mb-1 uppercase">Uyku</div>
              <div className="text-2xl font-black text-purple-500">{existingLog.sleepHours} <span className="text-sm font-normal">saat</span></div>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto space-y-6">
      <header>
        <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase">Günlük Veri Girişi</h2>
        <p className="text-gray-500 text-sm">Sağlık hafızanı güncelle ve skorunu hesapla.</p>
      </header>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white dark:bg-navy-900 p-6 rounded-[2rem] shadow-sm border border-gray-100 dark:border-navy-800 space-y-8">
           <div>
              <label className="text-sm font-bold text-gray-700 dark:text-gray-400 mb-4 block uppercase tracking-wider">Bugün Nasıl Hissediyorsun?</label>
              <div className="grid grid-cols-3 gap-2">
                 {MOODS.map(m => (
                    <button type="button" key={m.id} onClick={() => setMood(m.id)} className={`flex flex-col items-center justify-center p-4 rounded-3xl border-2 transition-all ${mood === m.id ? m.color + ' ring-4 ring-teal-500/10' : 'bg-gray-50 dark:bg-navy-950 border-transparent text-gray-400'}`}>
                       {m.icon}
                       <span className="text-[10px] font-black mt-2 uppercase">{m.label}</span>
                    </button>
                 ))}
              </div>
           </div>

           <div className="space-y-6">
              <div>
                <label className="flex justify-between text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase">Beslenme Kalitesi <span>{nutrition}/10</span></label>
                <input type="range" min="1" max="10" value={nutrition} onChange={e => setNutrition(Number(e.target.value))} className="w-full h-3 bg-gray-100 dark:bg-navy-950 rounded-full appearance-none cursor-pointer accent-teal-600"/>
              </div>
              <div>
                <label className="flex justify-between text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase">Stres Seviyesi <span>{stress}/10</span></label>
                <input type="range" min="1" max="10" value={stress} onChange={e => setStress(Number(e.target.value))} className="w-full h-3 bg-gray-100 dark:bg-navy-950 rounded-full appearance-none cursor-pointer accent-orange-500"/>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">Uyku (Saat)</label>
                    <input type="number" value={sleep} onChange={e => setSleep(Number(e.target.value))} className="w-full p-4 bg-gray-50 dark:bg-navy-950 rounded-2xl border-none font-black text-xl"/>
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">Su (Litre)</label>
                    <input type="number" step="0.1" value={water} onChange={e => setWater(Number(e.target.value))} className="w-full p-4 bg-gray-50 dark:bg-navy-950 rounded-2xl border-none font-black text-xl"/>
                 </div>
              </div>
           </div>
        </div>

        <div className="bg-white dark:bg-navy-900 p-6 rounded-[2rem] shadow-sm border border-gray-100 dark:border-navy-800">
           <label className="font-black text-gray-800 dark:text-gray-200 mb-4 block uppercase text-sm tracking-wider">Hastalık Belirtileri</label>
           <div className="flex flex-wrap gap-2">
             {SYMPTOMS_LIST.map(s => (
               <button key={s} type="button" onClick={() => setSelectedSymptoms(prev => prev.includes(s) ? prev.filter(x => x!==s) : [...prev, s])} className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${selectedSymptoms.includes(s) ? 'bg-red-500 text-white shadow-lg' : 'bg-gray-50 dark:bg-navy-950 text-gray-500 border border-gray-100 dark:border-navy-800'}`}>
                 {s}
               </button>
             ))}
           </div>
        </div>

        <button type="submit" className="w-full py-6 bg-teal-600 hover:bg-teal-700 text-white font-black rounded-[2rem] shadow-2xl transition active:scale-95 text-lg flex items-center justify-center gap-3">
           <Save /> VERİLERİ KAYDET VE ANALİZ ET
        </button>
      </form>
    </div>
  );
};
