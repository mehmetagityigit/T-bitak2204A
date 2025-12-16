import React, { useState, useEffect } from 'react';
import { DailyLog, SYMPTOMS_LIST, UserProfile, MoodType, DayType } from '../types';
import { Save, Clock, CalendarCheck, CheckCircle2, Utensils, Edit2, X, Smile, Meh, Frown, Zap, Coffee, Battery, Monitor, BookOpen, Thermometer, Calendar } from 'lucide-react';
import { generateDailyFeedback } from '../services/ruleEngine';

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
  return text.split(/(\*\*.*?\*\*)/g).map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index} className="font-bold text-gray-900">{part.slice(2, -2)}</strong>;
    }
    return part;
  });
};

export const DailyEntry: React.FC<Props> = ({ onSave, profile }) => {
  const todayDateStr = new Date().toISOString().split('T')[0];
  const existingLog = profile.dailyLogs.find(log => log.date === todayDateStr);

  // States
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
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

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

  const toggleSymptom = (symptom: string) => {
    if (selectedSymptoms.includes(symptom)) setSelectedSymptoms(selectedSymptoms.filter(s => s !== symptom));
    else setSelectedSymptoms([...selectedSymptoms, symptom]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Calculate Score Logic
    let score = 100;
    score -= (stress * 1.5); 
    score -= (fatigue * 1.5);
    score -= ((10 - nutrition) * 1.5); 
    if (sleep < 7) score -= 10;
    if (water < 2) score -= 5;
    score -= (selectedSymptoms.length * 5);
    if (profile.bloodValues.d3 < 30) score -= 5;
    
    const immunityScore = Math.max(0, Math.min(100, Math.round(score)));

    const tempLog: DailyLog = {
      date: todayDateStr,
      stressLevel: stress,
      fatigueLevel: fatigue,
      nutritionScore: nutrition,
      sleepHours: sleep,
      waterIntake: water,
      symptoms: selectedSymptoms,
      immunityScore: immunityScore,
      mood,
      screenTime,
      dayType,
      userNotes: notes,
      dailyAdvice: '' 
    };

    const advice = generateDailyFeedback(tempLog, profile);
    onSave({ ...tempLog, dailyAdvice: advice });
    setIsSaved(true);
    setIsEditing(false);
    setTimeout(() => setIsSaved(false), 2000);
  };

  // --- VIEW MODE ---
  if (existingLog && !isEditing) {
    return (
      <div className="p-4 pb-24 max-w-3xl mx-auto flex flex-col items-center min-h-[60vh] space-y-6">
        <div className="text-center w-full relative pt-8">
            {isSaved && <div className="absolute top-0 left-0 right-0 text-green-600 font-bold animate-bounce">Güncellendi!</div>}
            <div className="inline-flex bg-green-100 p-4 rounded-full text-green-600 mb-2 shadow-sm">
                <CheckCircle2 size={40} />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Verileriniz Kaydedildi</h2>
            <div className="flex items-center justify-center gap-2 mt-2 text-gray-500">
                <Clock size={16} />
                <span className="font-mono text-sm">{currentTime.toLocaleTimeString('tr-TR', {hour: '2-digit', minute:'2-digit'})}</span>
            </div>
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 w-full overflow-hidden">
           <div className="bg-teal-600 px-6 py-5 flex items-center justify-between text-white">
             <div className="flex items-center gap-3">
               <CalendarCheck size={24}/>
               <div>
                  <h3 className="text-lg font-bold">Günün Raporu</h3>
                  <p className="text-xs text-teal-100 opacity-80">{new Date().toLocaleDateString('tr-TR', {dateStyle: 'full'})}</p>
               </div>
             </div>
             <button onClick={() => setIsEditing(true)} className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition backdrop-blur-sm">
               <Edit2 size={16} /> Düzenle
             </button>
           </div>
           
           <div className="p-8">
                <div className="prose prose-lg prose-teal max-w-none text-gray-700 space-y-4 whitespace-pre-line leading-relaxed">
                    {formatReport(existingLog.dailyAdvice || "Verileriniz işleniyor...")}
                </div>
           </div>
           
           <div className="bg-gray-50 px-8 py-6 border-t border-gray-100 grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-sm">
             <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
               <span className="text-gray-400 text-xs uppercase font-bold block mb-1">Ruh Hali</span>
               <div className="text-2xl">{MOODS.find(m => m.id === existingLog.mood)?.icon}</div>
             </div>
             <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
               <span className="text-gray-400 text-xs uppercase font-bold block mb-1">Bağışıklık</span>
               <span className={`font-black text-xl ${existingLog.immunityScore > 70 ? 'text-green-600' : 'text-red-500'}`}>{existingLog.immunityScore}</span>
             </div>
             <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
               <span className="text-gray-400 text-xs uppercase font-bold block mb-1">Uyku</span>
               <span className="font-black text-xl text-purple-600">{existingLog.sleepHours}s</span>
             </div>
             <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
               <span className="text-gray-400 text-xs uppercase font-bold block mb-1">Ekran</span>
               <span className="font-black text-xl text-blue-600">{existingLog.screenTime}s</span>
             </div>
           </div>
        </div>
      </div>
    );
  }

  // --- EDIT FORM MODE ---
  return (
    <div className="p-4 pb-24 max-w-3xl mx-auto space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
            {isEditing && <button onClick={() => setIsEditing(false)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"><X size={20}/></button>}
            <h2 className="text-2xl font-bold text-gray-800">{isEditing ? "Verileri Düzenle" : "Günlük Veri Girişi"}</h2>
        </div>
        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100 self-start">
           <Clock size={18} className="text-teal-600" />
           <span className="text-lg font-mono font-bold text-gray-800">{currentTime.toLocaleTimeString('tr-TR', {hour: '2-digit', minute:'2-digit'})}</span>
        </div>
      </header>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* 1. Context Section (Mood, Day Type) */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-6">
           <div>
              <label className="text-sm font-bold text-gray-700 mb-3 block">Bugün Nasıl Hissediyorsun?</label>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                 {MOODS.map(m => (
                    <button type="button" key={m.id} onClick={() => setMood(m.id)} className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${mood === m.id ? m.color + ' ring-2 ring-offset-2 ring-teal-100' : 'bg-gray-50 border-transparent text-gray-400 hover:bg-gray-100'}`}>
                       {m.icon}
                       <span className="text-xs font-bold mt-2">{m.label}</span>
                    </button>
                 ))}
              </div>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                 <label className="text-sm font-bold text-gray-700 mb-2 block">Bugün Günlerden Ne?</label>
                 <div className="flex flex-wrap gap-2">
                    {DAY_TYPES.map(d => (
                       <button type="button" key={d.id} onClick={() => setDayType(d.id)} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${dayType === d.id ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                          {d.icon} {d.label}
                       </button>
                    ))}
                 </div>
              </div>
              <div>
                 <label className="text-sm font-bold text-gray-700 mb-2 block flex items-center gap-2"><Monitor size={16}/> Ekran Süresi (Saat)</label>
                 <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-200">
                    <input type="range" min="0" max="12" step="0.5" value={screenTime} onChange={e => setScreenTime(Number(e.target.value))} className="flex-1 h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-indigo-600"/>
                    <span className="font-bold text-indigo-600 w-12 text-center">{screenTime}s</span>
                 </div>
              </div>
           </div>
        </div>

        {/* 2. Vitals Section (Sliders) */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-6">
          <h3 className="font-bold text-gray-800 border-b pb-2">Fiziksel Durum</h3>
          
          <div>
            <label className="flex justify-between font-medium text-gray-700 mb-2 items-center">
              <span className="flex items-center gap-2"><Utensils size={16} className="text-orange-500"/> Beslenme Kalitesi</span>
              <span className="text-white font-bold bg-teal-500 px-2 py-0.5 rounded text-sm">{nutrition}/10</span>
            </label>
            <input type="range" min="1" max="10" value={nutrition} onChange={(e) => setNutrition(Number(e.target.value))} className="w-full h-2 bg-gradient-to-r from-red-200 via-yellow-200 to-green-200 rounded-lg appearance-none cursor-pointer"/>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div>
                <label className="flex justify-between font-medium text-gray-700 mb-2"><span>Stres Seviyesi</span><span className="font-bold text-gray-900">{stress}/10</span></label>
                <input type="range" min="1" max="10" value={stress} onChange={(e) => setStress(Number(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500"/>
             </div>
             <div>
                <label className="flex justify-between font-medium text-gray-700 mb-2"><span>Yorgunluk</span><span className="font-bold text-gray-900">{fatigue}/10</span></label>
                <input type="range" min="1" max="10" value={fatigue} onChange={(e) => setFatigue(Number(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-500"/>
             </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-100">
               <label className="block text-xs font-bold text-indigo-800 mb-1">Uyku (Saat)</label>
               <input type="number" min="0" max="24" step="0.5" value={sleep} onChange={e => setSleep(Number(e.target.value))} className="w-full p-2 bg-white border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-300 outline-none"/>
             </div>
             <div className="bg-blue-50 p-3 rounded-xl border border-blue-100">
               <label className="block text-xs font-bold text-blue-800 mb-1">Su (Litre)</label>
               <input type="number" min="0" max="10" step="0.1" value={water} onChange={e => setWater(Number(e.target.value))} className="w-full p-2 bg-white border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-300 outline-none"/>
             </div>
          </div>
        </div>

        {/* 3. Symptoms & Notes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
              <label className="font-bold text-gray-800 mb-3 block">Hastalık Belirtileri</label>
              <div className="flex flex-wrap gap-2">
                {SYMPTOMS_LIST.map(symptom => (
                  <button key={symptom} type="button" onClick={() => toggleSymptom(symptom)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${selectedSymptoms.includes(symptom) ? 'bg-red-500 text-white shadow-md' : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'}`}>
                    {symptom}
                  </button>
                ))}
              </div>
           </div>
           
           <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
              <label className="font-bold text-gray-800 mb-3 block">Günün Notu</label>
              <textarea 
                value={notes} 
                onChange={e => setNotes(e.target.value)}
                placeholder="Bugün önemli bir şey oldu mu? (Örn: Sınavdan yüksek aldım, çok koştum...)"
                className="w-full h-32 p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none resize-none text-sm"
              ></textarea>
           </div>
        </div>

        <button type="submit" className="w-full py-4 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-2xl shadow-xl transform transition active:scale-[0.99] flex items-center justify-center gap-2 text-lg">
          {isSaved ? "Kaydediliyor..." : <><Save size={22} /> Raporu Tamamla</>}
        </button>

      </form>
    </div>
  );
};