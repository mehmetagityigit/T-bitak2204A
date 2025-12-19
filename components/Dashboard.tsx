
import React, { useState, useEffect } from 'react';
import { UserProfile, DailyLog, Medication } from '../types';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';
import { 
  ShieldCheck, Moon, Droplets, Brain, TrendingUp, Activity, Heart, 
  Sparkles, Utensils, History, Pill, AlertCircle, Clock, CheckCircle2, 
  ChevronRight, Dumbbell, Zap, Flame, Thermometer 
} from 'lucide-react';
import { calculateMemoryImmunityScore, getBMICategory } from '../services/ruleEngine';
import { Link } from 'react-router-dom';

interface Props {
  profile: UserProfile;
  liveHeartRate: number;
  isDeviceConnected: boolean;
}

export const Dashboard: React.FC<Props> = ({ profile, liveHeartRate, isDeviceConnected }) => {
  const logs = profile.dailyLogs;
  const memoryScore = calculateMemoryImmunityScore(profile);
  const lastLog = logs[logs.length - 1];
  const last7Days = logs.slice(-7);

  const chartData = last7Days.map(log => ({
    name: new Date(log.date).toLocaleDateString('tr-TR', { weekday: 'short' }),
    immunity: log.immunityScore,
    stress: log.stressLevel * 10
  }));

  const nextMedication = profile.medications?.find(m => {
    const today = new Date().toISOString().split('T')[0];
    return m.endDate >= today && m.dosesTakenToday < m.timesPerDay;
  });

  const getMemoryBadge = () => {
    if (memoryScore > 85) return { text: "Zirve Hafıza", color: "bg-teal-100 text-teal-700 border-teal-200" };
    if (memoryScore > 65) return { text: "Dengeli Hafıza", color: "bg-blue-100 text-blue-700 border-blue-200" };
    return { text: "Yorgun Hafıza", color: "bg-orange-100 text-orange-700 border-orange-200" };
  };

  const badge = getMemoryBadge();

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto pb-24 md:pb-8 space-y-6">
      
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs font-bold mb-1 uppercase tracking-widest">
             <History size={14} /> Kişisel Sağlık Hafızası (PHM) v2.5
          </div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
             Merhaba, {profile.firstName} {profile.lastName} <span className="animate-bounce">👋</span>
          </h1>
        </div>
        
        <div className={`flex items-center gap-3 px-4 py-2 rounded-2xl border ${badge.color} shadow-sm`}>
           <ShieldCheck size={18} />
           <div className="text-xs font-black uppercase tracking-wider">{badge.text}</div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-12 lg:col-span-4 space-y-6">
          <div className="bg-white dark:bg-navy-900 rounded-[2.5rem] p-8 shadow-sm border border-gray-100 dark:border-navy-800 flex flex-col items-center justify-center relative overflow-hidden h-96">
            <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-teal-50 dark:from-teal-900/10 to-transparent opacity-50"></div>
            <div className="text-center z-10 mb-4">
              <h3 className="text-gray-400 dark:text-gray-500 font-black text-xs uppercase tracking-widest">Bağışıklık Kapasitesi</h3>
            </div>
            <div className="relative w-52 h-52 flex items-center justify-center z-10">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="50%" cy="50%" r="90" stroke="#f1f5f9" strokeWidth="16" fill="transparent" className="dark:stroke-navy-800" />
                  <circle 
                    cx="50%" cy="50%" r="90" stroke={memoryScore > 70 ? "#0d9488" : "#eab308"} 
                    strokeWidth="16" fill="transparent" strokeDasharray="565" strokeDashoffset={565 - (565 * memoryScore) / 100} strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                   <span className="text-6xl font-black text-gray-800 dark:text-white">%{memoryScore}</span>
                   <span className="text-[10px] font-bold text-gray-400 uppercase">Analiz Edildi</span>
                </div>
            </div>
            <div className="grid grid-cols-2 w-full mt-6 gap-2 z-10">
               <div className="bg-gray-50 dark:bg-navy-800 p-3 rounded-2xl text-center">
                  <div className="text-[10px] text-gray-400 font-bold uppercase">Semptom Yükü</div>
                  <div className="text-lg font-black text-gray-700 dark:text-gray-200">%{100 - memoryScore}</div>
               </div>
               <div className="bg-gray-50 dark:bg-navy-800 p-3 rounded-2xl text-center">
                  <div className="text-[10px] text-gray-400 font-bold uppercase">Hafıza Durumu</div>
                  <div className="text-lg font-black text-teal-600">Aktif</div>
               </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-12 lg:col-span-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-navy-900 rounded-[2.5rem] p-6 shadow-sm border border-gray-100 dark:border-navy-800 space-y-6">
               <div className="flex justify-between items-center mb-2">
                 <h3 className="font-black text-gray-800 dark:text-gray-200 text-sm flex items-center gap-2">
                    <Zap size={18} className="text-yellow-500" /> Günlük Hedefler
                 </h3>
               </div>
               <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-gray-500">
                     <span className="flex items-center gap-1 uppercase"><Droplets size={12}/> Su</span>
                     <span>{lastLog?.waterIntake || 0} / 2.5 L</span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-navy-800 h-2 rounded-full overflow-hidden">
                     <div className="bg-blue-500 h-full rounded-full" style={{ width: `${Math.min(((lastLog?.waterIntake || 0) / 2.5) * 100, 100)}%` }}></div>
                  </div>
               </div>
               <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-gray-500">
                     <span className="flex items-center gap-1 uppercase"><Moon size={12}/> Uyku</span>
                     <span>{lastLog?.sleepHours || 0} / 8 Sa</span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-navy-800 h-2 rounded-full overflow-hidden">
                     <div className="bg-purple-500 h-full rounded-full" style={{ width: `${Math.min(((lastLog?.sleepHours || 0) / 8) * 100, 100)}%` }}></div>
                  </div>
               </div>
            </div>

            <div className="bg-gray-900 dark:bg-navy-800 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden flex flex-col justify-between">
              <div className="flex items-start gap-4">
                 <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-xl">
                    <Sparkles size={24} className="text-teal-400" />
                 </div>
                 <div className="flex-1">
                    <h3 className="font-black text-lg">Asistan'ın Notu</h3>
                    <p className="text-teal-50/70 text-sm mt-2 italic leading-relaxed">
                       "Merhaba {profile.firstName}, bugün sağlık verilerini hafızaya kaydetmeyi unutma, analizlerin için hazırım."
                    </p>
                 </div>
              </div>
              <Link to="/chat" className="mt-4 flex items-center gap-2 text-xs font-black text-teal-400 uppercase tracking-widest hover:gap-3 transition-all">
                 Asistanla Konuş <ChevronRight size={14}/>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
