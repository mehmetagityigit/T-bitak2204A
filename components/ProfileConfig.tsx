import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { Settings, Activity, LogOut, Trash2, AlertTriangle, Edit2, Save, X, User, Ruler, Weight, Droplets, Flame, Moon, ChevronRight } from 'lucide-react';
import { getBMICategory, calculateBMR } from '../services/ruleEngine';
import { auth, db } from '../firebaseConfig';
import { signOut, deleteUser } from 'firebase/auth';
import { doc, deleteDoc } from 'firebase/firestore';

interface Props {
  profile: UserProfile;
  onUpdate: (p: UserProfile) => void;
}

export const ProfileConfig: React.FC<Props> = ({ profile, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(profile);
  const [isDeleting, setIsDeleting] = useState(false);

  // Sync formData if profile changes externally
  useEffect(() => {
    setFormData(profile);
  }, [profile]);

  const handleSave = () => {
    // Recalculate BMI automatically
    const heightInMeters = formData.height / 100;
    const bmi = formData.weight / (heightInMeters * heightInMeters);

    const updatedProfile = {
      ...formData,
      bmi: Number(bmi.toFixed(2))
    };

    onUpdate(updatedProfile);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData(profile); // Revert changes
    setIsEditing(false);
  };

  const handleLogout = async () => {
    if (window.confirm("Çıkış yapmak istediğinize emin misiniz?")) {
      try {
        await signOut(auth);
      } catch (error) {
        console.error("Logout Error:", error);
      }
    }
  };

  const handleDeleteAccount = async () => {
    const confirmation = window.confirm(
      "DİKKAT: Hesabınızı ve tüm sağlık verilerinizi kalıcı olarak silmek üzeresiniz. Bu işlem geri alınamaz! Devam etmek istiyor musunuz?"
    );

    if (!confirmation) return;

    setIsDeleting(true);
    try {
      const user = auth.currentUser;
      if (user) {
        await deleteDoc(doc(db, "users", user.uid));
        await deleteUser(user);
      }
    } catch (error: any) {
      console.error("Delete Account Error:", error);
      setIsDeleting(false);
      if (error.code === 'auth/requires-recent-login') {
        alert("Güvenlik gereği, hesabı silmek için yakın zamanda giriş yapmış olmanız gerekiyor. Lütfen çıkış yapıp tekrar giriş yapın.");
      } else {
        alert("Hata: " + error.message);
      }
    }
  };

  // --- Calculations for "Detailed View" ---
  const bmiCategory = getBMICategory(profile.bmi || 0);
  const bmr = calculateBMR(profile.weight, profile.height, profile.age, profile.gender);
  const waterNeed = (profile.weight * 0.033).toFixed(1); // Rough estimate: 33ml per kg
  
  // BMI Color Logic
  let bmiColor = "text-green-600 bg-green-50 border-green-200";
  if (bmiCategory === "Zayıf") bmiColor = "text-blue-600 bg-blue-50 border-blue-200";
  if (bmiCategory === "Fazla Kilolu") bmiColor = "text-orange-600 bg-orange-50 border-orange-200";
  if (bmiCategory === "Obezite") bmiColor = "text-red-600 bg-red-50 border-red-200";

  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Settings className="text-teal-600" /> Profilim
        </h2>
        {!isEditing && (
          <button 
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-xl text-sm font-medium shadow hover:bg-teal-700 transition active:scale-95"
          >
            <Edit2 size={16} /> Düzenle
          </button>
        )}
      </div>

      {/* --- VIEW MODE: DETAILED CARD --- */}
      {!isEditing ? (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
          
          {/* Identity Card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
             <div className="w-20 h-20 bg-teal-100 rounded-full flex items-center justify-center text-teal-600 text-2xl font-bold border-4 border-white shadow-lg">
                {profile.name.charAt(0).toUpperCase()}
             </div>
             <div className="flex-1">
                <h3 className="text-2xl font-bold text-gray-800">{profile.name}</h3>
                <div className="text-gray-500 flex items-center justify-center md:justify-start gap-4 mt-1">
                  <span>{profile.age} Yaş</span>
                  <span>•</span>
                  <span>{profile.gender === 'male' ? 'Erkek' : 'Kadın'}</span>
                </div>
             </div>
             <div className={`px-4 py-2 rounded-xl border ${bmiColor} flex flex-col items-center`}>
                <span className="text-xs font-bold opacity-70 uppercase">VKİ Durumu</span>
                <span className="font-bold text-lg">{bmiCategory}</span>
             </div>
          </div>

          {/* Physical Stats Grid */}
          <div className="grid grid-cols-3 gap-3">
             <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center gap-2">
                <Weight className="text-blue-500" size={24} />
                <div>
                  <div className="text-lg font-bold text-gray-800">{profile.weight} <span className="text-xs text-gray-400">kg</span></div>
                  <div className="text-xs text-gray-400 text-center">Ağırlık</div>
                </div>
             </div>
             <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center gap-2">
                <Ruler className="text-indigo-500" size={24} />
                <div>
                  <div className="text-lg font-bold text-gray-800">{profile.height} <span className="text-xs text-gray-400">cm</span></div>
                  <div className="text-xs text-gray-400 text-center">Boy</div>
                </div>
             </div>
             <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center gap-2">
                <Activity className="text-pink-500" size={24} />
                <div>
                  <div className="text-lg font-bold text-gray-800">{profile.bmi.toFixed(1)}</div>
                  <div className="text-xs text-gray-400 text-center">VKİ Puanı</div>
                </div>
             </div>
          </div>

          {/* Health Insights (Calculated) */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 text-white shadow-lg">
             <h4 className="font-bold text-gray-200 mb-4 flex items-center gap-2">
               <Activity size={18} /> Vücut İhtiyaç Analizi
             </h4>
             <div className="space-y-4">
                
                {/* BMR */}
                <div className="flex items-center justify-between border-b border-gray-700 pb-3">
                   <div className="flex items-center gap-3">
                      <div className="p-2 bg-orange-500/20 rounded-lg text-orange-400"><Flame size={20}/></div>
                      <div>
                        <div className="font-medium">Bazal Metabolizma</div>
                        <div className="text-xs text-gray-400">Dinlenirken yaktığın enerji</div>
                      </div>
                   </div>
                   <div className="text-xl font-bold">{bmr} <span className="text-sm font-normal text-gray-400">kcal</span></div>
                </div>

                {/* Water */}
                <div className="flex items-center justify-between border-b border-gray-700 pb-3">
                   <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400"><Droplets size={20}/></div>
                      <div>
                        <div className="font-medium">Günlük Su Hedefi</div>
                        <div className="text-xs text-gray-400">Kilona göre önerilen</div>
                      </div>
                   </div>
                   <div className="text-xl font-bold">{waterNeed} <span className="text-sm font-normal text-gray-400">Lt</span></div>
                </div>

                 {/* Sleep */}
                 <div className="flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-500/20 rounded-lg text-purple-400"><Moon size={20}/></div>
                      <div>
                        <div className="font-medium">İdeal Uyku</div>
                        <div className="text-xs text-gray-400">Gelişim çağındakiler için</div>
                      </div>
                   </div>
                   <div className="text-xl font-bold">7-9 <span className="text-sm font-normal text-gray-400">Saat</span></div>
                </div>

             </div>
          </div>

          {/* Account Actions (Read Only Mode) */}
          <div className="pt-4 space-y-3">
             <button onClick={handleLogout} className="w-full flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition group">
                <div className="flex items-center gap-3 text-gray-700 font-medium">
                   <LogOut size={20} className="text-gray-400 group-hover:text-red-500 transition-colors"/> Çıkış Yap
                </div>
                <ChevronRight size={16} className="text-gray-300" />
             </button>
             
             <button onClick={handleDeleteAccount} className="w-full flex items-center justify-between p-4 bg-white border border-red-100 rounded-xl hover:bg-red-50 transition group">
                <div className="flex items-center gap-3 text-red-600 font-medium">
                   <Trash2 size={20} className="text-red-400 group-hover:text-red-600"/> Hesabı Sil
                </div>
             </button>
          </div>
        </div>
      ) : (
        /* --- EDIT MODE: FORM --- */
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-teal-100 animate-in fade-in zoom-in-95">
           <h3 className="font-bold text-gray-800 mb-6 pb-2 border-b">Bilgileri Düzenle</h3>
           
           <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ad Soyad</label>
                <div className="relative">
                   <User className="absolute left-3 top-3 text-gray-400" size={18}/>
                   <input 
                     type="text" 
                     value={formData.name} 
                     onChange={e => setFormData({...formData, name: e.target.value})}
                     className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none"
                   />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Yaş</label>
                    <input 
                      type="number" 
                      value={formData.age} 
                      onChange={e => setFormData({...formData, age: Number(e.target.value)})}
                      className="w-full p-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none"
                    />
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cinsiyet</label>
                    <select 
                      value={formData.gender}
                      onChange={e => setFormData({...formData, gender: e.target.value as any})}
                      className="w-full p-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none bg-white"
                    >
                      <option value="male">Erkek</option>
                      <option value="female">Kadın</option>
                    </select>
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Kilo (kg)</label>
                    <input 
                      type="number" 
                      value={formData.weight} 
                      onChange={e => setFormData({...formData, weight: Number(e.target.value)})}
                      className="w-full p-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none"
                    />
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Boy (cm)</label>
                    <input 
                      type="number" 
                      value={formData.height} 
                      onChange={e => setFormData({...formData, height: Number(e.target.value)})}
                      className="w-full p-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none"
                    />
                 </div>
              </div>
           </div>

           <div className="flex items-center gap-3 mt-8">
              <button 
                onClick={handleCancel}
                className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition flex items-center justify-center gap-2"
              >
                <X size={18} /> İptal
              </button>
              <button 
                onClick={handleSave}
                className="flex-1 py-3 bg-teal-600 text-white font-bold rounded-xl hover:bg-teal-700 transition shadow-lg flex items-center justify-center gap-2"
              >
                <Save size={18} /> Kaydet
              </button>
           </div>
        </div>
      )}

      <div className="text-center pt-8 pb-4">
        <span className="bg-teal-50 text-teal-700 px-4 py-1 rounded-full text-xs font-semibold border border-teal-100">
          TÜBİTAK 2204A Proje Prototipi
        </span>
      </div>
    </div>
  );
};