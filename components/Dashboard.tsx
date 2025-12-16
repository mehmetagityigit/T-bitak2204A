import React, { useState } from 'react';
import { UserProfile } from '../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ShieldCheck, Zap, AlertCircle, X } from 'lucide-react';
import { getImmunityDescription } from '../services/ruleEngine';

interface Props {
  profile: UserProfile;
}

export const Dashboard: React.FC<Props> = ({ profile }) => {
  const [showScoreInfo, setShowScoreInfo] = useState(false);
  const lastLog = profile.dailyLogs[profile.dailyLogs.length - 1];
  
  // Prepare data for chart (last 7 days)
  const chartData = profile.dailyLogs.slice(-7).map(log => ({
    name: new Date(log.date).toLocaleDateString('tr-TR', { weekday: 'short' }),
    score: log.immunityScore,
    stress: log.stressLevel * 10, // Scale to 100 for visual comparison
  }));

  const immunityScore = lastLog?.immunityScore ?? 0;
  
  let statusColor = "text-green-600";
  let statusBg = "bg-green-100";
  let statusText = "Mükemmel";

  if (immunityScore < 50) {
    statusColor = "text-red-600";
    statusBg = "bg-red-100";
    statusText = "Riskli";
  } else if (immunityScore < 80) {
    statusColor = "text-yellow-600";
    statusBg = "bg-yellow-100";
    statusText = "İdare Eder";
  }

  const scoreDetails = getImmunityDescription(immunityScore);

  return (
    <div className="p-4 space-y-6 pb-20 md:pb-8 relative">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Hoş Geldin, {profile.name} 👋</h1>
        <p className="text-gray-500">Bugünkü sağlık özetin aşağıda.</p>
      </header>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Immunity Score Card (Clickable) */}
        <div 
          onClick={() => setShowScoreInfo(true)}
          className="cursor-pointer p-6 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center relative overflow-hidden transition hover:shadow-md hover:border-teal-200"
        >
          <div className={`absolute top-0 left-0 w-full h-2 ${statusColor.replace('text', 'bg')}`}></div>
          <div className={`p-3 rounded-full ${statusBg} mb-3`}>
            <ShieldCheck className={`w-8 h-8 ${statusColor}`} />
          </div>
          <div className="text-4xl font-bold text-gray-900">{immunityScore}</div>
          <div className="text-sm text-gray-500 uppercase tracking-wide font-semibold mt-1">Bağışıklık Skoru</div>
          <div className={`mt-2 px-3 py-1 rounded-full text-xs font-bold ${statusBg} ${statusColor}`}>
            {statusText}
          </div>
          <div className="absolute bottom-2 text-[10px] text-gray-400">Detay için tıkla</div>
        </div>

        {/* Quick Stats */}
        <div className="p-6 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg text-blue-600"><Zap size={20}/></div>
              <span className="text-gray-600 font-medium">Günlük Enerji</span>
            </div>
            <span className="text-xl font-bold text-gray-800">{10 - (lastLog?.fatigueLevel ?? 0)}/10</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${(10 - (lastLog?.fatigueLevel ?? 0)) * 10}%` }}></div>
          </div>
          
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg text-orange-600"><AlertCircle size={20}/></div>
              <span className="text-gray-600 font-medium">Stres Seviyesi</span>
            </div>
            <span className="text-xl font-bold text-gray-800">{lastLog?.stressLevel ?? 0}/10</span>
          </div>
           <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-orange-500 h-2 rounded-full" style={{ width: `${(lastLog?.stressLevel ?? 0) * 10}%` }}></div>
          </div>
        </div>

         {/* Advice Card */}
         <div className="p-6 bg-gradient-to-br from-teal-500 to-teal-700 rounded-2xl shadow-md text-white flex flex-col justify-center">
            <h3 className="font-bold text-lg mb-2">Günün Tavsiyesi</h3>
            <p className="text-teal-50 text-sm leading-relaxed">
              {immunityScore < 70 
               ? "Bağışıklığın biraz düşük görünüyor. Bol C vitamini tüket ve bu akşam erken uyu."
               : "Harika gidiyorsun! Bu enerjiyi korumak için kısa bir yürüyüş yapabilirsin."}
            </p>
         </div>
      </div>

      {/* Chart */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-80">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Haftalık Bağışıklık Trendi</h3>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#14b8a6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af'}} dy={10} />
            <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af'}} />
            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
            <Area type="monotone" dataKey="score" stroke="#14b8a6" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" name="Bağışıklık" />
            <Area type="monotone" dataKey="stress" stroke="#f97316" strokeWidth={2} fillOpacity={0} name="Stres (x10)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Score Explanation Modal */}
      {showScoreInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 relative">
            <button 
              onClick={() => setShowScoreInfo(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
            
            <div className="flex flex-col items-center text-center mb-4">
              <ShieldCheck className={`w-16 h-16 mb-2 ${scoreDetails.color}`} />
              <h3 className={`text-xl font-bold ${scoreDetails.color}`}>{scoreDetails.title}</h3>
              <div className="text-4xl font-bold text-gray-800 my-1">{immunityScore}</div>
            </div>
            
            <p className="text-gray-600 text-sm leading-relaxed mb-6">
              {scoreDetails.desc}
            </p>

            <button 
              onClick={() => setShowScoreInfo(false)}
              className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-xl transition"
            >
              Anlaşıldı
            </button>
          </div>
        </div>
      )}
    </div>
  );
};