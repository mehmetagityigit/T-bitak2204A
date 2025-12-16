import React, { useState, useEffect } from 'react';
import { UserProfile, DailyLog, Meal, DailyExercise } from '../types';
import { calculateBMR, calculateCaloriesBurned, SPORTS_MET_VALUES } from '../services/ruleEngine';
import { Utensils, Flame, Plus, Trash2, PieChart, ChevronDown, ChevronUp, AlertTriangle, CheckCircle } from 'lucide-react';

interface Props {
  profile: UserProfile;
  onUpdate: (log: DailyLog) => void;
}

const MEAL_TYPES = [
  { id: 'breakfast', label: 'Sabah Kahvaltısı', color: 'bg-orange-100 text-orange-700' },
  { id: 'lunch', label: 'Öğle Yemeği', color: 'bg-green-100 text-green-700' },
  { id: 'dinner', label: 'Akşam Yemeği', color: 'bg-blue-100 text-blue-700' },
  { id: 'snack', label: 'Ara Öğünler', color: 'bg-purple-100 text-purple-700' }
];

export const DietPage: React.FC<Props> = ({ profile, onUpdate }) => {
  const todayStr = new Date().toISOString().split('T')[0];
  
  // Find today's log or create a dummy one
  const existingLog = profile.dailyLogs.find(l => l.date === todayStr) || {
    date: todayStr,
    stressLevel: 5, fatigueLevel: 5, nutritionScore: 5, sleepHours: 8, waterIntake: 0, symptoms: [], immunityScore: 80,
    meals: [], exercises: [], totalCaloriesIn: 0, totalCaloriesOut: 0
  } as DailyLog;

  const [meals, setMeals] = useState<Meal[]>(existingLog.meals || []);
  const [exercises, setExercises] = useState<DailyExercise[]>(existingLog.exercises || []);
  
  // Form States
  const [activeMealType, setActiveMealType] = useState<string | null>(null);
  const [foodName, setFoodName] = useState("");
  const [foodCals, setFoodCals] = useState("");
  
  const [showSportForm, setShowSportForm] = useState(false);
  const [sportType, setSportType] = useState("Yürüyüş (Tempolu)");
  const [sportDuration, setSportDuration] = useState(30);

  // Calculations
  const bmr = calculateBMR(profile.weight, profile.height, profile.age, profile.gender);
  const totalCaloriesIn = meals.reduce((acc, m) => acc + m.calories, 0);
  const exerciseCalories = exercises.reduce((acc, e) => acc + e.caloriesBurned, 0);
  const totalCaloriesOut = bmr + exerciseCalories;
  const netCalories = totalCaloriesIn - totalCaloriesOut;

  // Sync to App.tsx when meals/exercises change
  useEffect(() => {
    const updatedLog: DailyLog = {
      ...existingLog,
      meals: meals,
      exercises: exercises,
      totalCaloriesIn: totalCaloriesIn,
      totalCaloriesOut: totalCaloriesOut
    };
    // Debounce slightly to prevent too many writes or handle via a "Save" button if preferred.
    // Here we auto-save for UX.
    onUpdate(updatedLog);
  }, [meals, exercises]);

  const handleAddMeal = (type: string) => {
    if (!foodName || !foodCals) return;
    const newMeal: Meal = {
      id: Date.now().toString(),
      name: foodName,
      calories: Number(foodCals),
      type: type as any
    };
    setMeals([...meals, newMeal]);
    setFoodName("");
    setFoodCals("");
    setActiveMealType(null);
  };

  const handleRemoveMeal = (id: string) => {
    setMeals(meals.filter(m => m.id !== id));
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

  const handleRemoveExercise = (id: string) => {
    setExercises(exercises.filter(e => e.id !== id));
  };

  // Feedback Logic
  const getFeedback = () => {
    // Basic TDEE estimation (Sedentary * 1.2 is usually base, but here we add exercise manually so BMR + Ex is better)
    // Warning threshold: Eating less than BMR is usually dangerous long term.
    
    if (totalCaloriesIn < bmr - 500) {
      return {
        type: 'danger',
        msg: "DİKKAT: Çok düşük kalori alıyorsun! Vücut direncin düşebilir ve kas kaybı yaşayabilirsin.",
        icon: <AlertTriangle size={24} className="text-red-600"/>
      };
    }
    
    if (netCalories < -100) {
      return {
        type: 'success',
        msg: "Kalori Açığı Oluşturdun: Şu an kilo verme (yağ yakımı) modundasın. Harika!",
        icon: <CheckCircle size={24} className="text-green-600"/>
      };
    }

    if (netCalories > 500) {
      return {
        type: 'warning',
        msg: "Kalori Fazlası: Bugün yaktığından fazlasını yedin. Bu durum uzun vadede yağlanmaya sebep olabilir.",
        icon: <AlertTriangle size={24} className="text-orange-600"/>
      };
    }

    return {
      type: 'neutral',
      msg: "Dengeli Beslenme: Aldığın ve yaktığın kalori dengede. Kilonu koruyorsun.",
      icon: <CheckCircle size={24} className="text-blue-600"/>
    };
  };

  const status = getFeedback();

  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Utensils className="text-orange-500" /> Diyet & Kalori Takip
        </h1>
        <p className="text-gray-500 text-sm">Günlük öğünlerini gir, kalori dengeni kontrol et.</p>
      </header>

      {/* Summary Card */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
           <h3 className="font-bold text-gray-700">Günlük Özet</h3>
           <span className="text-xs text-gray-400">Hedef (BMR): {bmr} kcal</span>
        </div>
        
        <div className="flex justify-between items-center text-center mb-4">
          <div>
            <div className="text-xl font-bold text-green-600">{totalCaloriesIn}</div>
            <div className="text-xs text-gray-500">Alınan</div>
          </div>
          <div className="text-gray-400 text-lg font-bold">-</div>
          <div>
            <div className="text-xl font-bold text-red-600">{totalCaloriesOut}</div>
            <div className="text-xs text-gray-500">Yakılan (BMR+Spor)</div>
          </div>
          <div className="text-gray-400 text-lg font-bold">=</div>
          <div>
            <div className={`text-xl font-bold ${netCalories > 0 ? 'text-orange-500' : 'text-teal-600'}`}>
              {netCalories > 0 ? `+${netCalories}` : netCalories}
            </div>
            <div className="text-xs text-gray-500">Net Sonuç</div>
          </div>
        </div>

        {/* Progress Bar for Intake */}
        <div className="relative pt-1">
           <div className="flex mb-2 items-center justify-between">
             <span className="text-xs font-semibold inline-block text-orange-600">Doluluk</span>
           </div>
           <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-orange-100">
             <div style={{ width: `${Math.min((totalCaloriesIn / bmr) * 100, 100)}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-orange-500 transition-all duration-500"></div>
           </div>
        </div>

        {/* Status Message */}
        <div className={`flex items-start gap-3 p-3 rounded-xl border ${
            status.type === 'danger' ? 'bg-red-50 border-red-200 text-red-800' : 
            status.type === 'warning' ? 'bg-orange-50 border-orange-200 text-orange-800' :
            status.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' :
            'bg-blue-50 border-blue-200 text-blue-800'
        }`}>
            <div className="mt-1 flex-shrink-0">{status.icon}</div>
            <p className="text-sm font-medium leading-relaxed">{status.msg}</p>
        </div>
      </div>

      {/* Meals Section */}
      <div className="space-y-4">
        <h3 className="font-bold text-gray-800 border-b pb-2">Öğünler</h3>
        
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
                <div className="flex items-center gap-3">
                   <span className="text-sm font-bold text-gray-600">{calsOfType} kcal</span>
                   {activeMealType === type.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
              </div>

              {activeMealType === type.id && (
                <div className="p-4 bg-gray-50 border-t border-gray-100 animate-in slide-in-from-top-2">
                   {/* List Items */}
                   {mealsOfType.length > 0 && (
                     <ul className="space-y-2 mb-4">
                       {mealsOfType.map(meal => (
                         <li key={meal.id} className="flex justify-between items-center text-sm bg-white p-2 rounded border border-gray-200">
                           <span>{meal.name}</span>
                           <div className="flex items-center gap-3">
                             <span className="font-bold text-gray-600">{meal.calories} kcal</span>
                             <button onClick={(e) => { e.stopPropagation(); handleRemoveMeal(meal.id); }} className="text-red-400 hover:text-red-600"><Trash2 size={14}/></button>
                           </div>
                         </li>
                       ))}
                     </ul>
                   )}

                   {/* Add Form */}
                   <div className="flex gap-2">
                      <input 
                        type="text" placeholder="Yiyecek adı (Örn: Yumurta)" 
                        value={foodName} onChange={e => setFoodName(e.target.value)}
                        className="flex-1 p-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                      <input 
                        type="number" placeholder="kcal" 
                        value={foodCals} onChange={e => setFoodCals(e.target.value)}
                        className="w-20 p-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                      <button 
                        onClick={() => handleAddMeal(type.id)}
                        className="bg-teal-600 text-white p-2 rounded-lg hover:bg-teal-700"
                      >
                        <Plus size={20} />
                      </button>
                   </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Exercise Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <Flame className="text-red-500" /> Günlük Egzersizler
          </h3>
          <span className="text-sm font-bold text-red-600">-{exerciseCalories} kcal</span>
        </div>

        {exercises.length > 0 && (
          <div className="space-y-2 mb-4">
             {exercises.map(ex => (
               <div key={ex.id} className="flex justify-between items-center bg-red-50 p-3 rounded-lg border border-red-100 text-sm">
                 <div>
                   <div className="font-medium text-red-900">{ex.name}</div>
                   <div className="text-xs text-red-500">{ex.durationMinutes} dakika</div>
                 </div>
                 <div className="flex items-center gap-3">
                    <span className="font-bold text-red-700">-{ex.caloriesBurned}</span>
                    <button onClick={() => handleRemoveExercise(ex.id)} className="text-red-400 hover:text-red-600"><Trash2 size={16}/></button>
                 </div>
               </div>
             ))}
          </div>
        )}

        {!showSportForm ? (
          <button 
            onClick={() => setShowSportForm(true)}
            className="w-full py-2 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-teal-500 hover:text-teal-600 transition flex items-center justify-center gap-2 font-medium"
          >
            <Plus size={18} /> Egzersiz Ekle
          </button>
        ) : (
          <div className="bg-gray-50 p-4 rounded-xl animate-in fade-in">
             <div className="space-y-3">
               <select 
                 value={sportType} onChange={e => setSportType(e.target.value)}
                 className="w-full p-2 border rounded-lg text-sm"
               >
                 {Object.keys(SPORTS_MET_VALUES).map(s => <option key={s} value={s}>{s}</option>)}
               </select>
               <div className="flex items-center gap-2">
                  <input 
                    type="range" min="10" max="120" step="5"
                    value={sportDuration} onChange={e => setSportDuration(Number(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-sm font-bold w-16 text-right">{sportDuration} dk</span>
               </div>
               <div className="flex gap-2 pt-2">
                 <button onClick={() => setShowSportForm(false)} className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium">İptal</button>
                 <button onClick={handleAddExercise} className="flex-1 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600">Ekle</button>
               </div>
             </div>
          </div>
        )}
      </div>

    </div>
  );
};