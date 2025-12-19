
import React, { useState, useEffect } from 'react';
import { DailyLog, SYMPTOMS_LIST, UserProfile, MoodType, DayType } from '../types';
import { Save, Clock, CalendarCheck, CheckCircle2, Utensils, Edit2, X, Smile, Meh, Frown, Zap, Coffee, Battery, Monitor, BookOpen, Thermometer, Calendar, ShieldCheck, Sparkles, MessageSquare } from 'lucide-react';
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
  { id: 'school', label: 'Okul', icon: <BookOpen size={18}/> },
  { id: 'exam', label: 'Sınav', icon: <Edit2 size={18}/> },
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

    const immunityScore = calculateMemoryImmunityScore({ ...profile, dailyLogs: [...profile.dailyLogs, tempLog] });
    const advice = generateDailyFeedback(tempLog, { ...profile, dailyLogs: [...profile.dailyLogs, tempLog] });
    
    onSave({ ...tempLog, immunityScore, dailyAdvice: advice });
    setIsEditing(false);
  };

  if (existingLog && !isEditing) {
    return (
      <div className="p-4 pb-24 max-w-2xl mx-auto space-y-6">
        <header className="flex justify-between items-center">
           <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Gün Özeti</h2>
           <button onClick={() => setIsEditing(true)} className="p-3 bg-gray-100 dark:bg-navy-800 rounded-2xl text-gray-600 dark:text-gray-300 active:scale-95 transition">
             <Edit2 size={20} />
           </button>
        </header>

        <div className="bg-gradient-to-br from-teal-600 to-emerald-700 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden">
           <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
           <div className="flex items-center justify-between mb-6">
              <ShieldCheck size={48} className="text-teal-200" />
              <div className="text-right">
                 <div className="text-[10px] font-black uppercase tracking-widest opacity-70">Günlük Yaşam Tarzı Puanı</div>
                 <div className="text-6xl font-black">{existingLog.immunityScore}</div>
              </div>
           </div>
           <p className="text-sm font-medium leading-relaxed opacity-90 italic">
              "Yaşam tarzı hafızan bugün %{existingLog.immunityScore} verimlilikle kaydedildi."
           </p>
        </div>

        <div className="bg-white dark:bg-navy-900 p-8 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-navy-800">
           <div className="flex items-center gap-2 mb-6">
              <Sparkles size={24} className="text-indigo-500" />
              <h3 className="font-black text-lg text-gray-800 dark:text-gray-200">Asistan Analizi</h3>
           </div>
           <div className="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-400 whitespace-pre-wrap leading-relaxed">
              {formatReport(existingLog.dailyAdvice || "")}
           </div>
        </div>

        {existingLog.userNotes && (
           <div className="bg-gray-50 dark:bg-navy-800 p-6 rounded-3xl border border-gray-100 dark:border-navy-700">
              <div className="text-[10px] font-black text-gray-400 uppercase mb-2 flex items-center gap-1"><MessageSquare size={12}/> Günlük Notlarım</div>
              <p className="text-sm text-gray-700 dark:text-gray-300 italic">"{existingLog.userNotes}"</p>
           </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto space-y-6">
      <header>
        <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Veri Girişi</h2>
        <p className="text-gray-500 text-sm">Bugünü sağlık hafızana işle.</p>
      </header>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white dark:bg-navy-900 p-6 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-navy-800 space-y-8">
           
           <div>
              <label className="text-[10px] font-black text-gray-400 mb-4 block uppercase tracking-widest">Günün Tipi</label>
              <div className="grid grid-cols-5 gap-2">
                 {DAY_TYPES.map(dt => (
                    <button type="button" key={dt.id} onClick={() => setDayType(dt.id)} className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all active:scale-95 ${dayType === dt.id ? 'bg-teal-50 border-teal-500 text-teal-600' : 'bg-gray-50 dark:bg-navy-950 border-transparent text-gray-400'}`}>
                       {dt.icon}
                       <span className="text-[9px] font-bold mt-2 text-center">{dt.label}</span>
                    </button>
                 ))}
              </div>
           </div>

           <div>
              <label className="text-[10px] font-black text-gray-400 mb-4 block uppercase tracking-widest">Duygu Durumu</label>
              <div className="grid grid-cols-3 gap-2">
                 {MOODS.map(m => (
                    <button type="button" key={m.id} onClick={() => setMood(m.id)} className={`flex flex-col items-center justify-center p-4 rounded-3xl border-2 transition-all active:scale-95 ${mood === m.id ? m.color + ' ring-4 ring-teal-500/10 border-current' : 'bg-gray-50 dark:bg-navy-950 border-transparent text-gray-400'}`}>
                       {m.icon}
                       <span className="text-[10px] font-black mt-2 uppercase">{m.label}</span>
                    </button>
                 ))}
              </div>
           </div>

           <div className="space-y-6">
              <div>
                <label className="flex justify-between text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest">Beslenme Kalitesi <span>{nutrition}/10</span></label>
                <input type="range" min="1" max="10" value={nutrition} onChange={e => setNutrition(Number(e.target.value))} className="w-full h-3 bg-gray-100 dark:bg-navy-950 rounded-full appearance-none cursor-pointer accent-teal-600"/>
              </div>
              <div>
                <label className="flex justify-between text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest">Stres Seviyesi <span>{stress}/10</span></label>
                <input type="range" min="1" max="10" value={stress} onChange={e => setStress(Number(e.target.value))} className="w-full h-3 bg-gray-100 dark:bg-navy-950 rounded-full appearance-none cursor-pointer accent-orange-500"/>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest">Uyku (Saat)</label>
                    <input type="number" value={sleep} onChange={e => setSleep(Number(e.target.value))} className="w-full p-4 bg-gray-50 dark:bg-navy-950 dark:text-white rounded-3xl border-none font-black text-2xl focus:ring-2 focus:ring-teal-500 outline-none transition-all"/>
                 </div>
                 <div>
                    <label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest">Su (Litre)</label>
                    <input type="number" step="0.1" value={water} onChange={e => setWater(Number(e.target.value))} className="w-full p-4 bg-gray-50 dark:bg-navy-950 dark:text-white rounded-3xl border-none font-black text-2xl focus:ring-2 focus:ring-teal-500 outline-none transition-all"/>
                 </div>
              </div>
           </div>
        </div>

        <div className="bg-white dark:bg-navy-900 p-6 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-navy-800">
           <label className="font-black text-gray-800 dark:text-gray-200 mb-4 block uppercase text-[10px] tracking-widest">Hastalık Belirtileri</label>
           <div className="flex flex-wrap gap-2">
             {SYMPTOMS_LIST.slice(0, 18).map(s => (
               <button key={s} type="button" onClick={() => setSelectedSymptoms(prev => prev.includes(s) ? prev.filter(x => x!==s) : [...prev, s])} className={`px-4 py-2 rounded-full text-[10px] font-bold transition-all active:scale-95 ${selectedSymptoms.includes(s) ? 'bg-red-500 text-white shadow-lg' : 'bg-gray-50 dark:bg-navy-950 text-gray-500 border border-gray-100 dark:border-navy-800'}`}>
                 {s}
               </button>
             ))}
           </div>
        </div>

        <div className="bg-white dark:bg-navy-900 p-6 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-navy-800">
           <label className="font-black text-gray-800 dark:text-gray-200 mb-2 block uppercase text-[10px] tracking-widest">Kişisel Notlar</label>
           <textarea 
             value={notes} 
             onChange={e => setNotes(e.target.value)} 
             placeholder="Bugün kendimi nasıl hissediyorum? Bir not bırak..."
             className="w-full p-5 bg-gray-50 dark:bg-navy-950 dark:text-white rounded-3xl border-none text-sm outline-none focus:ring-2 focus:ring-teal-500 h-28 resize-none transition-all"
           />
        </div>

        <button type="submit" className="w-full py-6 bg-teal-600 hover:bg-teal-700 text-white font-black rounded-[2.5rem] shadow-2xl transition active:scale-[0.98] text-lg flex items-center justify-center gap-3">
           <Save size={24} /> GÜNÜ TAMAMLA
        </button>
      </form>
    </div>
  );
};
