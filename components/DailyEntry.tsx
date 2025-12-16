import React, { useState, useEffect } from 'react';
import { DailyLog, SYMPTOMS_LIST, UserProfile } from '../types';
import { Save, Clock, CalendarCheck, CheckCircle2, Utensils, Edit2, X } from 'lucide-react';
import { generateDailyFeedback } from '../services/ruleEngine';

interface Props {
  onSave: (log: DailyLog) => void;
  profile: UserProfile;
}

export const DailyEntry: React.FC<Props> = ({ onSave, profile }) => {
  // Check if already logged today
  const todayDateStr = new Date().toISOString().split('T')[0];
  const existingLog = profile.dailyLogs.find(log => log.date === todayDateStr);

  const [stress, setStress] = useState(5);
  const [fatigue, setFatigue] = useState(5);
  const [nutrition, setNutrition] = useState(5);
  const [sleep, setSleep] = useState(7);
  const [water, setWater] = useState(1.5);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [isSaved, setIsSaved] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Clock State
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Populate form if editing or if existing log changes
  useEffect(() => {
    if (existingLog) {
      setStress(existingLog.stressLevel);
      setFatigue(existingLog.fatigueLevel);
      setNutrition(existingLog.nutritionScore || 5);
      setSleep(existingLog.sleepHours);
      setWater(existingLog.waterIntake);
      setSelectedSymptoms(existingLog.symptoms);
    }
  }, [existingLog]);

  const toggleSymptom = (symptom: string) => {
    if (selectedSymptoms.includes(symptom)) {
      setSelectedSymptoms(selectedSymptoms.filter(s => s !== symptom));
    } else {
      setSelectedSymptoms([...selectedSymptoms, symptom]);
    }
  };

  const calculateScore = () => {
    let score = 100;
    score -= (stress * 1.5); 
    score -= (fatigue * 1.5);
    score -= ((10 - nutrition) * 1.5); 
    if (sleep < 7) score -= 10;
    if (water < 2) score -= 5;
    score -= (selectedSymptoms.length * 5);
    
    // Impact of bad blood values from profile (Simulation)
    if (profile.bloodValues.d3 < 30) score -= 5;
    
    return Math.max(0, Math.min(100, Math.round(score)));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const immunityScore = calculateScore();
    const tempLog: DailyLog = {
      date: todayDateStr,
      stressLevel: stress,
      fatigueLevel: fatigue,
      nutritionScore: nutrition,
      sleepHours: sleep,
      waterIntake: water,
      symptoms: selectedSymptoms,
      immunityScore: immunityScore,
      dailyAdvice: '' 
    };

    // Generate Advice
    const advice = generateDailyFeedback(tempLog, profile);
    const finalLog = { ...tempLog, dailyAdvice: advice };

    onSave(finalLog);
    setIsSaved(true);
    setIsEditing(false); // Exit edit mode
    
    // Reset saved animation after delay
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    // Revert state to existing log
    if (existingLog) {
      setStress(existingLog.stressLevel);
      setFatigue(existingLog.fatigueLevel);
      setNutrition(existingLog.nutritionScore || 5);
      setSleep(existingLog.sleepHours);
      setWater(existingLog.waterIntake);
      setSelectedSymptoms(existingLog.symptoms);
    }
  };

  // --- VIEW: ALREADY LOGGED TODAY & NOT EDITING ---
  if (existingLog && !isEditing) {
    return (
      <div className="p-4 pb-24 max-w-2xl mx-auto flex flex-col items-center justify-center min-h-[60vh] space-y-6">
        
        {/* Success Header */}
        <div className="text-center w-full relative">
            {isSaved && (
              <div className="absolute top-0 left-0 right-0 -mt-12 text-green-600 font-bold animate-bounce">
                Güncellendi!
              </div>
            )}
            <div className="inline-flex bg-green-100 p-4 rounded-full text-green-600 mb-2">
                <CheckCircle2 size={40} />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Verileriniz Kaydedildi</h2>
            <div className="flex items-center justify-center gap-2 mt-2 text-gray-500">
                <Clock size={16} />
                <span className="font-mono text-sm">
                    {currentTime.toLocaleTimeString('tr-TR', {hour: '2-digit', minute:'2-digit'})}
                </span>
            </div>
        </div>

        {/* Detailed Feedback Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-teal-100 w-full overflow-hidden">
           <div className="bg-teal-600 px-6 py-4 flex items-center justify-between text-white">
             <div className="flex items-center gap-2">
               <CalendarCheck size={24}/>
               <h3 className="text-lg font-bold">Günün Raporu</h3>
             </div>
             {/* EDIT BUTTON */}
             <button 
               onClick={handleEditClick}
               className="bg-teal-700 hover:bg-teal-800 text-white px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 transition"
             >
               <Edit2 size={14} /> Düzenle
             </button>
           </div>
           
           <div className="p-6">
                <div className="prose prose-sm prose-teal max-w-none text-gray-700 space-y-4 whitespace-pre-line leading-relaxed">
                    {existingLog.dailyAdvice || "Verileriniz işleniyor..."}
                </div>
           </div>
           
           <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 grid grid-cols-3 gap-2 text-center text-sm">
             <div className="flex flex-col">
               <span className="text-gray-400 text-xs uppercase font-bold">Bağışıklık</span>
               <span className={`font-bold text-lg ${existingLog.immunityScore > 70 ? 'text-green-600' : 'text-red-500'}`}>
                 {existingLog.immunityScore}
               </span>
             </div>
             <div className="flex flex-col">
               <span className="text-gray-400 text-xs uppercase font-bold">Beslenme</span>
               <span className="font-bold text-lg text-blue-600">{existingLog.nutritionScore || '-'}/10</span>
             </div>
             <div className="flex flex-col">
               <span className="text-gray-400 text-xs uppercase font-bold">Uyku</span>
               <span className="font-bold text-lg text-purple-600">{existingLog.sleepHours}s</span>
             </div>
           </div>
        </div>
      </div>
    );
  }

  // --- VIEW: ENTRY FORM (Or Editing Mode) ---
  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-3">
            {isEditing && (
              <button onClick={handleCancelEdit} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200">
                <X size={20} className="text-gray-600"/>
              </button>
            )}
            <h2 className="text-2xl font-bold text-gray-800">
              {isEditing ? "Verileri Düzenle" : "Günlük Veri Girişi"}
            </h2>
        </div>
        
        {/* Live Clock */}
        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100 self-start">
           <Clock size={18} className="text-teal-600" />
           <div className="flex flex-col leading-none">
             <span className="text-lg font-mono font-bold text-gray-800">
               {currentTime.toLocaleTimeString('tr-TR', {hour: '2-digit', minute:'2-digit'})}
             </span>
             <span className="text-[10px] text-gray-500">
               {currentTime.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })}
             </span>
           </div>
        </div>
      </header>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Sliders Section */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
          
          {/* Nutrition Slider (New) */}
          <div>
            <label className="flex justify-between font-medium text-gray-700 mb-2 items-center">
              <span className="flex items-center gap-2"><Utensils size={16} className="text-orange-500"/> Beslenme Kalitesi</span>
              <span className="text-teal-600 font-bold bg-teal-50 px-2 py-1 rounded">{nutrition}/10</span>
            </label>
            <input 
              type="range" min="1" max="10" value={nutrition} 
              onChange={(e) => setNutrition(Number(e.target.value))}
              className="w-full h-2 bg-gradient-to-r from-red-300 via-yellow-300 to-green-300 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>Kötü (Fast-food)</span>
              <span>Mükemmel (Sebze/Protein)</span>
            </div>
          </div>

          <hr className="border-gray-100"/>

          <div>
            <label className="flex justify-between font-medium text-gray-700 mb-2">
              <span>Stres Seviyesi</span>
              <span className="text-teal-600 font-bold">{stress}/10</span>
            </label>
            <input 
              type="range" min="1" max="10" value={stress} 
              onChange={(e) => setStress(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
            />
          </div>

          <div>
            <label className="flex justify-between font-medium text-gray-700 mb-2">
              <span>Yorgunluk Seviyesi</span>
              <span className="text-teal-600 font-bold">{fatigue}/10</span>
            </label>
            <input 
              type="range" min="1" max="10" value={fatigue} 
              onChange={(e) => setFatigue(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Uyku (Saat)</label>
              <input 
                type="number" min="0" max="24" step="0.5"
                value={sleep} onChange={e => setSleep(Number(e.target.value))}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
             </div>
             <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Su (Litre)</label>
              <input 
                type="number" min="0" max="10" step="0.1"
                value={water} onChange={e => setWater(Number(e.target.value))}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
             </div>
          </div>
        </div>

        {/* Symptoms Section */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <label className="block font-medium text-gray-700 mb-3">Hastalık Belirtileri</label>
          <div className="flex flex-wrap gap-2">
            {SYMPTOMS_LIST.map(symptom => (
              <button
                key={symptom}
                type="button"
                onClick={() => toggleSymptom(symptom)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  selectedSymptoms.includes(symptom)
                    ? 'bg-red-50 text-red-600 border border-red-200'
                    : 'bg-gray-50 text-gray-600 border border-transparent hover:bg-gray-100'
                }`}
              >
                {symptom}
              </button>
            ))}
          </div>
        </div>

        <button 
          type="submit"
          className="w-full py-4 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-lg transform transition active:scale-95 flex items-center justify-center gap-2"
        >
          {isSaved ? "İşleniyor..." : (
            <>
              <Save size={20} />
              {isEditing ? "Verileri Güncelle" : "Günlük Verileri Kaydet"}
            </>
          )}
        </button>

      </form>
    </div>
  );
};