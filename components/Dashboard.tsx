import React, { useState, useEffect } from 'react';
import { UserProfile, DailyLog } from '../types';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { ShieldCheck, Moon, Droplets, Brain, TrendingUp, TrendingDown, Activity, Heart, Calendar, ArrowRight, Sparkles, Utensils } from 'lucide-react';

interface Props {
  profile: UserProfile;
  liveHeartRate: number; // Passed from App.tsx
  isDeviceConnected: boolean; // Passed from App.tsx
}

export const Dashboard: React.FC<Props> = ({ profile, liveHeartRate, isDeviceConnected }) => {
  // Chart history state for live data
  const [liveData, setLiveData] = useState<{t:number, hr:number}[]>([]);

  // Update chart when liveHeartRate changes
  useEffect(() => {
    if (isDeviceConnected && liveHeartRate > 0) {
       setLiveData(prev => {
           const newData = [...prev, { t: Date.now(), hr: liveHeartRate }];
           return newData.slice(-30); // Keep last 30 points
        });
    }
  }, [liveHeartRate, isDeviceConnected]);

  // --- DATA PREPARATION ---
  const logs = profile.dailyLogs;
  const lastLog = logs[logs.length - 1];
  
  // Weekly Averages
  const last7Days = logs.slice(-7);
  const avgSleep = last7Days.reduce((acc, curr) => acc + curr.sleepHours, 0) / (last7Days.length || 1);
  const avgStress = last7Days.reduce((acc, curr) => acc + curr.stressLevel, 0) / (last7Days.length || 1);

  // Chart Data
  const chartData = last7Days.map(log => ({
    name: new Date(log.date).toLocaleDateString('tr-TR', { weekday: 'short' }),
    score: log.immunityScore,
    sleep: log.sleepHours,
    stress: log.stressLevel
  }));

  const immunityScore = lastLog?.immunityScore ?? 0;

  // --- PERSONALIZED AI INSIGHT GENERATOR ---
  const generateDynamicInsight = () => {
    if (!lastLog) return { title: "Veri Bekleniyor", msg: "Analiz için ilk günlük girişinizi yapın.", color: "bg-gray-100 text-gray-600" };

    const conditions = [];
    if (lastLog.sleepHours < 6.5) conditions.push("low_sleep");
    if (lastLog.stressLevel > 7) conditions.push("high_stress");
    if (lastLog.waterIntake < 1.5) conditions.push("low_water");
    if (lastLog.nutritionScore && lastLog.nutritionScore < 5) conditions.push("bad_diet");
    if (immunityScore < 60) conditions.push("low_immunity");

    if (conditions.includes("low_immunity") && conditions.includes("high_stress")) {
      return { 
        title: "⚠️ Kritik Uyarı: Tükenmişlik Riski", 
        msg: "Bağışıklığın düşerken stres seviyen çok yüksek. Bu kombinasyon seni hastalığa açık hale getiriyor. Bugün tüm işleri bir kenara bırakıp erken uyumalısın.",
        color: "bg-red-50 text-red-700 border-red-200"
      };
    }
    if (conditions.includes("low_sleep") && conditions.includes("bad_diet")) {
      return { 
        title: "Enerji Düşüklüğü", 
        msg: "Vücudun hem uykusuz hem de yakıtsız kalmış. Odaklanma sorunu yaşaman çok normal. Protein ağırlıklı bir öğün ve akşam 22:00'de uyku şart.",
        color: "bg-orange-50 text-orange-700 border-orange-200"
      };
    }
    if (conditions.length === 0 && immunityScore > 85) {
      return { 
        title: "🌟 Mükemmel Form", 
        msg: "Biyolojik verilerin harika görünüyor! Uyku, beslenme ve stres yönetimin dengede. Bu tempoyu korursan akademik başarını da olumlu etkileyecektir.",
        color: "bg-green-50 text-green-700 border-green-200"
      };
    }
    
    return { 
      title: "Günlük Analiz", 
      msg: `Bugün bağışıklık skorun ${immunityScore}/100. Küçük iyileştirmelerle (biraz daha su, biraz daha erken uyku) yarın daha zinde uyanabilirsin.`,
      color: "bg-blue-50 text-blue-700 border-blue-200"
    };
  };

  const insight = generateDynamicInsight();

  const ProgressBar = ({ val, max, color }: {val: number, max: number, color: string}) => (
    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
      <div className={`h-full ${color} rounded-full transition-all duration-1000 ease-out`} style={{ width: `${Math.min((val/max)*100, 100)}%` }}></div>
    </div>
  );

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto pb-24 md:pb-8 space-y-6">
      
      {/* HEADER */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-2 text-gray-500 text-sm font-medium mb-1">
             <Calendar size={14} />
             {new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' })}
          </div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Merhaba, {profile.name} 👋</h1>
        </div>
        
        {/* Quick Badge */}
        <div className={`flex items-center gap-3 px-5 py-2.5 rounded-2xl border ${insight.color} shadow-sm`}>
           <Sparkles size={18} />
           <div>
             <div className="text-xs font-bold uppercase opacity-80">Yapay Zeka Görüşü</div>
             <div className="text-sm font-bold">{insight.title}</div>
           </div>
        </div>
      </header>

      {/* --- BENTO GRID LAYOUT --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">

        {/* 1. IMMUNITY SCORE */}
        <div className="md:col-span-1 lg:col-span-1 bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 flex flex-col items-center justify-between relative overflow-hidden h-80">
           <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-teal-50 to-transparent opacity-50"></div>
           <div className="text-center relative z-10">
             <h3 className="text-gray-500 font-bold text-sm uppercase tracking-wider">Bağışıklık Gücü</h3>
             <div className="text-[10px] text-gray-400">Günlük Skor</div>
           </div>
           <div className="relative w-40 h-40 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="50%" cy="50%" r="70" stroke="#f1f5f9" strokeWidth="12" fill="transparent" />
                <circle 
                  cx="50%" cy="50%" r="70" stroke={immunityScore > 70 ? "#0d9488" : immunityScore > 40 ? "#eab308" : "#ef4444"} 
                  strokeWidth="12" fill="transparent" strokeDasharray="440" strokeDashoffset={440 - (440 * immunityScore) / 100} strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                 <ShieldCheck size={32} className={immunityScore > 70 ? "text-teal-600" : "text-orange-500"} />
                 <span className="text-4xl font-black text-gray-800">{immunityScore}</span>
              </div>
           </div>
           <div className="w-full space-y-2 relative z-10">
              <div className="flex justify-between text-xs text-gray-500">
                 <span>Uyku</span>
                 <span className="font-bold">{(lastLog?.sleepHours || 0)}s</span>
              </div>
              <ProgressBar val={lastLog?.sleepHours || 0} max={9} color="bg-indigo-400" />
           </div>
        </div>

        {/* 2. AI INSIGHT & TRENDS */}
        <div className="md:col-span-2 lg:col-span-2 flex flex-col gap-4">
           <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-[2rem] p-6 text-white shadow-lg flex-1 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl -mr-16 -mt-16"></div>
              <div className="flex items-start gap-4 relative z-10">
                 <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md border border-white/10">
                    <Brain size={24} className="text-indigo-200" />
                 </div>
                 <div className="flex-1">
                    <h3 className="font-bold text-lg text-indigo-100">AI Sağlık Analizi</h3>
                    <p className="text-indigo-50/80 text-sm leading-relaxed mt-2">
                       {insight.msg}
                    </p>
                    <div className="mt-4 flex items-center gap-2 text-xs font-bold bg-white/10 px-3 py-2 rounded-lg inline-flex border border-white/5">
                       <ArrowRight size={14} />
                       {immunityScore < 70 ? "Öneri: Bugün 30dk erken uyu." : "Öneri: Tempolu yürüyüş ile günü taçlandır."}
                    </div>
                 </div>
              </div>
           </div>

           <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 h-48 flex flex-col">
              <div className="flex justify-between items-center mb-2">
                 <h3 className="font-bold text-gray-700 text-sm flex items-center gap-2"><TrendingUp size={16}/> Haftalık Trend</h3>
                 <div className="text-xs text-gray-400">Son 7 Gün</div>
              </div>
              <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorImmunity" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0d9488" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#0d9488" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <Tooltip 
                      contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}
                      itemStyle={{fontSize: '12px', fontWeight: 'bold', color: '#0d9488'}}
                    />
                    <Area type="monotone" dataKey="score" stroke="#0d9488" strokeWidth={3} fill="url(#colorImmunity)" />
                 </AreaChart>
              </ResponsiveContainer>
           </div>
        </div>

        {/* 3. LIVE DEVICE (Right Column) */}
        <div className="md:col-span-3 lg:col-span-1 flex flex-col md:flex-row lg:flex-col gap-4">
           
           {isDeviceConnected ? (
             <div className="bg-gray-900 rounded-[2rem] p-5 text-white shadow-md relative overflow-hidden flex-1 min-h-[160px]">
                <div className="flex justify-between items-start z-10 relative">
                   <div className="flex items-center gap-2 text-xs text-gray-400 font-bold uppercase">
                      <Heart size={14} className="text-pink-500 animate-pulse" /> Canlı Nabız
                   </div>
                   <div className="w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
                </div>
                
                <div className="flex items-end gap-2 mt-4 relative z-10">
                   <span className="text-6xl font-black tracking-tighter">{liveHeartRate || "--"}</span>
                   <span className="text-gray-500 font-bold mb-2">BPM</span>
                </div>
                
                {/* Live Chart bg */}
                <div className="absolute bottom-0 left-0 right-0 h-16 opacity-30">
                   <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={liveData}>
                         <Line type="monotone" dataKey="hr" stroke="#ec4899" strokeWidth={2} dot={false} isAnimationActive={false} />
                      </LineChart>
                   </ResponsiveContainer>
                </div>
             </div>
           ) : (
             <div className="bg-gray-50 rounded-[2rem] p-5 border border-gray-200 border-dashed flex flex-col items-center justify-center text-center gap-3 flex-1 min-h-[160px]">
                <div className="p-3 bg-white rounded-full shadow-sm">
                   <Heart size={24} className="text-gray-300" />
                </div>
                <div>
                   <h4 className="font-bold text-gray-600 text-sm">Cihaz Bağlı Değil</h4>
                   <p className="text-[10px] text-gray-400 mt-1">Gerçek zamanlı nabız için profil ayarlarından bağlanın.</p>
                </div>
             </div>
           )}

           <div className="bg-orange-50 rounded-[2rem] p-5 border border-orange-100 flex-1 flex flex-col justify-center relative">
              <div className="flex justify-between items-start mb-2">
                 <div className="p-2 bg-white rounded-xl shadow-sm text-orange-500"><Utensils size={18} /></div>
                 <span className="text-xs font-bold text-orange-400 bg-white/50 px-2 py-1 rounded-lg">Bugün</span>
              </div>
              <div>
                 <div className="text-2xl font-black text-gray-800">
                    {lastLog?.totalCaloriesIn || 0} <span className="text-sm font-medium text-gray-500">kcal</span>
                 </div>
                 <div className="text-xs text-gray-500 mt-1">Alınan Kalori</div>
              </div>
           </div>
        </div>

        {/* --- ROW 2: DETAILED VITALS --- */}
        <div className="col-span-1 md:col-span-3 lg:col-span-4 grid grid-cols-2 md:grid-cols-4 gap-4">
           {/* Stats Cards (Simplified for brevity, logic exists above) */}
           <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-3 text-indigo-500 font-bold text-sm"><Moon size={18} /> Uyku</div>
              <div className="text-2xl font-bold text-gray-800">{lastLog?.sleepHours || 0} <span className="text-sm text-gray-400">saat</span></div>
              <div className="mt-3"><ProgressBar val={lastLog?.sleepHours || 0} max={9} color="bg-indigo-500" /></div>
           </div>
           <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-3 text-blue-500 font-bold text-sm"><Droplets size={18} /> Su</div>
              <div className="text-2xl font-bold text-gray-800">{lastLog?.waterIntake || 0} <span className="text-sm text-gray-400">Lt</span></div>
              <div className="mt-3"><ProgressBar val={lastLog?.waterIntake || 0} max={2.5} color="bg-blue-500" /></div>
           </div>
           <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-3 text-orange-500 font-bold text-sm"><Brain size={18} /> Stres</div>
              <div className="text-2xl font-bold text-gray-800">{lastLog?.stressLevel || 0} <span className="text-sm text-gray-400">/10</span></div>
              <div className="mt-3"><ProgressBar val={lastLog?.stressLevel || 0} max={10} color="bg-orange-500" /></div>
           </div>
           <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-3 text-red-500 font-bold text-sm"><Activity size={18} /> Aktivite</div>
              <div className="text-2xl font-bold text-gray-800">{lastLog?.totalCaloriesOut || 0} <span className="text-sm text-gray-400">kcal</span></div>
              <div className="mt-3 text-xs text-gray-500 flex items-center gap-1">
                  {lastLog?.totalCaloriesOut > 2000 ? <TrendingUp size={14} className="text-green-500"/> : <TrendingDown size={14} className="text-gray-400"/>}
                  <span>{lastLog?.totalCaloriesOut > 2000 ? "Aktif Gün" : "Hareketsiz"}</span>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
};