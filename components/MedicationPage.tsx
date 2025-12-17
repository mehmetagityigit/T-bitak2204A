
import React, { useState, useEffect } from 'react';
import { UserProfile, Medication } from '../types';
import { Pill, Plus, Trash2, Clock, CheckCircle2, AlertCircle, Calendar, Phone, Bell, BellRing, X } from 'lucide-react';

interface Props {
  profile: UserProfile;
  onUpdateProfile: (p: UserProfile) => void;
}

export const MedicationPage: React.FC<Props> = ({ profile, onUpdateProfile }) => {
  const isAccessible = profile.preferences.accessibilityMode;
  const today = new Date().toISOString().split('T')[0];
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }));
  
  // Real-time notification check state
  const [activeNotification, setActiveNotification] = useState<Medication | null>(null);

  // Medications state with auto-reset for new day
  const [medications, setMedications] = useState<Medication[]>(
    (profile.medications || []).map(m => {
      if (m.lastTakenDate !== today) {
        return { ...m, dosesTakenToday: 0, lastTakenDate: today };
      }
      return m;
    })
  );

  const [newName, setNewName] = useState('');
  const [newDosage, setNewDosage] = useState('');
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState('');
  const [timesPerDay, setTimesPerDay] = useState(1);
  const [times, setTimes] = useState<string[]>(['09:00']);
  const [showForm, setShowForm] = useState(false);

  // Clock Update & Notification Check
  useEffect(() => {
    const timer = setInterval(() => {
      const nowStr = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
      setCurrentTime(nowStr);

      // Check for notifications
      const dueMed = medications.find(m => {
        const isActive = today >= m.startDate && today <= m.endDate;
        const isTimeMatch = m.times.includes(nowStr);
        const alreadyNotified = activeNotification?.id === m.id;
        return isActive && isTimeMatch && !alreadyNotified && m.dosesTakenToday < m.timesPerDay;
      });

      if (dueMed) {
        setActiveNotification(dueMed);
        // Browser notification simulation
        if (Notification.permission === "granted") {
          new Notification(`SağlıkAsist: ${dueMed.name} Saati!`, { body: `Lütfen ${dueMed.dosage} dozunu alın.` });
        }
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(timer);
  }, [medications, activeNotification]);

  // Sync state to profile
  useEffect(() => {
    onUpdateProfile({ ...profile, medications: medications });
  }, [medications]);

  const handleFrequencyChange = (newFreq: number) => {
    setTimesPerDay(newFreq);
    let newTimes = [...times];
    if (newFreq > times.length) {
      for (let i = times.length; i < newFreq; i++) {
        newTimes.push("12:00");
      }
    } else {
      newTimes = newTimes.slice(0, newFreq);
    }
    setTimes(newTimes);
  };

  const handleTimeChange = (index: number, val: string) => {
    const newTimes = [...times];
    newTimes[index] = val;
    setTimes(newTimes);
  };

  const handleAdd = () => {
    if (!newName || !endDate) {
      alert("Lütfen ilaç adını ve bitiş tarihini giriniz.");
      return;
    }
    const newMed: Medication = {
      id: Date.now().toString(),
      name: newName,
      dosage: newDosage || '1 Adet',
      startDate: startDate,
      endDate: endDate,
      timesPerDay: timesPerDay,
      times: times,
      dosesTakenToday: 0,
      lastTakenDate: today
    };
    const updatedMeds = [...medications, newMed];
    setMedications(updatedMeds);
    setNewName(''); setNewDosage(''); setEndDate(''); setShowForm(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Bu ilacı takipten çıkarmak istiyor musunuz?")) {
      setMedications(medications.filter(m => m.id !== id));
    }
  };

  const takeDose = (id: string) => {
    const updatedMeds = medications.map(m => {
      if (m.id === id) {
        const nextDoseCount = m.dosesTakenToday < m.timesPerDay ? m.dosesTakenToday + 1 : m.dosesTakenToday;
        return { ...m, dosesTakenToday: nextDoseCount, lastTakenDate: today };
      }
      return m;
    });
    setMedications(updatedMeds);
    if (activeNotification?.id === id) setActiveNotification(null);
  };

  const activeMeds = medications.filter(m => today >= m.startDate && today <= m.endDate);

  // UI Scaling
  const containerClass = isAccessible ? "max-w-4xl p-6 space-y-8" : "max-w-2xl p-4 space-y-6";
  const cardClass = isAccessible ? "bg-white p-8 rounded-3xl border-4 border-gray-200 shadow-xl" : "bg-white p-4 rounded-2xl shadow-sm border border-gray-100";
  const textLarge = isAccessible ? "text-4xl" : "text-lg";
  const textNormal = isAccessible ? "text-2xl" : "text-sm";
  const btnLarge = isAccessible ? "p-8 text-2xl" : "p-3 text-sm";
  const inputClass = isAccessible ? "p-6 text-3xl border-4 border-gray-300 rounded-2xl" : "p-3 border border-gray-200 rounded-xl";

  const getDoseLabel = (index: number) => {
    const labels = ["Sabah Dozu", "Öğle Dozu", "Akşam Dozu", "Gece Dozu", "Ek Doz"];
    return labels[index] || `${index + 1}. Doz`;
  };

  return (
    <div className={`pb-24 mx-auto ${containerClass}`}>
      
      {/* GLOBAL NOTIFICATION OVERLAY */}
      {activeNotification && (
        <div className="fixed top-20 left-4 right-4 z-[100] bg-red-600 text-white p-6 rounded-3xl shadow-2xl animate-bounce border-4 border-white flex items-center justify-between">
           <div className="flex items-center gap-4">
              <div className="bg-white/20 p-3 rounded-full"><BellRing size={32} /></div>
              <div>
                 <div className="font-black text-2xl">İlaç Saati Geldi!</div>
                 <div className="text-lg opacity-90">{activeNotification.name} - {activeNotification.dosage}</div>
              </div>
           </div>
           <button onClick={() => takeDose(activeNotification.id)} className="bg-white text-red-600 font-black px-6 py-3 rounded-2xl hover:bg-gray-100">İÇTİM</button>
           <button onClick={() => setActiveNotification(null)} className="absolute -top-2 -right-2 bg-gray-800 text-white p-1 rounded-full"><X size={16}/></button>
        </div>
      )}

      <header className="flex justify-between items-start">
        <div>
          <h1 className={`${isAccessible ? 'text-5xl' : 'text-2xl'} font-black text-gray-900 flex items-center gap-4 uppercase`}>
            <Pill className={isAccessible ? "w-16 h-16 text-teal-600" : "w-6 h-6 text-teal-600"} /> 
            İlaç Takvimi
          </h1>
          <p className={`text-gray-500 mt-2 ${textNormal}`}>
            Günde birden fazla doz takibi ve SMS hatırlatmaları.
          </p>
        </div>
        <div className={`bg-gray-900 text-white px-4 py-2 rounded-2xl font-black ${isAccessible ? 'text-2xl' : 'text-sm'}`}>
          {currentTime}
        </div>
      </header>

      {/* SMS Status */}
      {profile.phoneNumber && (
        <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl flex items-center gap-3">
           <Phone size={18} className="text-blue-600" />
           <span className="text-xs font-bold text-blue-700">SMS Sistemi Aktif: {profile.phoneNumber}</span>
        </div>
      )}

      {/* TODAY'S MEDICATIONS */}
      <div className="space-y-6">
        <h2 className={`${isAccessible ? 'text-3xl' : 'text-md'} font-black text-teal-700 uppercase`}>Bugünkü İlaçlarınız</h2>
        
        {activeMeds.length === 0 && !showForm && (
           <div className={`text-center py-16 text-gray-400 bg-white rounded-3xl border-dashed border-4`}>
              <p className={textNormal}>Bugün için planlanmış ilaç bulunamadı.</p>
           </div>
        )}

        {activeMeds.map(med => {
          const isDone = med.dosesTakenToday >= med.timesPerDay;
          return (
            <div key={med.id} className={`${cardClass} border-l-[12px] ${isDone ? 'border-l-green-500 bg-green-50/50' : 'border-l-teal-500'}`}>
               <div className="flex flex-col gap-6">
                  <div className="flex items-center justify-between">
                     <div className="flex items-center gap-4">
                        <div className={`${isAccessible ? 'w-20 h-20' : 'w-10 h-10'} rounded-full flex items-center justify-center ${isDone ? 'bg-green-100 text-green-600' : 'bg-teal-100 text-teal-600'}`}>
                           {isDone ? <CheckCircle2 size={isAccessible ? 48 : 24}/> : <Clock size={isAccessible ? 48 : 24}/>}
                        </div>
                        <div>
                           <h3 className={`font-black text-gray-800 ${textLarge}`}>{med.name}</h3>
                           <p className={`text-gray-500 font-bold ${textNormal}`}>{med.dosage}</p>
                        </div>
                     </div>
                     <button onClick={() => handleDelete(med.id)} className="p-2 text-red-300 hover:text-red-500"><Trash2 size={24}/></button>
                  </div>

                  {/* Multiple Times Display */}
                  <div className="flex flex-wrap gap-3">
                     {med.times.map((t, i) => (
                        <div key={i} className={`px-4 py-2 rounded-xl font-black border-2 ${currentTime >= t && med.dosesTakenToday <= i ? 'bg-red-50 border-red-200 text-red-600 animate-pulse' : 'bg-gray-100 border-gray-200 text-gray-500'}`}>
                           {getDoseLabel(i)}: {t}
                        </div>
                     ))}
                  </div>
                  
                  <div className="flex items-center gap-4 border-t pt-4">
                      {!isDone ? (
                        <button onClick={() => takeDose(med.id)} className={`flex-1 bg-teal-600 text-white font-black rounded-3xl shadow-xl active:scale-95 transition ${btnLarge}`}>
                           BU DOZU İÇTİM ({med.dosesTakenToday}/{med.timesPerDay})
                        </button>
                      ) : (
                        <div className="w-full text-center bg-green-600 text-white py-4 rounded-3xl font-black text-xl">BUGÜNKÜ TÜM DOZLAR ALINDI</div>
                      )}
                  </div>
               </div>
            </div>
          );
        })}
      </div>

      {/* ADD FORM */}
      {showForm ? (
        <div className={`${cardClass} animate-in fade-in slide-in-from-bottom-4 border-indigo-200`}>
           <h3 className={`font-black text-indigo-800 mb-8 ${textLarge} border-b pb-4`}>Yeni İlaç Kaydı</h3>
           <div className="space-y-8">
              <div>
                 <label className={`block text-gray-700 font-black mb-3 ${textNormal}`}>İlaç Adı ve Doz</label>
                 <div className="grid grid-cols-2 gap-4">
                   <input type="text" placeholder="Örn: Aspirin" value={newName} onChange={e => setNewName(e.target.value)} className={`w-full outline-none focus:ring-8 focus:ring-indigo-50 ${inputClass}`}/>
                   <input type="text" placeholder="Doz (Örn: 1 Tablet)" value={newDosage} onChange={e => setNewDosage(e.target.value)} className={`w-full outline-none focus:ring-8 focus:ring-indigo-50 ${inputClass}`}/>
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-8">
                 <div>
                    <label className={`block text-gray-700 font-black mb-3 ${textNormal}`}>Başlangıç Tarihi</label>
                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className={`w-full ${inputClass}`}/>
                 </div>
                 <div>
                    <label className={`block text-gray-700 font-black mb-3 ${textNormal}`}>Bitiş Tarihi</label>
                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className={`w-full ${inputClass}`}/>
                 </div>
              </div>

              <div>
                 <label className={`block text-gray-700 font-black mb-3 ${textNormal}`}>Günde Kaç Kere? (Doz Sayısı)</label>
                 <div className="flex items-center gap-6">
                    <button onClick={() => handleFrequencyChange(Math.max(1, timesPerDay - 1))} className="w-20 h-20 bg-gray-200 rounded-3xl text-4xl font-bold">-</button>
                    <div className={`flex-1 text-center font-black text-indigo-600 ${isAccessible ? 'text-7xl' : 'text-5xl'}`}>{timesPerDay}</div>
                    <button onClick={() => handleFrequencyChange(Math.min(5, timesPerDay + 1))} className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-3xl text-4xl font-bold">+</button>
                 </div>
              </div>

              <div className="space-y-4 bg-gray-50 p-6 rounded-3xl border-2 border-dashed border-gray-200">
                 <label className={`block text-gray-700 font-black mb-2 ${textNormal}`}>Her Doz İçin Saat Seçin:</label>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {times.map((t, idx) => (
                       <div key={idx} className="flex items-center gap-3">
                          <span className="w-24 text-sm font-bold text-gray-500">{getDoseLabel(idx)}:</span>
                          <input type="time" value={t} onChange={e => handleTimeChange(idx, e.target.value)} className={`flex-1 font-black ${inputClass}`}/>
                       </div>
                    ))}
                 </div>
              </div>

              <div className="flex gap-6 pt-6">
                 <button onClick={() => setShowForm(false)} className={`flex-1 bg-gray-200 text-gray-800 font-black rounded-3xl hover:bg-gray-300 ${btnLarge}`}>Vazgeç</button>
                 <button onClick={handleAdd} className={`flex-1 bg-indigo-600 text-white font-black rounded-3xl hover:bg-indigo-700 shadow-2xl ${btnLarge}`}>Kaydet ve Başlat</button>
              </div>
           </div>
        </div>
      ) : (
        <button 
          onClick={() => setShowForm(true)}
          className={`w-full bg-teal-600 text-white font-black rounded-[2.5rem] shadow-2xl flex items-center justify-center gap-4 hover:bg-teal-700 transition transform active:scale-95 ${btnLarge}`}
        >
           <Plus size={isAccessible ? 48 : 24} strokeWidth={4} /> Yeni İlaç Takibi Başlat
        </button>
      )}

      {isAccessible && !showForm && (
          <div className="bg-yellow-50 border-l-[12px] border-yellow-400 p-10 rounded-3xl mt-12 shadow-md">
              <div className="flex items-start gap-6">
                  <AlertCircle size={60} className="text-yellow-600 mt-1" />
                  <div>
                      <h4 className="text-4xl font-black text-yellow-800 uppercase">Nasıl Kullanılır?</h4>
                      <p className="text-2xl text-yellow-700 mt-4 leading-relaxed font-medium">
                          Saat geldiğinde telefonunuza SMS gelecek ve ekranda kırmızı uyarı çıkacaktır. İlacı içtikten sonra mutlaka <span className="font-black text-teal-700">"İÇTİM"</span> butonuna basınız.
                      </p>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
