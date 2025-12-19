
import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { Settings, LogOut, Trash2, Edit2, Save, X, User, Moon, Sun, Dumbbell, ChevronRight, Phone, Calendar, ShieldAlert } from 'lucide-react';
import { getBMICategory } from '../services/ruleEngine';
import { auth, db } from '../firebaseConfig';
import { doc, deleteDoc } from 'firebase/firestore';

interface Props {
  profile: UserProfile;
  onUpdate: (p: UserProfile) => void;
  onConnectBluetooth: () => Promise<void>;
  onDisconnectBluetooth: () => void;
  isDeviceConnected: boolean;
}

export const ProfileConfig: React.FC<Props> = ({ 
  profile, 
  onUpdate, 
  isDeviceConnected 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(profile);

  useEffect(() => {
    setFormData(profile);
  }, [profile]);

  const handleSave = () => {
    const heightInMeters = formData.height / 100;
    const bmi = formData.weight / (heightInMeters * heightInMeters);
    // FIX: Re-calculate age when profile is edited to ensure BMR calculation stays correct
    const calculatedAge = new Date().getFullYear() - formData.birthDate.year;

    const updatedProfile = {
      ...formData,
      bmi: Number(bmi.toFixed(2)),
      // FIX: Updating age property
      age: calculatedAge
    };

    onUpdate(updatedProfile);
    setIsEditing(false);
  };

  const updateBirthDate = (field: 'day' | 'month' | 'year', value: number) => {
    setFormData({
      ...formData,
      birthDate: { ...formData.birthDate, [field]: value }
    });
  };

  const handleTogglePreference = (key: 'theme' | 'isAthleteMode' | 'accessibilityMode') => {
    let newVal;
    if (key === 'theme') {
      newVal = profile.preferences.theme === 'dark' ? 'light' : 'dark';
    } else {
      newVal = !profile.preferences[key];
    }

    onUpdate({
      ...profile,
      preferences: {
        ...profile.preferences,
        [key]: newVal
      }
    });
  };

  const handleLogout = async () => {
    if (window.confirm("Çıkış yapmak istediğinize emin misiniz?")) {
      try {
        await auth.signOut();
      } catch (error) {
        console.error("Logout Error:", error);
      }
    }
  };

  const bmiCategory = getBMICategory(profile.bmi || 0);

  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
          <Settings className="text-teal-600 dark:text-teal-400" /> Profilim
        </h2>
        {!isEditing && (
          <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-xl text-sm font-medium shadow active:scale-95 transition">
            <Edit2 size={16} /> Düzenle
          </button>
        )}
      </div>

      {!isEditing ? (
        <div className="space-y-6">
          <div className="bg-white dark:bg-navy-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-navy-700">
             <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-teal-100 dark:bg-teal-900 text-teal-600 rounded-full flex items-center justify-center text-xl font-black uppercase">
                   {profile.firstName.charAt(0)}{profile.lastName.charAt(0)}
                </div>
                <div>
                   <h3 className="text-xl font-bold text-gray-900 dark:text-white">{profile.firstName} {profile.lastName}</h3>
                   <p className="text-sm text-gray-500">{profile.birthDate.day}/{profile.birthDate.month}/{profile.birthDate.year} • {profile.gender === 'male' ? 'Erkek' : 'Kadın'}</p>
                </div>
             </div>
             
             <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 dark:bg-navy-900 p-3 rounded-2xl">
                   <div className="text-[10px] font-bold text-gray-400 uppercase mb-1">Vücut Kitle İndeksi</div>
                   <div className="text-lg font-black text-gray-800 dark:text-white">{profile.bmi} <span className="text-xs font-normal text-teal-600">({bmiCategory})</span></div>
                </div>
                <div className="bg-gray-50 dark:bg-navy-900 p-3 rounded-2xl">
                   <div className="text-[10px] font-bold text-gray-400 uppercase mb-1">Kan Grubu</div>
                   <div className="text-lg font-black text-gray-800 dark:text-white">{profile.bloodGroup || 'Belirtilmedi'}</div>
                </div>
             </div>

             {profile.chronicIllnesses.length > 0 && (
                <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-100 dark:border-red-900/30">
                   <div className="text-[10px] font-bold text-red-600 uppercase flex items-center gap-1 mb-2"><ShieldAlert size={14}/> Kronik Rahatsızlıklar</div>
                   <div className="flex flex-wrap gap-2">
                      {profile.chronicIllnesses.map((ill, idx) => (
                        <span key={idx} className="bg-white dark:bg-navy-800 px-3 py-1 rounded-lg text-xs font-bold text-gray-700 dark:text-gray-300 border dark:border-navy-700">{ill}</span>
                      ))}
                   </div>
                </div>
             )}
          </div>

          <div className="bg-white dark:bg-navy-800 rounded-2xl shadow-sm border border-gray-100 dark:border-navy-700 overflow-hidden">
             <div className="flex items-center justify-between p-4 border-b dark:border-navy-700">
                <div className="flex items-center gap-3">
                   <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg text-orange-600 dark:text-orange-400"><Dumbbell size={20} /></div>
                   <div className="font-medium text-gray-900 dark:text-white">Sporcu Modu</div>
                </div>
                <button onClick={() => handleTogglePreference('isAthleteMode')} className={`w-12 h-6 rounded-full p-1 transition-colors ${profile.preferences.isAthleteMode ? 'bg-teal-600' : 'bg-gray-300'}`}>
                   <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${profile.preferences.isAthleteMode ? 'translate-x-6' : ''}`}></div>
                </button>
             </div>
             <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                   <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">{profile.preferences.theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}</div>
                   <div className="font-medium text-gray-900 dark:text-white">Karanlık Mod</div>
                </div>
                <button onClick={() => handleTogglePreference('theme')} className={`w-12 h-6 rounded-full p-1 transition-colors ${profile.preferences.theme === 'dark' ? 'bg-indigo-600' : 'bg-gray-300'}`}>
                   <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${profile.preferences.theme === 'dark' ? 'translate-x-6' : ''}`}></div>
                </button>
             </div>
          </div>

          <button onClick={handleLogout} className="w-full flex items-center justify-between p-4 bg-white dark:bg-navy-800 border border-red-100 dark:border-red-900/30 rounded-2xl text-red-600 font-bold hover:bg-red-50 dark:hover:bg-red-900/20 transition">
             <div className="flex items-center gap-3"><LogOut size={20}/> Çıkış Yap</div>
             <ChevronRight size={18} />
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-navy-800 p-6 rounded-3xl shadow-lg border border-teal-100 dark:border-navy-700 space-y-4">
           <h3 className="font-bold text-gray-800 dark:text-white border-b dark:border-navy-700 pb-2">Bilgileri Düzenle</h3>
           <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1 block">Ad</label>
                <input type="text" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} className="w-full p-2 border dark:bg-navy-900 dark:border-navy-700 rounded-xl outline-none"/>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1 block">Soyad</label>
                <input type="text" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} className="w-full p-2 border dark:bg-navy-900 dark:border-navy-700 rounded-xl outline-none"/>
              </div>
           </div>
           <div>
              <label className="text-xs font-bold text-gray-500 mb-1 block">Doğum Tarihi (G/A/Y)</label>
              <div className="grid grid-cols-3 gap-2">
                 <input type="number" value={formData.birthDate.day} onChange={e => updateBirthDate('day', +e.target.value)} className="p-2 border dark:bg-navy-900 dark:border-navy-700 rounded-xl"/>
                 <input type="number" value={formData.birthDate.month} onChange={e => updateBirthDate('month', +e.target.value)} className="p-2 border dark:bg-navy-900 dark:border-navy-700 rounded-xl"/>
                 <input type="number" value={formData.birthDate.year} onChange={e => updateBirthDate('year', +e.target.value)} className="p-2 border dark:bg-navy-900 dark:border-navy-700 rounded-xl"/>
              </div>
           </div>
           <div>
              <label className="text-xs font-bold text-gray-500 mb-1 block">Kan Grubu</label>
              <select value={formData.bloodGroup} onChange={e => setFormData({...formData, bloodGroup: e.target.value})} className="w-full p-2 border dark:bg-navy-900 dark:border-navy-700 rounded-xl">
                 <option value="">Belirtilmedi</option>
                 <option>A Rh+</option><option>A Rh-</option><option>B Rh+</option><option>B Rh-</option><option>AB Rh+</option><option>AB Rh-</option><option>0 Rh+</option><option>0 Rh-</option>
              </select>
           </div>
           <div className="grid grid-cols-2 gap-3">
              <div>
                 <label className="text-xs font-bold text-gray-500 mb-1 block">Kilo (kg)</label>
                 <input type="number" value={formData.weight} onChange={e => setFormData({...formData, weight: +e.target.value})} className="w-full p-2 border dark:bg-navy-900 dark:border-navy-700 rounded-xl"/>
              </div>
              <div>
                 <label className="text-xs font-bold text-gray-500 mb-1 block">Boy (cm)</label>
                 <input type="number" value={formData.height} onChange={e => setFormData({...formData, height: +e.target.value})} className="w-full p-2 border dark:bg-navy-900 dark:border-navy-700 rounded-xl"/>
              </div>
           </div>
           <div className="flex gap-3 pt-4">
              <button onClick={() => setIsEditing(false)} className="flex-1 py-3 bg-gray-100 dark:bg-navy-700 rounded-xl font-bold">İptal</button>
              <button onClick={handleSave} className="flex-1 py-3 bg-teal-600 text-white rounded-xl font-bold">Kaydet</button>
           </div>
        </div>
      )}
    </div>
  );
};
