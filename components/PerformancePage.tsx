import React, { useState } from 'react';
import { UserProfile, PerformanceLog } from '../types';
import { Zap, Timer, TrendingUp, Activity, Save, Trophy, Calendar, Sparkles, Loader2, Dumbbell } from 'lucide-react';
import { analyzePerformance } from '../services/geminiService';

interface Props {
  profile: UserProfile;
  onUpdateProfile: (p: UserProfile) => void;
}

const formatText = (text: string) => {
  if (!text) return null;
  return text.split(/(\*\*.*?\*\*)/g).map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index} className="font-bold text-orange-400">{part.slice(2, -2)}</strong>;
    }
    return part;
  });
};

export const PerformancePage: React.FC<Props> = ({ profile, onUpdateProfile }) => {
  const [activityType, setActivityType] = useState('Koşu');
  const [duration, setDuration] = useState(45);
  const [intensity, setIntensity] = useState(7);
  const [feeling, setFeeling] = useState<'strong' | 'tired' | 'injured' | 'normal'>('normal');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const newLog: PerformanceLog = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      activityType,
      durationMinutes: duration,
      intensity,
      feeling,
      notes
    };

    // Get AI Feedback
    try {
      const feedback = await analyzePerformance(newLog, profile);
      newLog.aiFeedback = feedback;
    } catch (error) {
      console.error(error);
    }

    // Save
    const updatedProfile = {
      ...profile,
      performanceLogs: [newLog, ...profile.performanceLogs]
    };
    onUpdateProfile(updatedProfile);
    
    // Reset
    setNotes('');
    setIsSubmitting(false);
  };

  // Stats
  const totalMinutes = profile.performanceLogs.reduce((acc, log) => acc + log.durationMinutes, 0);
  const totalWorkouts = profile.performanceLogs.length;
  const avgIntensity = totalWorkouts > 0 
    ? (profile.performanceLogs.reduce((acc, log) => acc + log.intensity, 0) / totalWorkouts).toFixed(1) 
    : 0;

  return (
    <div className="p-4 pb-24 max-w-4xl mx-auto space-y-6">
      
      {/* HEADER */}
      <div className="flex items-center justify-between">
         <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
               <Zap className="text-orange-500 fill-orange-500" /> Performans Analizi
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Sporcu modu aktif. Sınırlarını zorla.</p>
         </div>
      </div>

      {/* STATS ROW */}
      <div className="grid grid-cols-3 gap-3">
         <div className="bg-gray-900 dark:bg-navy-800 p-4 rounded-2xl text-white shadow-lg relative overflow-hidden">
            <div className="relative z-10">
               <div className="text-xs text-gray-400 uppercase font-bold mb-1">Toplam Süre</div>
               <div className="text-2xl font-black">{totalMinutes} <span className="text-sm font-normal text-gray-400">dk</span></div>
            </div>
            <Timer className="absolute right-2 bottom-2 text-gray-800 dark:text-navy-700 opacity-50" size={48} />
         </div>
         <div className="bg-orange-500 p-4 rounded-2xl text-white shadow-lg relative overflow-hidden">
             <div className="relative z-10">
               <div className="text-xs text-orange-200 uppercase font-bold mb-1">Antrenman</div>
               <div className="text-2xl font-black">{totalWorkouts}</div>
            </div>
            <Trophy className="absolute right-2 bottom-2 text-orange-700 opacity-30" size={48} />
         </div>
         <div className="bg-white dark:bg-navy-800 p-4 rounded-2xl border border-gray-100 dark:border-navy-700 shadow-sm relative overflow-hidden">
             <div className="relative z-10">
               <div className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold mb-1">Ort. Şiddet</div>
               <div className="text-2xl font-black text-gray-800 dark:text-white">{avgIntensity}<span className="text-sm text-gray-400">/10</span></div>
            </div>
            <Activity className="absolute right-2 bottom-2 text-gray-100 dark:text-navy-700" size={48} />
         </div>
      </div>

      {/* INPUT FORM */}
      <div className="bg-white dark:bg-navy-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-navy-700">
         <h3 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <TrendingUp size={18} className="text-teal-500"/> Antrenman Kaydet
         </h3>
         <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1 block">Aktivite</label>
                  <select 
                     value={activityType} onChange={e => setActivityType(e.target.value)}
                     className="w-full p-3 bg-gray-50 dark:bg-navy-900 border border-gray-200 dark:border-navy-700 rounded-xl text-gray-800 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
                  >
                     <option>Koşu</option>
                     <option>Ağırlık Antrenmanı</option>
                     <option>Yüzme</option>
                     <option>Bisiklet</option>
                     <option>Futbol</option>
                     <option>Basketbol</option>
                     <option>HIIT</option>
                     <option>Yoga</option>
                  </select>
               </div>
               <div>
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1 block">Süre (Dk)</label>
                  <input 
                     type="number" value={duration} onChange={e => setDuration(Number(e.target.value))}
                     className="w-full p-3 bg-gray-50 dark:bg-navy-900 border border-gray-200 dark:border-navy-700 rounded-xl text-gray-800 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
                  />
               </div>
            </div>

            <div>
               <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1 block flex justify-between">
                  <span>Zorluk Seviyesi (RPE)</span>
                  <span className="text-orange-500">{intensity}/10</span>
               </label>
               <input 
                  type="range" min="1" max="10" value={intensity} onChange={e => setIntensity(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 dark:bg-navy-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
               />
               <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                  <span>Çok Kolay</span>
                  <span>Öldürücü</span>
               </div>
            </div>

            <div>
               <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2 block">Nasıl Hissettin?</label>
               <div className="flex gap-2">
                  {[
                     { id: 'strong', label: 'Güçlü 💪', bg: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' },
                     { id: 'normal', label: 'Normal 👍', bg: 'bg-gray-100 dark:bg-navy-700 text-gray-700 dark:text-gray-300' },
                     { id: 'tired', label: 'Yorgun 😫', bg: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400' },
                     { id: 'injured', label: 'Ağrılı 🤕', bg: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' },
                  ].map(opt => (
                     <button 
                        key={opt.id} type="button" 
                        onClick={() => setFeeling(opt.id as any)}
                        className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${feeling === opt.id ? `ring-2 ring-offset-1 ring-orange-500 ${opt.bg}` : 'bg-gray-50 dark:bg-navy-900 text-gray-500 opacity-70'}`}
                     >
                        {opt.label}
                     </button>
                  ))}
               </div>
            </div>

            <div>
               <input 
                  type="text" placeholder="Not ekle (Örn: Dizimde hafif ağrı var...)"
                  value={notes} onChange={e => setNotes(e.target.value)}
                  className="w-full p-3 bg-gray-50 dark:bg-navy-900 border border-gray-200 dark:border-navy-700 rounded-xl text-gray-800 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none text-sm"
               />
            </div>

            <button 
               type="submit" disabled={isSubmitting}
               className="w-full py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold rounded-xl shadow-lg transform transition active:scale-[0.98] flex items-center justify-center gap-2"
            >
               {isSubmitting ? <Loader2 className="animate-spin"/> : <Save size={20}/>} Kaydet ve Analiz Et
            </button>
         </form>
      </div>

      {/* HISTORY FEED */}
      <div className="space-y-4">
         <h3 className="font-bold text-gray-800 dark:text-white px-1">Son Antrenmanlar</h3>
         {profile.performanceLogs.length === 0 ? (
            <div className="text-center py-10 text-gray-400 dark:text-gray-500">
               <Dumbbell size={48} className="mx-auto mb-3 opacity-20"/>
               <p>Henüz antrenman kaydı yok.</p>
            </div>
         ) : (
            profile.performanceLogs.map(log => (
               <div key={log.id} className="bg-white dark:bg-navy-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-navy-700 animate-in fade-in slide-in-from-bottom-2">
                  <div className="flex justify-between items-start mb-3">
                     <div>
                        <div className="flex items-center gap-2">
                           <span className="font-bold text-gray-900 dark:text-white text-lg">{log.activityType}</span>
                           <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                              log.intensity > 7 ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                           }`}>RPE {log.intensity}</span>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1">
                           <Calendar size={12}/> {new Date(log.date).toLocaleDateString('tr-TR')} • {new Date(log.date).toLocaleTimeString('tr-TR', {hour: '2-digit', minute:'2-digit'})}
                        </div>
                     </div>
                     <div className="text-xl font-black text-gray-800 dark:text-gray-200">{log.durationMinutes}<span className="text-xs font-normal text-gray-400">dk</span></div>
                  </div>

                  {log.aiFeedback && (
                     <div className="bg-gray-50 dark:bg-navy-900 p-3 rounded-xl border border-gray-100 dark:border-navy-700 flex gap-3">
                        <div className="mt-1"><Sparkles size={16} className="text-orange-500"/></div>
                        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                           {formatText(log.aiFeedback)}
                        </p>
                     </div>
                  )}
               </div>
            ))
         )}
      </div>

    </div>
  );
};