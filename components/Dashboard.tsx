
import React, { useState, useEffect } from 'react';
import { UserProfile, DailyLog } from '../types';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { ShieldCheck, Moon, Droplets, Brain, TrendingUp, TrendingDown, Activity, Heart, Calendar, ArrowRight, Sparkles, Utensils, History } from 'lucide-react';
import { calculateMemoryImmunityScore } from '../services/ruleEngine';

interface Props {
  profile: UserProfile;
  liveHeartRate: number;
  isDeviceConnected: boolean;
}

export const Dashboard: React.FC<Props> = ({ profile, liveHeartRate, isDeviceConnected }) => {
  const [liveData, setLiveData] = useState<{t:number, hr:number}[]>([]);

  useEffect(() => {
    if (isDeviceConnected && liveHeartRate > 0) {
       setLiveData(prev => {
           const newData = [...prev, { t: Date.now(), hr: liveHeartRate }];
           return newData.slice(-30);
        });
    }
  }, [liveHeartRate, isDeviceConnected]);

  const logs = profile.dailyLogs;
  const memoryScore = calculateMemoryImmunityScore(profile);
  const lastLog = logs[logs.length - 1];
  const last7Days = logs.slice(-7);

  const chartData = last7Days.map(log => ({
    name: new Date(log.date).toLocaleDateString('tr-TR', { weekday: 'short' }),
    score: log.immunityScore,
  }));

  const getMemoryBadge = () => {
    if (memoryScore > 85) return { text: "Çelik Gibi Hafıza", color: "bg-green-100 text-green-700 border-green-200" };
    if (memoryScore > 65) return { text: "Kararlı Hafıza", color: "bg-blue-100 text-blue-700 border-blue-200" };
    return { text: "Yorgun Hafıza", color: "bg-orange-100 text-orange-700 border-orange-200" };
  };

  const badge = getMemoryBadge();

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto pb-24 md:pb-8 space-y-6">
      
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-gray-500 text-xs font-bold mb-1 uppercase tracking-widest">
             <History size={14} /> Kişisel Sağlık Hafızası (PHM)
          </div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Hoş Geldin, {profile.name}</h1>
        </div>
        
        <div className={`flex items-center gap-3 px-4 py-2 rounded-2xl border ${badge.color} shadow-sm animate-pulse`}>
           <ShieldCheck size={18} />
           <div className="text-xs font-black uppercase tracking-wider">{badge.text}</div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">

        {/* PHM CAPACITY CARD */}
        <div className="md:col-span-1 lg:col-span-1 bg-white dark:bg-navy-900 rounded-[2.5rem] p-8 shadow-sm border border-gray-100 dark:border-navy-800 flex flex-col items-center justify-center relative overflow-hidden h-80">
           <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-teal-50 dark:from-teal-900/10 to-transparent opacity-50"></div>
           <div className="text-center z-10">
             <h3 className="text-gray-400 dark:text-gray-500 font-black text-xs uppercase tracking-widest mb-2">Hafıza Kapasitesi</h3>
           </div>
           <div className="relative w-44 h-44 flex items-center justify-center z-10">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="50%" cy="50%" r="80" stroke="#f1f5f9" strokeWidth="14" fill="transparent" className="dark:stroke-navy-800" />
                <circle 
                  cx="50%" cy="50%" r="80" stroke={memoryScore > 70 ? "#0d9488" : "#eab308"} 
                  strokeWidth="14" fill="transparent" strokeDasharray="502" strokeDashoffset={502 - (502 * memoryScore) / 100} strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                 <span className="text-5xl font-black text-gray-800 dark:text-white">%{memoryScore}</span>
              </div>
           </div>
           <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-4 text-center font-bold px-4">
              Son 30 günlük semptom ve yaşam tarzı hafızası.
           </p>
        </div>

        {/* TREND & INSIGHT */}
        <div className="md:col-span-2 lg:col-span-2 flex flex-col gap-4">
           <div className="bg-gray-900 dark:bg-navy-800 rounded-[2.5rem] p-8 text-white shadow-2xl flex-1 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
              <div className="flex items-start gap-4 relative z-10">
                 <div className="p-4 bg-white/5 rounded-3xl backdrop-blur-xl border border-white/10">
                    <Sparkles size={28} className="text-teal-400" />
                 </div>
                 <div className="flex-1">
                    <h3 className="font-black text-xl text-white">Hafıza Analizi</h3>
                    <p className="text-teal-50/70 text-sm leading-relaxed mt-2 italic">
                       "Hafızandaki veriler, son zamanlarda uyku kalitenin düştüğünü ancak beslenme disiplinini koruduğunu gösteriyor. Bu denge kapasiteni sabit tutuyor."
                    </p>
                    <div className="mt-6 flex items-center gap-4">
                       <div className="bg-teal-500/20 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-tighter text-teal-300 border border-teal-500/30">
                          Hafıza Stabil
                       </div>
                    </div>
                 </div>
              </div>
           </div>

           <div className="bg-white dark:bg-navy-900 rounded-[2.5rem] p-6 shadow-sm border border-gray-100 dark:border-navy-800 h-48 flex flex-col">
              <div className="flex justify-between items-center mb-2 px-2">
                 <h3 className="font-black text-gray-400 dark:text-gray-500 text-[10px] uppercase tracking-widest flex items-center gap-2"><TrendingUp size={14}/> Bağışıklık Trendi</h3>
              </div>
              <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0d9488" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#0d9488" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <Tooltip 
                      contentStyle={{borderRadius: '24px', border: 'none', background: '#111827', color: '#fff'}}
                      itemStyle={{color: '#2dd4bf', fontWeight: 'bold'}}
                    />
                    <Area type="monotone" dataKey="score" stroke="#0d9488" strokeWidth={4} fill="url(#colorScore)" />
                 </AreaChart>
              </ResponsiveContainer>
           </div>
        </div>

        {/* DEVICE / QUICK STATS */}
        <div className="md:col-span-3 lg:col-span-1 flex flex-col gap-4">
           {isDeviceConnected && (
             <div className="bg-teal-600 rounded-[2.5rem] p-6 text-white shadow-xl flex-1 flex flex-col justify-between">
                <div className="flex justify-between items-center">
                   <Heart size={20} className="animate-pulse" />
                   <span className="text-[10px] font-black bg-white/20 px-2 py-1 rounded-lg">CANLI</span>
                </div>
                <div className="mt-4">
                   <span className="text-5xl font-black">{liveHeartRate}</span>
                   <span className="text-teal-200 font-bold ml-2">BPM</span>
                </div>
                <div className="text-[10px] font-bold opacity-70 mt-4">Nabız hafızaya aktarılıyor...</div>
             </div>
           )}
           <div className="bg-white dark:bg-navy-900 rounded-[2.5rem] p-6 border border-gray-100 dark:border-navy-800 flex-1 flex flex-col justify-center">
              <div className="flex items-center gap-3 mb-2">
                 <Utensils size={18} className="text-orange-500" />
                 <span className="text-[10px] font-black text-gray-400 uppercase">Beslenme Puanı</span>
              </div>
              <div className="text-3xl font-black text-gray-800 dark:text-white">
                 {lastLog?.nutritionScore || 0}<span className="text-sm font-normal text-gray-400">/10</span>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};
