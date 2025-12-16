import React, { useState, useEffect } from 'react';
import { UserProfile, DailyLog, Meal, DailyExercise } from '../types';
import { calculateBMR, calculateCaloriesBurned, SPORTS_MET_VALUES, calculateBodyFat, getBodyFatCategory } from '../services/ruleEngine';
import { estimateCalories } from '../services/geminiService';
import { Utensils, Flame, Plus, Trash2, ChevronDown, ChevronUp, AlertTriangle, CheckCircle, Wand2, Loader2, Ruler, TrendingDown, Lightbulb, Activity, Scale } from 'lucide-react';

interface Props {
  profile: UserProfile;
  onUpdate: (log: DailyLog) => void;
  onUpdateProfile: (p: UserProfile) => void;
}

const MEAL_TYPES = [
  { id: 'breakfast', label: 'Sabah Kahvaltısı', color: 'bg-orange-100 text-orange-700' },
  { id: 'lunch', label: 'Öğle Yemeği', color: 'bg-green-100 text-green-700' },
  { id: 'dinner', label: 'Akşam Yemeği', color: 'bg-blue-100 text-blue-700' },
  { id: 'snack', label: 'Ara Öğünler', color: 'bg-purple-100 text-purple-700' }
];

const FITNESS_FACTS = [
  "Kas dokusu, dinlenme halindeyken yağ dokusundan 3 kat daha fazla kalori yakar. Kas kütleni artırmak metabolizmanı hızlandırır.",
  "Egzersizden sonraki 30 dakika içinde protein almak, kas onarımını ve gelişimini %50 oranında artırabilir.",
  "Yetersiz uyku, açlık hormonu Ghrelin'i artırır ve tokluk hormonu Leptin'i azaltır. Bu da kilo almana neden olabilir.",
  "Su içmek metabolizmanı geçici olarak %24-30 oranında hızlandırabilir. Günde 2.5 litre su içmeyi hedefle.",
  "Sadece 30 dakika tempolu yürüyüş yapmak, depresyon riskini %40 oranında azaltabilir ve endorfin salgılar.",
  "Vücudundaki en güçlü kas çene kasındır (Masseter), ancak en çok çalışan kas kalptir.",
  "Bir dilim pizza yaklaşık 300 kaloridir. Bunu yakmak için yaklaşık 45 dakika tempolu yürüyüş yapman gerekir.",
  "Soğuk suyla duş almak, kahverengi yağ dokusunu aktive ederek ekstra kalori yakımına yardımcı olabilir."
];

export const DietPage: React.FC<Props> = ({ profile, onUpdate, onUpdateProfile }) => {
  const [activeTab, setActiveTab] = useState<'diet' | 'body'>('diet');
  const todayStr = new Date().toISOString().split('T')[0];
  
  // --- Diet State ---
  const existingLog = profile.dailyLogs.find(l => l.date === todayStr) || {
    date: todayStr,
    stressLevel: 5, fatigueLevel: 5, nutritionScore: 5, sleepHours: 8, waterIntake: 0, symptoms: [], immunityScore: 80,
    meals: [], exercises: [], totalCaloriesIn: 0, totalCaloriesOut: 0
  } as DailyLog;

  const [meals, setMeals] = useState<Meal[]>(existingLog.meals || []);
  const [exercises, setExercises] = useState<DailyExercise[]>(existingLog.exercises || []);
  const [activeMealType, setActiveMealType] = useState<string | null>(null);
  
  // Add Meal Form
  const [foodName, setFoodName] = useState("");
  const [foodAmount, setFoodAmount] = useState("");
  const [foodCals, setFoodCals] = useState("");
  const [isCalculating, setIsCalculating] = useState(false);
  
  // Add Exercise Form
  const [showSportForm, setShowSportForm] = useState(false);
  const [sportType, setSportType] = useState("Yürüyüş (Tempolu)");
  const [sportDuration, setSportDuration] = useState(30);

  // --- Body Measurement State ---
  const [neck, setNeck] = useState(profile.measurements?.neck || 0);
  const [waist, setWaist] = useState(profile.measurements?.waist || 0);
  const [hip, setHip] = useState(profile.measurements?.hip || 0);
  const [bodyFat, setBodyFat] = useState(profile.measurements?.bodyFatPercentage || 0);
  const [randomTip, setRandomTip] = useState("");

  useEffect(() => {
    setRandomTip(FITNESS_FACTS[Math.floor(Math.random() * FITNESS_FACTS.length)]);
  }, []);

  // --- Calculations ---
  const bmr = calculateBMR(profile.weight, profile.height, profile.age, profile.gender);
  const totalCaloriesIn = meals.reduce((acc, m) => acc + m.calories, 0);
  const exerciseCalories = exercises.reduce((acc, e) => acc + e.caloriesBurned, 0);
  const totalCaloriesOut = bmr + exerciseCalories;
  const netCalories = totalCaloriesIn - totalCaloriesOut;

  // Sync Log
  useEffect(() => {
    const updatedLog: DailyLog = {
      ...existingLog,
      meals: meals,
      exercises: exercises,
      totalCaloriesIn: totalCaloriesIn,
      totalCaloriesOut: totalCaloriesOut
    };
    onUpdate(updatedLog);
  }, [meals, exercises]);

  // --- Handlers ---
  const handleCalculateAI = async () => {
    if (!foodName || !foodAmount) return;
    setIsCalculating(true);
    try {
      const cals = await estimateCalories(foodName, foodAmount);
      if (cals !== null) setFoodCals(cals.toString());
      else alert("Hesaplama yapılamadı. Lütfen manuel giriniz.");
    } catch (e) {
      console.error(e);
    } finally {
      setIsCalculating(false);
    }
  };

  const handleAddMeal = (type: string) => {
    if (!foodName || !foodCals) return;
    const newMeal: Meal = {
      id: Date.now().toString(),
      name: `${foodName} (${foodAmount || 'Porsiyon'})`,
      calories: Number(foodCals),
      type: type as any
    };
    setMeals([...meals, newMeal]);
    setFoodName(""); setFoodAmount(""); setFoodCals(""); setActiveMealType(null);
  };

  const handleAddExercise = () => {
    const met = SPORTS_MET_VALUES[sportType] || 3;
    const burned = calculateCaloriesBurned(met, profile.weight, sportDuration);
    const newEx: DailyExercise = {
      id: Date.now().toString(),
      name: sportType,
      durationMinutes: sportDuration,
      caloriesBurned: burned
    };
    setExercises([...exercises, newEx]);
    setShowSportForm(false);
  };

  const handleCalculateFat = () => {
    const fat = calculateBodyFat(profile.gender, waist, neck, profile.height, hip);
    setBodyFat(fat);
    const updatedMeasurements = {
      neck, waist, hip, bodyFatPercentage: fat, calculatedDate: new Date().toISOString().split('T')[0]
    };
    onUpdateProfile({ ...profile, measurements: updatedMeasurements });
  };

  // Feedback Analysis
  const getFeedback = () => {
    if (totalCaloriesIn < bmr - 500) return { type: 'danger', msg: "DİKKAT: Çok düşük kalori alıyorsun! Kas kaybı riski.", icon: <AlertTriangle size={24} className="text-red-600"/> };
    if (netCalories < -100) return { type: 'success', msg: "Kalori Açığı: Kilo verme modundasın. Harika!", icon: <CheckCircle size={24} className="text-green-600"/> };
    if (netCalories > 500) return { type: 'warning', msg: "Kalori Fazlası: Bugün biraz fazla kaçırdın.", icon: <AlertTriangle size={24} className="text-orange-600"/> };
    return { type: 'neutral', msg: "Dengeli Beslenme: Kilonu koruyorsun.", icon: <CheckCircle size={24} className="text-blue-600"/> };
  };
  const status = getFeedback();

  // Goal Analysis
  const getGoalAnalysis = () => {
    const isMale = profile.gender === 'male';
    const idealFat = isMale ? 15 : 22;
    if (bodyFat === 0) return null;
    if (bodyFat <= idealFat + 2) return { status: 'ideal', msg: "İdeal yağ oranındasın!" };
    const fatMassToLose = profile.weight * ((bodyFat - idealFat) / 100);
    const totalCals = fatMassToLose * 7700;
    const days = Math.round(totalCals / 500);
    return { status: 'work', fatToLose: fatMassToLose.toFixed(1), days: days, months: (days / 30).toFixed(1) };
  };
  const goalData = getGoalAnalysis();

  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto space-y-6">
      
      {/* Tabs */}
      <div className="flex bg-gray-200 p-1 rounded-xl">
        <button 
          onClick={() => setActiveTab('diet')}
          className={`flex-1 py-2 text-sm font-bold rounded-lg transition ${activeTab === 'diet' ? 'bg-white shadow text-teal-700' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Kalori Takibi
        </button>
        <button 
          onClick={() => setActiveTab('body')}
          className={`flex-1 py-2 text-sm font-bold rounded-lg transition ${activeTab === 'body' ? 'bg-white shadow text-teal-700' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Vücut Analizi
        </button>
      </div>

      {activeTab === 'diet' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-left-2">
          
          {/* --- NEW SUMMARY DESIGN (From Fitness Page) --- */}
          <div className="grid grid-cols-2 gap-3">
             {/* Calories In */}
             <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between h-32">
                <span className="text-xs text-gray-400 font-bold uppercase tracking-wider flex items-center gap-1">
                   <Utensils size={14}/> Alınan
                </span>
                <div>
                   <span className="text-3xl font-extrabold text-gray-800">{totalCaloriesIn}</span>
                   <span className="text-xs text-gray-400 block">kcal</span>
                </div>
                <div className="w-full bg-gray-100 h-1.5 rounded-full mt-2">
                   <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${Math.min((totalCaloriesIn / bmr) * 100, 100)}%` }}></div>
                </div>
             </div>

             {/* Calories Out (DARK THEME) */}
             <div className="bg-gray-900 text-white p-4 rounded-2xl shadow-xl flex flex-col justify-between h-32 relative overflow-hidden">
                <div className="flex justify-between items-start z-10">
                   <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Yakılan</span>
                   <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                     <Flame size={12} fill="white" />
                   </div>
                </div>
                <div className="z-10">
                   <span className="text-3xl font-extrabold">{totalCaloriesOut}</span>
                   <span className="text-xs text-gray-400 block">kcal (BMR+Spor)</span>
                </div>
                {/* Background Decor */}
                <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-red-500/20 rounded-full blur-xl"></div>
             </div>
          </div>

          {/* Net Status Bar */}
          <div className={`flex items-center justify-between p-4 rounded-xl border border-dashed ${netCalories > 0 ? 'bg-orange-50 border-orange-200 text-orange-800' : 'bg-teal-50 border-teal-200 text-teal-800'}`}>
             <div className="flex items-center gap-2">
               <Scale size={20}/>
               <span className="font-bold">Net Durum</span>
             </div>
             <span className="text-xl font-bold">{netCalories > 0 ? `+${netCalories}` : netCalories} kcal</span>
          </div>

          <p className="text-xs text-center text-gray-400">{status.msg}</p>

          {/* Meals List */}
          <div className="space-y-3">
             <h3 className="font-bold text-gray-800">Öğünler</h3>
             {MEAL_TYPES.map(type => {
               const mealsOfType = meals.filter(m => m.type === type.id);
               const calsOfType = mealsOfType.reduce((acc, m) => acc + m.calories, 0);
               return (
                  <div key={type.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                     <div 
                       className={`flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition ${activeMealType === type.id ? 'bg-gray-50' : ''}`}
                       onClick={() => setActiveMealType(activeMealType === type.id ? null : type.id)}
                     >
                        <div className="flex items-center gap-3">
                           <div className={`w-3 h-3 rounded-full ${type.color.split(' ')[0].replace('bg-', 'bg-')}`}></div>
                           <span className="font-medium text-gray-700">{type.label}</span>
                        </div>
                        <span className="text-sm font-bold text-gray-600">{calsOfType} kcal</span>
                     </div>
                     {activeMealType === type.id && (
                        <div className="p-4 bg-gray-50 border-t border-gray-100">
                           {/* List */}
                           <ul className="space-y-2 mb-4">
                             {mealsOfType.map(meal => (
                               <li key={meal.id} className="flex justify-between items-center text-sm bg-white p-2 rounded border border-gray-200">
                                 <span>{meal.name}</span>
                                 <div className="flex items-center gap-2">
                                   <span className="font-bold">{meal.calories}</span>
                                   <button onClick={(e) => {e.stopPropagation(); setMeals(meals.filter(m=>m.id!==meal.id))}} className="text-red-400"><Trash2 size={14}/></button>
                                 </div>
                               </li>
                             ))}
                           </ul>
                           {/* Add Form */}
                           <div className="space-y-2">
                              <div className="flex gap-2">
                                <input type="text" placeholder="Yiyecek" value={foodName} onChange={e => setFoodName(e.target.value)} className="flex-1 p-2 text-sm border rounded-lg"/>
                                <input type="text" placeholder="Miktar" value={foodAmount} onChange={e => setFoodAmount(e.target.value)} className="flex-1 p-2 text-sm border rounded-lg"/>
                              </div>
                              <div className="flex gap-2">
                                 <input type="number" placeholder="Kalori" value={foodCals} onChange={e => setFoodCals(e.target.value)} className="w-20 p-2 text-sm border rounded-lg"/>
                                 <button onClick={handleCalculateAI} disabled={isCalculating} className="bg-indigo-100 text-indigo-700 px-3 rounded-lg flex-1 text-xs font-bold flex items-center justify-center gap-1">
                                    {isCalculating ? <Loader2 size={14} className="animate-spin"/> : <Wand2 size={14}/>} AI Hesapla
                                 </button>
                                 <button onClick={() => handleAddMeal(type.id)} className="bg-teal-600 text-white px-3 rounded-lg"><Plus size={20}/></button>
                              </div>
                           </div>
                        </div>
                     )}
                  </div>
               );
             })}
          </div>

          {/* Exercise List */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-4">
               <h3 className="font-bold text-gray-800">Egzersizler</h3>
               <button onClick={() => setShowSportForm(!showSportForm)} className="text-teal-600 text-sm font-bold flex items-center gap-1"><Plus size={16}/> Ekle</button>
            </div>
            {exercises.map(ex => (
               <div key={ex.id} className="flex justify-between items-center bg-red-50 p-2 rounded-lg border border-red-100 text-sm mb-2">
                  <span>{ex.name} ({ex.durationMinutes}dk)</span>
                  <div className="flex items-center gap-2">
                     <span className="font-bold text-red-700">-{ex.caloriesBurned}</span>
                     <button onClick={() => setExercises(exercises.filter(e => e.id !== ex.id))} className="text-red-400"><Trash2 size={14}/></button>
                  </div>
               </div>
            ))}
            {showSportForm && (
               <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                  <select value={sportType} onChange={e => setSportType(e.target.value)} className="w-full p-2 text-sm border rounded-lg">
                     {Object.keys(SPORTS_MET_VALUES).map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <div className="flex gap-2 items-center">
                     <input type="range" min="10" max="120" step="5" value={sportDuration} onChange={e => setSportDuration(Number(e.target.value))} className="flex-1"/>
                     <span className="text-xs font-bold w-10">{sportDuration}dk</span>
                     <button onClick={handleAddExercise} className="bg-red-500 text-white px-3 py-1 rounded text-sm">Ekle</button>
                  </div>
               </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'body' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-2">
           <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
              <h3 className="font-bold text-gray-800 flex items-center gap-2 border-b pb-2">
                <Ruler size={18} className="text-orange-500" /> Mezura Ölçüleri (cm)
              </h3>
              <div className="grid grid-cols-2 gap-4">
                 <div><label className="text-xs text-gray-500">Boyun</label><input type="number" value={neck||''} onChange={e=>setNeck(Number(e.target.value))} className="w-full p-2 border rounded-lg mt-1"/></div>
                 <div><label className="text-xs text-gray-500">Bel (Göbek)</label><input type="number" value={waist||''} onChange={e=>setWaist(Number(e.target.value))} className="w-full p-2 border rounded-lg mt-1"/></div>
                 {profile.gender === 'female' && <div><label className="text-xs text-gray-500">Kalça</label><input type="number" value={hip||''} onChange={e=>setHip(Number(e.target.value))} className="w-full p-2 border rounded-lg mt-1"/></div>}
              </div>
              <button onClick={handleCalculateFat} className="w-full py-3 bg-teal-600 text-white font-bold rounded-xl shadow-md">Yağ Oranını Hesapla</button>
           </div>

           {bodyFat > 0 && (
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white p-6 rounded-2xl shadow-lg text-center relative overflow-hidden">
                 <span className="text-xs font-bold opacity-80 uppercase">Tahmini Yağ Oranı</span>
                 <div className="text-5xl font-extrabold my-2">%{bodyFat}</div>
                 <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold uppercase">{getBodyFatCategory(bodyFat, profile.gender)}</span>
                 <div className="w-full bg-black/20 h-2 rounded-full mt-4"><div className="bg-white h-2 rounded-full" style={{ width: `${Math.min(bodyFat * 2, 100)}%` }}></div></div>
              </div>
           )}

           {bodyFat > 0 && goalData && (
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-orange-100">
                 <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-2"><TrendingDown size={20} className="text-teal-600" /> Hedef Analizi</h3>
                 {goalData.status === 'ideal' ? <p className="text-green-600 font-bold">{goalData.msg}</p> : (
                    <div className="text-sm text-gray-600">
                       <span className="font-bold text-gray-900">{goalData.fatToLose} kg</span> yağ kaybetmelisin. Günde 500 kcal açıkla tahmini süre: <span className="font-bold text-orange-600">{goalData.months} Ay</span>
                    </div>
                 )}
              </div>
           )}
        </div>
      )}

      {/* "Did You Know" Footer */}
      <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-sm text-blue-800 leading-relaxed shadow-sm mt-8">
         <div className="flex items-center gap-2 font-bold mb-2 text-blue-900">
            <Lightbulb size={18} className="text-yellow-500 fill-yellow-500" /> Biliyor muydun?
         </div>
         {randomTip}
      </div>

    </div>
  );
};