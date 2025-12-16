import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { calculateBodyFat, getBodyFatCategory, SPORTS_MET_VALUES, calculateCaloriesBurned } from '../services/ruleEngine';
import { Ruler, Activity, Flame, TrendingDown, Dumbbell, Lightbulb } from 'lucide-react';

interface Props {
  profile: UserProfile;
  onUpdate: (p: UserProfile) => void;
}

const FITNESS_FACTS = [
  "Kas dokusu, dinlenme halindeyken yağ dokusundan 3 kat daha fazla kalori yakar. Kas kütleni artırmak metabolizmanı hızlandırır.",
  "Egzersizden sonraki 30 dakika içinde protein almak, kas onarımını ve gelişimini %50 oranında artırabilir.",
  "Yetersiz uyku, açlık hormonu Ghrelin'i artırır ve tokluk hormonu Leptin'i azaltır. Bu da kilo almana neden olabilir.",
  "Su içmek metabolizmanı geçici olarak %24-30 oranında hızlandırabilir. Günde 2.5 litre su içmeyi hedefle.",
  "Sadece 30 dakika tempolu yürüyüş yapmak, depresyon riskini %40 oranında azaltabilir ve endorfin salgılar.",
  "Vücudundaki en güçlü kas çene kasındır (Masseter), ancak en çok çalışan kas kalptir.",
  "Esneme hareketleri (Stretching) sadece esneklik sağlamaz, aynı zamanda kaslara giden kan akışını artırarak iyileşmeyi hızlandırır.",
  "Sabahları aç karnına yapılan hafif kardiyo (yürüyüş gibi), yağ yakımını %20 oranında artırabilir.",
  "Şekerli içecekleri kesmek, günlük kalori alımını ortalama 200-400 kcal azaltabilir. Bu da ayda 1 kg yağ kaybı demektir.",
  "Plank hareketi, mekikten daha etkilidir çünkü sadece karın kaslarını değil, sırt, omuz ve kalça kaslarını da çalıştırır.",
  "Bir dilim pizza yaklaşık 300 kaloridir. Bunu yakmak için yaklaşık 45 dakika tempolu yürüyüş yapman gerekir.",
  "Soğuk suyla duş almak, kahverengi yağ dokusunu aktive ederek ekstra kalori yakımına yardımcı olabilir."
];

export const FitnessPage: React.FC<Props> = ({ profile, onUpdate }) => {
  const [activeTab, setActiveTab] = useState<'measure' | 'sport'>('measure');

  // Measurement State
  const [neck, setNeck] = useState(profile.measurements?.neck || 0);
  const [waist, setWaist] = useState(profile.measurements?.waist || 0);
  const [hip, setHip] = useState(profile.measurements?.hip || 0);
  const [bodyFat, setBodyFat] = useState(profile.measurements?.bodyFatPercentage || 0);

  // Sport State
  const [selectedSport, setSelectedSport] = useState("Yürüyüş (Tempolu)");
  const [duration, setDuration] = useState(30);
  const [caloriesBurned, setCaloriesBurned] = useState(0);
  
  // Random Tip State
  const [randomTip, setRandomTip] = useState("");

  useEffect(() => {
    // Select a random tip on mount
    const tip = FITNESS_FACTS[Math.floor(Math.random() * FITNESS_FACTS.length)];
    setRandomTip(tip);
  }, []);

  // Calculate Body Fat
  const handleCalculateFat = () => {
    const fat = calculateBodyFat(profile.gender, waist, neck, profile.height, hip);
    setBodyFat(fat);
    
    // Update Profile
    const updatedMeasurements = {
      neck,
      waist,
      hip,
      bodyFatPercentage: fat,
      calculatedDate: new Date().toISOString().split('T')[0]
    };
    onUpdate({ ...profile, measurements: updatedMeasurements });
  };

  // Calculate Calories Live
  useEffect(() => {
    const met = SPORTS_MET_VALUES[selectedSport];
    const burned = calculateCaloriesBurned(met, profile.weight, duration);
    setCaloriesBurned(burned);
  }, [selectedSport, duration, profile.weight]);

  // Estimation Logic
  const getGoalAnalysis = () => {
    const isMale = profile.gender === 'male';
    const idealFat = isMale ? 15 : 22; // Mid-fitness range
    
    if (bodyFat === 0) return null;
    if (bodyFat <= idealFat + 2) return { status: 'ideal', msg: "Harika! İdeal yağ oranındasın. Mevcut formunu korumalısın." };

    // Simple estimation: 1kg fat = 7700 kcal
    // Assume 1% body fat loss roughly needs ~7700 kcal deficit (very rough approximation for simplicity in app)
    // Actually: Weight * (CurrentBF - TargetBF) / 100 = Fat Mass to lose (kg)
    const fatMassToLose = profile.weight * ((bodyFat - idealFat) / 100);
    const totalCaloriesToBurn = fatMassToLose * 7700;
    const dailyDeficit = 500; // Recommend 500kcal deficit
    const daysNeeded = Math.round(totalCaloriesToBurn / dailyDeficit);
    const monthsNeeded = (daysNeeded / 30).toFixed(1);

    return {
      status: 'work',
      fatToLose: fatMassToLose.toFixed(1),
      days: daysNeeded,
      months: monthsNeeded
    };
  };

  const goalData = getGoalAnalysis();
  const fatCategory = getBodyFatCategory(bodyFat, profile.gender);

  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Dumbbell className="text-teal-600" /> Fitness & Vücut Analizi
        </h1>
        <p className="text-gray-500 text-sm">Vücut yağ oranını hesapla ve günlük aktivitelerini takip et.</p>
      </header>

      {/* Tabs */}
      <div className="flex bg-gray-100 p-1 rounded-xl">
        <button 
          onClick={() => setActiveTab('measure')}
          className={`flex-1 py-2 text-sm font-bold rounded-lg transition ${activeTab === 'measure' ? 'bg-white shadow text-teal-700' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Vücut Ölçümü
        </button>
        <button 
          onClick={() => setActiveTab('sport')}
          className={`flex-1 py-2 text-sm font-bold rounded-lg transition ${activeTab === 'sport' ? 'bg-white shadow text-teal-700' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Spor & Kalori
        </button>
      </div>

      {activeTab === 'measure' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          
          {/* Measurement Inputs */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
            <h3 className="font-bold text-gray-800 flex items-center gap-2 border-b pb-2">
              <Ruler size={18} className="text-orange-500" /> Mezura Ölçüleri (cm)
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-500">Boyun Çevresi</label>
                <input 
                  type="number" value={neck || ''} onChange={e => setNeck(Number(e.target.value))}
                  placeholder="cm"
                  className="w-full p-2 border rounded-lg mt-1 focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>
              <div>
                <label className="text-sm text-gray-500">Bel Çevresi (Göbek)</label>
                <input 
                  type="number" value={waist || ''} onChange={e => setWaist(Number(e.target.value))}
                  placeholder="cm"
                  className="w-full p-2 border rounded-lg mt-1 focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>
              {profile.gender === 'female' && (
                <div className="col-span-2">
                  <label className="text-sm text-gray-500">Kalça Çevresi (En geniş)</label>
                  <input 
                    type="number" value={hip || ''} onChange={e => setHip(Number(e.target.value))}
                    placeholder="cm"
                    className="w-full p-2 border rounded-lg mt-1 focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                </div>
              )}
            </div>
            
            <button 
              onClick={handleCalculateFat}
              className="w-full py-3 bg-teal-600 text-white font-bold rounded-xl hover:bg-teal-700 transition shadow-md active:scale-95"
            >
              Yağ Oranını Hesapla
            </button>
          </div>

          {/* Results Card */}
          {bodyFat > 0 && (
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
              <div className="relative z-10 flex flex-col items-center text-center">
                <span className="text-sm font-medium opacity-90">TAHMİNİ YAĞ ORANI</span>
                <span className="text-5xl font-extrabold my-2">%{bodyFat}</span>
                <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-sm">
                  {fatCategory}
                </span>
                
                {/* Visual Bar */}
                <div className="w-full bg-black/20 h-2 rounded-full mt-6 mb-2">
                   <div 
                     className="bg-white h-2 rounded-full transition-all duration-1000"
                     style={{ width: `${Math.min(bodyFat * 2, 100)}%` }}
                   ></div>
                </div>
                <div className="flex justify-between w-full text-[10px] opacity-70">
                   <span>Sporcu (%10)</span>
                   <span>Fitness (%18)</span>
                   <span>Normal (%25)</span>
                   <span>Obez (%30+)</span>
                </div>
              </div>
              
              {/* Decorative Circle */}
              <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
            </div>
          )}

          {/* Time to Goal Analysis */}
          {bodyFat > 0 && goalData && (
             <div className="bg-white p-6 rounded-2xl shadow-sm border border-orange-100">
               <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-4">
                 <TrendingDown size={20} className="text-teal-600" /> Hedef Analizi
               </h3>
               
               {goalData.status === 'ideal' ? (
                 <p className="text-green-600 font-medium">{goalData.msg}</p>
               ) : (
                 <div className="space-y-4">
                   <p className="text-sm text-gray-600 leading-relaxed">
                     Sağlıklı yağ oranına (Fitness seviyesi) ulaşmak için yaklaşık <span className="font-bold text-gray-900">{goalData.fatToLose} kg</span> saf yağ kaybetmeniz gerekiyor.
                   </p>
                   
                   <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 flex items-start gap-3">
                     <Lightbulb className="text-orange-500 flex-shrink-0 mt-1" size={18} />
                     <div className="text-sm text-orange-800">
                       <p className="font-bold mb-1">Tahmini Süre: {goalData.months} Ay</p>
                       <p className="text-xs opacity-90">
                         Günde 500 kalori açık oluşturarak (yemeği azaltarak veya sporu artırarak) bu hedefe yaklaşık {goalData.days} günde ulaşabilirsiniz.
                       </p>
                     </div>
                   </div>
                 </div>
               )}
             </div>
          )}
        </div>
      )}

      {activeTab === 'sport' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
           {/* Calorie Calculator */}
           <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
             <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
               <Activity className="text-red-500" /> Günlük Aktivite
             </h3>

             <div className="space-y-4">
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Aktivite Türü</label>
                 <select 
                   value={selectedSport}
                   onChange={e => setSelectedSport(e.target.value)}
                   className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none"
                 >
                   {Object.keys(SPORTS_MET_VALUES).map(sport => (
                     <option key={sport} value={sport}>{sport}</option>
                   ))}
                 </select>
               </div>

               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Süre (Dakika)</label>
                 <div className="flex items-center gap-4">
                    <input 
                      type="range" min="10" max="180" step="5"
                      value={duration}
                      onChange={e => setDuration(Number(e.target.value))}
                      className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
                    />
                    <div className="w-16 h-10 flex items-center justify-center font-bold bg-teal-50 text-teal-700 rounded-lg border border-teal-100">
                      {duration}dk
                    </div>
                 </div>
               </div>
             </div>

             <div className="mt-8 flex items-center justify-between bg-gray-900 text-white p-5 rounded-2xl shadow-xl">
               <div className="flex flex-col">
                 <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Yakılan Kalori</span>
                 <span className="text-3xl font-extrabold flex items-center gap-1">
                   {caloriesBurned} <span className="text-sm font-normal text-gray-400">kcal</span>
                 </span>
               </div>
               <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                 <Flame size={24} fill="white" />
               </div>
             </div>
           </div>

           {/* Dynamic Info Tip */}
           <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-sm text-blue-800 leading-relaxed shadow-sm">
             <div className="flex items-center gap-2 font-bold mb-2 text-blue-900">
               <Lightbulb size={18} className="text-yellow-500 fill-yellow-500" />
               Biliyor muydun?
             </div>
             {randomTip}
           </div>
        </div>
      )}
    </div>
  );
};