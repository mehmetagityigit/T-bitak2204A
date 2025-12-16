import React, { useState } from 'react';
import { UserProfile } from '../types';
import { Settings, Activity, LogOut, Trash2, AlertTriangle } from 'lucide-react';
import { getBMICategory } from '../services/ruleEngine';
import { auth, db } from '../firebaseConfig';
import { signOut, deleteUser } from 'firebase/auth';
import { doc, deleteDoc } from 'firebase/firestore';

interface Props {
  profile: UserProfile;
  onUpdate: (p: UserProfile) => void;
}

export const ProfileConfig: React.FC<Props> = ({ profile, onUpdate }) => {
  const [formData, setFormData] = useState(profile);
  const [isDeleting, setIsDeleting] = useState(false);

  const saveProfile = () => {
    // Recalculate BMI
    const heightInMeters = formData.height / 100;
    const bmi = formData.weight / (heightInMeters * heightInMeters);

    const updatedProfile = {
      ...formData,
      bmi: Number(bmi.toFixed(2))
    };

    onUpdate(updatedProfile);
    setFormData(updatedProfile); // Update local state to reflect new BMI
    alert("Profil başarıyla güncellendi!");
  };

  const handleLogout = async () => {
    if (window.confirm("Çıkış yapmak istediğinize emin misiniz?")) {
      try {
        await signOut(auth);
        // App.tsx handles the redirect via onAuthStateChanged
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
        // 1. Delete User Data from Firestore
        await deleteDoc(doc(db, "users", user.uid));
        
        // 2. Delete User from Authentication
        await deleteUser(user);
        
        // App.tsx will automatically redirect to Login
      }
    } catch (error: any) {
      console.error("Delete Account Error:", error);
      setIsDeleting(false);
      
      // Firebase requires recent login for sensitive actions like deletion
      if (error.code === 'auth/requires-recent-login') {
        alert("Güvenlik gereği, hesabı silmek için yakın zamanda giriş yapmış olmanız gerekiyor. Lütfen çıkış yapıp tekrar giriş yapın ve tekrar deneyin.");
      } else {
        alert("Hesap silinirken bir hata oluştu: " + error.message);
      }
    }
  };

  const bmiCategory = getBMICategory(formData.bmi || 0);
  let bmiColor = "text-green-600 bg-green-100";
  if (bmiCategory === "Zayıf") bmiColor = "text-blue-600 bg-blue-100";
  if (bmiCategory === "Fazla Kilolu") bmiColor = "text-orange-600 bg-orange-100";
  if (bmiCategory === "Obezite") bmiColor = "text-red-600 bg-red-100";

  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
        <Settings className="text-teal-600" /> Profil Ayarları
      </h2>

      {/* Basic Info */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="font-bold text-gray-700 mb-4 border-b pb-2">Kişisel Bilgiler</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-500">Ad Soyad</label>
            <input 
              type="text" value={formData.name} 
              onChange={e => setFormData({...formData, name: e.target.value})}
              className="w-full p-2 border rounded-lg mt-1"
            />
          </div>
          <div>
            <label className="text-sm text-gray-500">Yaş</label>
            <input 
              type="number" value={formData.age} 
              onChange={e => setFormData({...formData, age: Number(e.target.value)})}
              className="w-full p-2 border rounded-lg mt-1"
            />
          </div>
          <div>
            <label className="text-sm text-gray-500">Kilo (kg)</label>
            <input 
              type="number" value={formData.weight} 
              onChange={e => setFormData({...formData, weight: Number(e.target.value)})}
              className="w-full p-2 border rounded-lg mt-1"
            />
          </div>
          <div>
            <label className="text-sm text-gray-500">Boy (cm)</label>
            <input 
              type="number" value={formData.height} 
              onChange={e => setFormData({...formData, height: Number(e.target.value)})}
              className="w-full p-2 border rounded-lg mt-1"
            />
          </div>
        </div>

        {/* BMI Card Display within Settings */}
        <div className="mt-6 bg-gray-50 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${bmiColor}`}>
              <Activity size={24} />
            </div>
            <div>
              <div className="text-xs text-gray-500 font-bold uppercase">Vücut Kitle İndeksi</div>
              <div className="text-xl font-bold text-gray-800">{formData.bmi ? formData.bmi.toFixed(1) : '--'}</div>
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-bold ${bmiColor}`}>
            {bmiCategory}
          </div>
        </div>
      </div>

      <button 
        onClick={saveProfile}
        className="w-full py-3 bg-gray-800 text-white font-bold rounded-xl shadow hover:bg-gray-900 transition"
      >
        Değişiklikleri Kaydet
      </button>

      {/* Account Actions Section */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-red-100 mt-8">
        <h3 className="font-bold text-gray-800 mb-4 border-b pb-2 flex items-center gap-2">
           Hesap Yönetimi
        </h3>
        
        <div className="space-y-3">
          <button 
            onClick={handleLogout}
            className="w-full py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition flex items-center justify-center gap-2"
          >
            <LogOut size={18} />
            Güvenli Çıkış Yap
          </button>

          <button 
            onClick={handleDeleteAccount}
            disabled={isDeleting}
            className="w-full py-3 border border-red-200 bg-red-50 text-red-600 font-medium rounded-xl hover:bg-red-100 transition flex items-center justify-center gap-2"
          >
            {isDeleting ? (
               "Siliniyor..." 
            ) : (
              <>
                <Trash2 size={18} />
                Hesabımı ve Verilerimi Sil
              </>
            )}
          </button>
          
          <div className="flex items-start gap-2 text-xs text-gray-400 mt-2 px-1">
             <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
             <p>Hesabınızı sildiğinizde, kayıtlı tüm tahlil sonuçlarınız ve günlük verileriniz geri döndürülemez şekilde silinir.</p>
          </div>
        </div>
      </div>

      {/* About Project Badge */}
      <div className="text-center pt-8">
        <span className="bg-teal-50 text-teal-700 px-4 py-1 rounded-full text-xs font-semibold border border-teal-100">
          TÜBİTAK 2204A Proje Prototipi
        </span>
      </div>
    </div>
  );
};