import React, { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import { Link, useNavigate } from 'react-router-dom';
import { UserProfile, INITIAL_PROFILE } from '../types';
import { Activity } from 'lucide-react';

export const Register: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // Initialize form with default profile structure
  const [profileData, setProfileData] = useState<UserProfile>(INITIAL_PROFILE);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Calculate BMI before saving
      // BMI = kg / (m * m)
      const heightInMeters = profileData.height / 100;
      const calculatedBMI = profileData.weight / (heightInMeters * heightInMeters);

      // 1. Create User in Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Save Profile in Firestore
      // We use the Auth UID as the document ID for easy retrieval
      await setDoc(doc(db, "users", user.uid), {
        ...profileData,
        bmi: Number(calculatedBMI.toFixed(2)), // Save BMI
      });

      navigate('/');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        setError('Bu e-posta adresi zaten kullanımda.');
      } else {
        setError('Kayıt sırasında bir hata oluştu: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = (field: string, value: any) => {
    setProfileData({ ...profileData, [field]: value });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 flex items-center justify-center">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 text-teal-700 flex items-center justify-center gap-2">
            <Activity /> SağlıkAsist Kayıt
          </h1>
          <p className="text-gray-500 mt-2">Bağışıklık skorunuzu hesaplamak için lütfen formu doldurun.</p>
        </div>

        {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-6 text-center">{error}</div>}

        <form onSubmit={handleRegister} className="space-y-8">
          
          {/* Section 1: Account Info */}
          <div>
            <h3 className="font-bold text-gray-800 border-b pb-2 mb-4">Hesap Bilgileri</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">E-posta</label>
                <input type="email" required className="w-full p-2 border rounded-lg mt-1" value={email} onChange={e => setEmail(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Şifre</label>
                <input type="password" required className="w-full p-2 border rounded-lg mt-1" value={password} onChange={e => setPassword(e.target.value)} />
              </div>
            </div>
          </div>

          {/* Section 2: Personal Info */}
          <div>
            <h3 className="font-bold text-gray-800 border-b pb-2 mb-4">Kişisel Bilgiler</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700">Ad Soyad</label>
                <input type="text" required className="w-full p-2 border rounded-lg mt-1" value={profileData.name} onChange={e => updateProfile('name', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Yaş</label>
                <input type="number" required className="w-full p-2 border rounded-lg mt-1" value={profileData.age} onChange={e => updateProfile('age', Number(e.target.value))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Cinsiyet</label>
                <select className="w-full p-2 border rounded-lg mt-1" value={profileData.gender} onChange={e => updateProfile('gender', e.target.value)}>
                  <option value="male">Erkek</option>
                  <option value="female">Kadın</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Kilo (kg)</label>
                <input type="number" required className="w-full p-2 border rounded-lg mt-1" value={profileData.weight} onChange={e => updateProfile('weight', Number(e.target.value))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Boy (cm)</label>
                <input type="number" required className="w-full p-2 border rounded-lg mt-1" value={profileData.height} onChange={e => updateProfile('height', Number(e.target.value))} />
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-500 bg-teal-50 p-2 rounded">
              * Boy ve kilo bilgileriniz, Vücut Kitle İndeksi (VKİ) hesaplanarak yapay zeka önerilerinde kullanılacaktır.
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-4 rounded-xl shadow-lg transition transform active:scale-95 disabled:opacity-50"
          >
            {loading ? "Hesap Oluşturuluyor..." : "Kaydı Tamamla"}
          </button>
        </form>

        <div className="text-center mt-6 text-sm text-gray-500">
          Zaten hesabınız var mı? <Link to="/login" className="text-teal-600 font-bold hover:underline">Giriş Yap</Link>
        </div>
      </div>
    </div>
  );
};