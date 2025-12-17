import React, { useState, useEffect } from 'react';
import { UserProfile, Medication } from '../types';
import { Pill, Plus, Trash2, Clock, CheckCircle2, Circle, AlertCircle } from 'lucide-react';

interface Props {
  profile: UserProfile;
  onUpdateProfile: (p: UserProfile) => void;
}

export const MedicationPage: React.FC<Props> = ({ profile, onUpdateProfile }) => {
  const isAccessible = profile.preferences.accessibilityMode;
  const [medications, setMedications] = useState<Medication[]>(profile.medications || []);
  const [newName, setNewName] = useState('');
  const [newDosage, setNewDosage] = useState('');
  const [newTime, setNewTime] = useState('09:00');
  const [showForm, setShowForm] = useState(false);

  // Reset "taken" status if the day has changed (Basic logic)
  useEffect(() => {
    // In a real app, this logic would be more complex and persistent based on dates.
    // Here we trust the profile state.
  }, []);

  const handleAdd = () => {
    if (!newName) return;
    const newMed: Medication = {
      id: Date.now().toString(),
      name: newName,
      dosage: newDosage || '1 Adet',
      time: newTime,
      isTaken: false
    };
    const updatedMeds = [...medications, newMed].sort((a, b) => a.time.localeCompare(b.time));
    setMedications(updatedMeds);
    onUpdateProfile({ ...profile, medications: updatedMeds });
    setNewName('');
    setNewDosage('');
    setShowForm(false);
  };

  const handleDelete = (id: string) => {
    if(window.confirm("Bu ilacı silmek istiyor musunuz?")) {
        const updatedMeds = medications.filter(m => m.id !== id);
        setMedications(updatedMeds);
        onUpdateProfile({ ...profile, medications: updatedMeds });
    }
  };

  const toggleTaken = (id: string) => {
    const updatedMeds = medications.map(m => {
      if (m.id === id) {
        return { 
            ...m, 
            isTaken: !m.isTaken,
            takenAt: !m.isTaken ? new Date().toLocaleTimeString() : undefined
        };
      }
      return m;
    });
    setMedications(updatedMeds);
    onUpdateProfile({ ...profile, medications: updatedMeds });
  };

  // Accessibility Styles
  const containerClass = isAccessible ? "max-w-4xl p-6 space-y-8" : "max-w-2xl p-4 space-y-6";
  const cardClass = isAccessible ? "bg-white p-8 rounded-3xl border-4 border-gray-200 shadow-xl" : "bg-white p-4 rounded-2xl shadow-sm border border-gray-100";
  const textLarge = isAccessible ? "text-3xl" : "text-lg";
  const textNormal = isAccessible ? "text-xl" : "text-sm";
  const btnLarge = isAccessible ? "p-6 text-xl" : "p-3 text-sm";
  const inputClass = isAccessible ? "p-6 text-2xl border-4 border-gray-300 rounded-2xl" : "p-3 border border-gray-200 rounded-xl";

  return (
    <div className={`pb-24 mx-auto ${containerClass}`}>
      
      {/* HEADER */}
      <header className={`${isAccessible ? 'mb-8' : 'mb-4'}`}>
        <h1 className={`${isAccessible ? 'text-4xl' : 'text-2xl'} font-bold text-gray-900 flex items-center gap-3`}>
          <Pill className={isAccessible ? "w-12 h-12 text-teal-600" : "w-6 h-6 text-teal-600"} /> 
          İlaç Takibi
        </h1>
        <p className={`text-gray-500 mt-2 ${textNormal}`}>
          {isAccessible ? "İlaçlarınızı zamanında almayı unutmayın." : "Günlük ilaç hatırlatıcılarınız ve takip listeniz."}
        </p>
      </header>

      {/* MEDICATION LIST */}
      <div className="space-y-4">
        {medications.length === 0 && !showForm && (
           <div className={`text-center py-10 text-gray-400 bg-white rounded-2xl border-dashed border-2 ${isAccessible ? 'border-4' : ''}`}>
              <div className="flex justify-center mb-4"><Pill size={isAccessible ? 80 : 48} opacity={0.2}/></div>
              <p className={textNormal}>Henüz ilaç eklenmemiş.</p>
           </div>
        )}

        {medications.map(med => (
          <div key={med.id} className={`${cardClass} flex items-center justify-between transition-all ${med.isTaken ? 'opacity-50 bg-gray-50' : 'bg-white border-teal-100'}`}>
             <div className="flex items-center gap-4 cursor-pointer flex-1" onClick={() => toggleTaken(med.id)}>
                <div className={`${isAccessible ? 'w-16 h-16' : 'w-10 h-10'} rounded-full flex items-center justify-center ${med.isTaken ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                   {med.isTaken ? <CheckCircle2 size={isAccessible ? 40 : 24}/> : <Clock size={isAccessible ? 40 : 24}/>}
                </div>
                <div>
                   <h3 className={`font-bold text-gray-800 ${textLarge} ${med.isTaken ? 'line-through text-gray-400' : ''}`}>{med.name}</h3>
                   <div className={`text-gray-500 flex items-center gap-3 ${textNormal}`}>
                      <span className="bg-gray-100 px-2 py-1 rounded-lg font-mono font-bold text-gray-700">{med.time}</span>
                      <span>• {med.dosage}</span>
                   </div>
                </div>
             </div>
             
             <div className="flex items-center gap-2">
                 {!med.isTaken && isAccessible && (
                    <button onClick={() => toggleTaken(med.id)} className="bg-green-600 text-white font-bold rounded-xl px-6 py-4 mr-2">
                        İÇTİM
                    </button>
                 )}
                 <button onClick={() => handleDelete(med.id)} className="p-3 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition">
                    <Trash2 size={isAccessible ? 32 : 20} />
                 </button>
             </div>
          </div>
        ))}
      </div>

      {/* ADD FORM */}
      {showForm ? (
        <div className={`${cardClass} animate-in fade-in slide-in-from-bottom-4`}>
           <h3 className={`font-bold text-gray-800 mb-4 ${textLarge}`}>Yeni İlaç Ekle</h3>
           <div className="space-y-4">
              <div>
                 <label className={`block text-gray-600 font-bold mb-1 ${textNormal}`}>İlaç Adı</label>
                 <input 
                   type="text" placeholder="Örn: Aspirin" 
                   value={newName} onChange={e => setNewName(e.target.value)}
                   className={`w-full outline-none focus:ring-4 focus:ring-teal-200 ${inputClass}`}
                 />
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className={`block text-gray-600 font-bold mb-1 ${textNormal}`}>Doz</label>
                    <input 
                      type="text" placeholder="1 Adet" 
                      value={newDosage} onChange={e => setNewDosage(e.target.value)}
                      className={`w-full outline-none focus:ring-4 focus:ring-teal-200 ${inputClass}`}
                    />
                 </div>
                 <div>
                    <label className={`block text-gray-600 font-bold mb-1 ${textNormal}`}>Saat</label>
                    <input 
                      type="time" 
                      value={newTime} onChange={e => setNewTime(e.target.value)}
                      className={`w-full outline-none focus:ring-4 focus:ring-teal-200 ${inputClass}`}
                    />
                 </div>
              </div>
              <div className="flex gap-4 pt-4">
                 <button onClick={() => setShowForm(false)} className={`flex-1 bg-gray-200 text-gray-800 font-bold rounded-2xl hover:bg-gray-300 ${btnLarge}`}>
                    İptal
                 </button>
                 <button onClick={handleAdd} className={`flex-1 bg-teal-600 text-white font-bold rounded-2xl hover:bg-teal-700 shadow-lg ${btnLarge}`}>
                    Kaydet
                 </button>
              </div>
           </div>
        </div>
      ) : (
        <button 
          onClick={() => setShowForm(true)}
          className={`w-full bg-indigo-600 text-white font-bold rounded-2xl shadow-lg flex items-center justify-center gap-2 hover:bg-indigo-700 transition transform active:scale-95 ${btnLarge}`}
        >
           <Plus size={isAccessible ? 32 : 24} /> İlaç Ekle
        </button>
      )}

      {/* Info Tip for Accessibility */}
      {isAccessible && (
          <div className="bg-yellow-50 border-l-8 border-yellow-400 p-6 rounded-r-xl mt-8">
              <div className="flex items-start gap-4">
                  <AlertCircle size={40} className="text-yellow-600 mt-1" />
                  <div>
                      <h4 className="text-2xl font-bold text-yellow-800">Hatırlatma</h4>
                      <p className="text-xl text-yellow-700 mt-2">
                          İlacınızı içtikten sonra listedeki ismine dokunarak veya "İÇTİM" düğmesine basarak işaretleyebilirsiniz.
                      </p>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};
