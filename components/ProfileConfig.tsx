
import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { Settings, LogOut, Trash2, Edit2, Save, X, User, Moon, Sun, Dumbbell, ChevronRight, Watch, Bluetooth, Smartphone, RefreshCw, Eye, Phone } from 'lucide-react';
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
  onConnectBluetooth, 
  onDisconnectBluetooth,
  isDeviceConnected 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(profile);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    setFormData(profile);
  }, [profile]);

  const handleSave = () => {
    const heightInMeters = formData.height / 100;
    const bmi = formData.weight / (heightInMeters * heightInMeters);

    const updatedProfile = {
      ...formData,
      bmi: Number(bmi.toFixed(2))
    };

    onUpdate(updatedProfile);
    setIsEditing(false);
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

  const handleCancel = () => {
    setFormData(profile); 
    setIsEditing(false);
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

  const handleDeleteAccount = async () => {
    if (window.confirm("Hesabınızı silmek istediğinize emin misiniz? Tüm verileriniz kalıcı olarak silinecektir.")) {
      try {
        const user = auth.currentUser;
        if (user) {
          await deleteDoc(doc(db, "users", user.uid));
          await user.delete();
        }
      } catch (error: any) {
        alert("Hata: " + error.message);
      }
    }
  };

  const triggerBluetooth = async () => {
    setIsScanning(true);
    try {
      await onConnectBluetooth();
      alert("Cihaz başarıyla bağlandı!");
    } catch (error: any) {
       if (!error.message.includes('cancelled')) {
          alert("Bağlantı hatası: " + error.message);
       }
    } finally {
      setIsScanning(false);
    }
  };

  const bmiCategory = getBMICategory(profile.bmi || 0);
  let bmiColor = "text-green-600 bg-green-50 border-green-200 dark:bg-green-900/30 dark:border-green-800 dark:text-green-400";
  if (bmiCategory === "Zayıf") bmiColor = "text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-400";
  if (bmiCategory === "Fazla Kilolu") bmiColor = "text-orange-600 bg-orange-50 border-orange-200 dark:bg-orange-900/30 dark:border-orange-800 dark:text-orange-400";
  if (bmiCategory === "Obezite") bmiColor = "text-red-600 bg-red-50 border-red-200 dark:bg-red-900/30 dark:border-red-800 dark:text-red-400";

  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
          <Settings className="text-teal-600 dark:text-teal-400" /> Profilim
        </h2>
        {!isEditing && (
          <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-xl text-sm font-medium shadow hover:bg-teal-700 transition active:scale-95">
            <Edit2 size={16} /> Düzenle
          </button>
        )}
      </div>

      {!isEditing ? (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
          <div className="bg-white dark:bg-navy-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-navy-700 flex flex-col md:flex-row items-center gap-6 text-center md:text-left transition-colors">
             <div className="w-20 h-20 bg-teal-100 dark:bg-teal-900/50 rounded-full flex items-center justify-center text-teal-600 dark:text-teal-400 text-2xl font-bold border-4 border-white dark:border-navy-700 shadow-lg">
                {profile.name.charAt(0).toUpperCase()}
             </div>
             <div className="flex-1">
                <h3 className="text-2xl font-bold text-gray-800 dark:text-white">{profile.name}</h3>
                <div className="text-gray-500 dark:text-gray-400 flex flex-col gap-1 mt-1">
                  <div className="flex items-center justify-center md:justify-start gap-2">
                    <span>{profile.age} Yaş</span>
                    <span>•</span>
                    <span>{profile.gender === 'male' ? 'Erkek' : 'Kadın'}</span>
                  </div>
                  {profile.phoneNumber && (
                    <div className="flex items-center justify-center md:justify-start gap-1 text-teal-600 text-sm font-bold">
                       <Phone size={14}/> {profile.phoneNumber}
                    </div>
                  )}
                </div>
             </div>
             <div className={`px-4 py-2 rounded-xl border ${bmiColor} flex flex-col items-center`}>
                <span className="text-xs font-bold opacity-70 uppercase">VKİ Durumu</span>
                <span className="font-bold text-lg">{bmiCategory}</span>
             </div>
          </div>

          <div className="bg-white dark:bg-navy-800 rounded-2xl shadow-sm border border-gray-100 dark:border-navy-700 overflow-hidden">
             <h4 className="p-4 font-bold text-gray-800 dark:text-gray-200 border-b border-gray-100 dark:border-navy-700 uppercase text-xs tracking-widest">Uygulama Ayarları</h4>
             <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-navy-700 bg-yellow-50 dark:bg-yellow-900/10">
                <div className="flex items-center gap-3">
                   <div className="p-2 bg-yellow-200 dark:bg-yellow-900/50 rounded-lg text-yellow-700 dark:text-yellow-400"><Eye size={20} /></div>
                   <div>
                      <div className="font-bold text-gray-900 dark:text-white">Erişilebilirlik Modu</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Yaşlı ve engelli bireyler için büyük yazı ve kontrast.</div>
                   </div>
                </div>
                <button onClick={() => handleTogglePreference('accessibilityMode')} className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${profile.preferences.accessibilityMode ? 'bg-teal-600' : 'bg-gray-300 dark:bg-gray-600'}`}>
                   <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${profile.preferences.accessibilityMode ? 'translate-x-6' : ''}`}></div>
                </button>
             </div>
             <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-navy-700">
                <div className="flex items-center gap-3">
                   <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg text-orange-600 dark:text-orange-400"><Dumbbell size={20} /></div>
                   <div><div className="font-medium text-gray-900 dark:text-white">Sporcu Modu</div><div className="text-xs text-gray-500 dark:text-gray-400">Performans analizi ve antrenman takibi.</div></div>
                </div>
                <button onClick={() => handleTogglePreference('isAthleteMode')} className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${profile.preferences.isAthleteMode ? 'bg-teal-600' : 'bg-gray-300 dark:bg-gray-600'}`}>
                   <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${profile.preferences.isAthleteMode ? 'translate-x-6' : ''}`}></div>
                </button>
             </div>
             <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                   <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">{profile.preferences.theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}</div>
                   <div><div className="font-medium text-gray-900 dark:text-white">Karanlık Mod</div><div className="text-xs text-gray-500 dark:text-gray-400">Göz yormayan koyu tema.</div></div>
                </div>
                <button onClick={() => handleTogglePreference('theme')} className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${profile.preferences.theme === 'dark' ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600'}`}>
                   <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${profile.preferences.theme === 'dark' ? 'translate-x-6' : ''}`}></div>
                </button>
             </div>
          </div>

          <div className="pt-4 space-y-3">
             <button onClick={handleLogout} className="w-full flex items-center justify-between p-4 bg-white dark:bg-navy-800 border border-gray-200 dark:border-navy-700 rounded-xl hover:bg-gray-50 dark:hover:bg-navy-700 transition group">
                <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300 font-medium"><LogOut size={20} className="text-gray-400 group-hover:text-red-500 transition-colors"/> Çıkış Yap</div>
                <ChevronRight size={16} className="text-gray-300" />
             </button>
             <button onClick={handleDeleteAccount} className="w-full flex items-center justify-between p-4 bg-white dark:bg-navy-800 border border-red-100 dark:border-red-900/30 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition group">
                <div className="flex items-center gap-3 text-red-600 font-medium"><Trash2 size={20} className="text-red-400 group-hover:text-red-600"/> Hesabı Sil</div>
             </button>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-navy-800 p-6 rounded-2xl shadow-lg border border-teal-100 dark:border-navy-700 animate-in fade-in zoom-in-95">
           <h3 className="font-bold text-gray-800 dark:text-white mb-6 pb-2 border-b dark:border-navy-700 uppercase">Bilgileri Düzenle</h3>
           <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ad Soyad</label>
                <div className="relative">
                   <User className="absolute left-3 top-3 text-gray-400" size={18}/>
                   <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-navy-600 dark:bg-navy-900 dark:text-white rounded-xl focus:ring-2 focus:ring-teal-500 outline-none"/>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Telefon Numarası</label>
                <div className="relative">
                   <Phone className="absolute left-3 top-3 text-gray-400" size={18}/>
                   <input type="tel" value={formData.phoneNumber || ''} onChange={e => setFormData({...formData, phoneNumber: e.target.value})} className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-navy-600 dark:bg-navy-900 dark:text-white rounded-xl focus:ring-2 focus:ring-teal-500 outline-none" placeholder="05XX XXX XX XX"/>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Kilo (kg)</label>
                    <input type="number" value={formData.weight} onChange={e => setFormData({...formData, weight: Number(e.target.value)})} className="w-full p-2 border border-gray-300 dark:border-navy-600 dark:bg-navy-900 dark:text-white rounded-xl focus:ring-2 focus:ring-teal-500 outline-none"/>
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Boy (cm)</label>
                    <input type="number" value={formData.height} onChange={e => setFormData({...formData, height: Number(e.target.value)})} className="w-full p-2 border border-gray-300 dark:border-navy-600 dark:bg-navy-900 dark:text-white rounded-xl focus:ring-2 focus:ring-teal-500 outline-none"/>
                 </div>
              </div>
           </div>
           <div className="flex items-center gap-3 mt-8">
              <button onClick={handleCancel} className="flex-1 py-3 bg-gray-100 dark:bg-navy-700 text-gray-700 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-navy-600 transition flex items-center justify-center gap-2"><X size={18} /> İptal</button>
              <button onClick={handleSave} className="flex-1 py-3 bg-teal-600 text-white font-bold rounded-xl hover:bg-teal-700 transition shadow-lg flex items-center justify-center gap-2"><Save size={18} /> Kaydet</button>
           </div>
        </div>
      )}
    </div>
  );
};
