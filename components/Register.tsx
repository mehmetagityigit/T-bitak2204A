
import React, { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import { Link, useNavigate } from 'react-router-dom';
import { UserProfile, INITIAL_PROFILE } from '../types';
import { Activity, User, Mail, Lock, Ruler, Weight, ArrowRight, Phone, Calendar, ShieldAlert, CheckSquare, Square } from 'lucide-react';

export const Register: React.FC = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [profileData, setProfileData] = useState<UserProfile>(INITIAL_PROFILE);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 3) { setStep(step + 1); return; }
    if (!agreed) { setError('Lütfen kullanım şartlarını kabul edin.'); return; }

    setLoading(true);
    setError('');

    try {
      const heightInMeters = profileData.height / 100;
      const calculatedBMI = profileData.weight / (heightInMeters * heightInMeters);
      const calculatedAge = new Date().getFullYear() - profileData.birthDate.year;

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        ...profileData,
        bmi: Number(calculatedBMI.toFixed(2)),
        age: calculatedAge,
      });

      navigate('/');
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') setError('Bu e-posta zaten kayıtlı.');
      else setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = (field: string, value: any) => {
    setProfileData({ ...profileData, [field]: value });
  };

  const updateBirthDate = (field: 'day' | 'month' | 'year', value: number) => {
    setProfileData({
      ...profileData,
      birthDate: { ...profileData.birthDate, [field]: value }
    });
  };

  return (
    <div className="min-h-screen flex bg-white">
      <div className="hidden lg:flex lg:w-1/2 bg-gray-900 relative overflow-hidden items-center justify-center text-white p-12">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-teal-900 opacity-90"></div>
        <div className="relative z-10 max-w-lg">
           <h1 className="text-5xl font-bold mb-6">Aramıza <br/><span className="text-teal-400">Katılın.</span></h1>
           <p className="text-gray-300 text-lg">SağlıkAsist ile vücudunuzun sinyallerini dinleyin. Yapay zeka destekli analizlerle daha sağlıklı bir geleceğe adım atın.</p>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12">
        <div className="max-w-md w-full">
           <div className="mb-8">
              <div className="flex items-center gap-2 mb-2">
                 {[1, 2, 3].map(i => (
                    <div key={i} className={`h-2 flex-1 rounded-full ${step >= i ? 'bg-teal-600' : 'bg-gray-200'}`}></div>
                 ))}
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                {step === 1 ? 'Hesap Oluştur' : step === 2 ? 'Kişisel Bilgiler' : 'Sağlık Durumu'}
              </h2>
           </div>

           {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-6 text-sm border border-red-100">{error}</div>}

           <form onSubmit={handleRegister} className="space-y-4">
              {step === 1 && (
                 <div className="space-y-4 animate-in slide-in-from-right">
                    <div className="grid grid-cols-2 gap-3">
                       <div>
                          <label className="text-sm font-medium text-gray-700">Ad</label>
                          <input type="text" required value={profileData.firstName} onChange={e => updateProfile('firstName', e.target.value)} className="w-full p-3 bg-gray-50 border rounded-xl outline-none focus:ring-2 focus:ring-teal-500" placeholder="Adınız"/>
                       </div>
                       <div>
                          <label className="text-sm font-medium text-gray-700">Soyad</label>
                          <input type="text" required value={profileData.lastName} onChange={e => updateProfile('lastName', e.target.value)} className="w-full p-3 bg-gray-50 border rounded-xl outline-none focus:ring-2 focus:ring-teal-500" placeholder="Soyadınız"/>
                       </div>
                    </div>
                    <div>
                       <label className="text-sm font-medium text-gray-700">E-posta</label>
                       <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full p-3 bg-gray-50 border rounded-xl outline-none focus:ring-2 focus:ring-teal-500" placeholder="ornek@email.com"/>
                    </div>
                    <div>
                       <label className="text-sm font-medium text-gray-700">Şifre</label>
                       <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full p-3 bg-gray-50 border rounded-xl outline-none focus:ring-2 focus:ring-teal-500" placeholder="••••••••"/>
                    </div>
                 </div>
              )}

              {step === 2 && (
                 <div className="space-y-4 animate-in slide-in-from-right">
                    <div>
                       <label className="text-sm font-medium text-gray-700 mb-2 block">Doğum Tarihi</label>
                       <div className="grid grid-cols-3 gap-2">
                          <input type="number" placeholder="Gün" value={profileData.birthDate.day} onChange={e => updateBirthDate('day', +e.target.value)} className="p-3 bg-gray-50 border rounded-xl outline-none"/>
                          <input type="number" placeholder="Ay" value={profileData.birthDate.month} onChange={e => updateBirthDate('month', +e.target.value)} className="p-3 bg-gray-50 border rounded-xl outline-none"/>
                          <input type="number" placeholder="Yıl" value={profileData.birthDate.year} onChange={e => updateBirthDate('year', +e.target.value)} className="p-3 bg-gray-50 border rounded-xl outline-none"/>
                       </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <div>
                          <label className="text-sm font-medium text-gray-700">Boy (cm)</label>
                          <input type="number" required value={profileData.height} onChange={e => updateProfile('height', Number(e.target.value))} className="w-full p-3 bg-gray-50 border rounded-xl outline-none focus:ring-2 focus:ring-teal-500"/>
                       </div>
                       <div>
                          <label className="text-sm font-medium text-gray-700">Kilo (kg)</label>
                          <input type="number" required value={profileData.weight} onChange={e => updateProfile('weight', Number(e.target.value))} className="w-full p-3 bg-gray-50 border rounded-xl outline-none focus:ring-2 focus:ring-teal-500"/>
                       </div>
                    </div>
                    <div>
                       <label className="text-sm font-medium text-gray-700">Cinsiyet</label>
                       <select value={profileData.gender} onChange={e => updateProfile('gender', e.target.value)} className="w-full p-3 bg-gray-50 border rounded-xl outline-none focus:ring-2 focus:ring-teal-500">
                          <option value="male">Erkek</option>
                          <option value="female">Kadın</option>
                       </select>
                    </div>
                 </div>
              )}

              {step === 3 && (
                <div className="space-y-4 animate-in slide-in-from-right">
                   <div>
                      <label className="text-sm font-medium text-gray-700 block mb-1">Kan Grubu (Opsiyonel)</label>
                      <select value={profileData.bloodGroup} onChange={e => updateProfile('bloodGroup', e.target.value)} className="w-full p-3 bg-gray-50 border rounded-xl outline-none">
                         <option value="">Seçiniz</option>
                         <option>A Rh+</option><option>A Rh-</option>
                         <option>B Rh+</option><option>B Rh-</option>
                         <option>AB Rh+</option><option>AB Rh-</option>
                         <option>0 Rh+</option><option>0 Rh-</option>
                      </select>
                   </div>
                   <div>
                      <label className="text-sm font-medium text-gray-700 flex items-center gap-1 mb-1"><ShieldAlert size={16}/> Varsa Kronik Rahatsızlıklar</label>
                      <textarea 
                        value={profileData.chronicIllnesses.join(', ')} 
                        onChange={e => updateProfile('chronicIllnesses', e.target.value.split(',').map(s => s.trim()))}
                        className="w-full p-3 bg-gray-50 border rounded-xl h-24 outline-none focus:ring-2 focus:ring-teal-500" 
                        placeholder="Örn: Astım, Diyabet (Virgülle ayırın)"
                      />
                   </div>
                   
                   <div className="flex items-start gap-3 pt-2">
                      <button type="button" onClick={() => setAgreed(!agreed)} className="mt-1">
                         {agreed ? <CheckSquare className="text-teal-600" size={20}/> : <Square className="text-gray-300" size={20}/>}
                      </button>
                      <p className="text-[10px] text-gray-500 leading-tight">
                         Sorumluluk Reddi: SağlıkAsist bir tıbbi tanı cihazı değildir. Verilen öneriler genel bilgilendirme amaçlıdır. <span className="font-bold text-teal-600 underline">Kullanım Şartları ve Gizlilik Politikası</span>'nı kabul ediyorum.
                      </p>
                   </div>
                </div>
              )}

              <button type="submit" disabled={loading} className="w-full mt-4 bg-teal-600 hover:bg-teal-700 text-white font-bold py-4 rounded-xl shadow-lg transition flex items-center justify-center gap-2">
                 {loading ? "İşleniyor..." : (step < 3 ? <>Devam Et <ArrowRight size={18}/></> : "Kaydı Tamamla")}
              </button>
           </form>

           <div className="text-center mt-6">
              <p className="text-gray-600 text-sm">Zaten hesabınız var mı? <Link to="/login" className="text-teal-600 font-bold hover:underline">Giriş Yap</Link></p>
           </div>
        </div>
      </div>
    </div>
  );
};
