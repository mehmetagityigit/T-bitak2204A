import React, { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import { Link, useNavigate } from 'react-router-dom';
import { UserProfile, INITIAL_PROFILE } from '../types';
import { Activity, User, Mail, Lock, Ruler, Weight, ArrowRight } from 'lucide-react';

export const Register: React.FC = () => {
  const [step, setStep] = useState(1); // Multi-step form for better UX
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [profileData, setProfileData] = useState<UserProfile>(INITIAL_PROFILE);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) { setStep(2); return; } // Go to next step

    setLoading(true);
    setError('');

    try {
      const heightInMeters = profileData.height / 100;
      const calculatedBMI = profileData.weight / (heightInMeters * heightInMeters);

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        ...profileData,
        bmi: Number(calculatedBMI.toFixed(2)),
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

  return (
    <div className="min-h-screen flex bg-white">
      {/* LEFT SIDE - BRANDING */}
      <div className="hidden lg:flex lg:w-1/2 bg-gray-900 relative overflow-hidden items-center justify-center text-white p-12">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-teal-900 opacity-90"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/20 rounded-full blur-3xl"></div>
        
        <div className="relative z-10 max-w-lg">
           <h1 className="text-5xl font-bold mb-6">Aramıza <br/><span className="text-teal-400">Katılın.</span></h1>
           <p className="text-gray-300 text-lg">SağlıkAsist ile vücudunuzun sinyallerini dinleyin. Yapay zeka destekli analizlerle daha sağlıklı bir geleceğe adım atın.</p>
           
           <div className="mt-12 grid grid-cols-2 gap-6">
              <div className="bg-white/5 backdrop-blur border border-white/10 p-4 rounded-xl">
                 <div className="text-teal-400 font-bold text-xl mb-1">%100</div>
                 <div className="text-sm text-gray-400">Gizlilik Odaklı</div>
              </div>
              <div className="bg-white/5 backdrop-blur border border-white/10 p-4 rounded-xl">
                 <div className="text-teal-400 font-bold text-xl mb-1">7/24</div>
                 <div className="text-sm text-gray-400">AI Asistan</div>
              </div>
           </div>
        </div>
      </div>

      {/* RIGHT SIDE - FORM */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12">
        <div className="max-w-md w-full">
           <div className="mb-8">
              <div className="flex items-center gap-2 mb-2">
                 <div className={`h-2 flex-1 rounded-full ${step >= 1 ? 'bg-teal-600' : 'bg-gray-200'}`}></div>
                 <div className={`h-2 flex-1 rounded-full ${step >= 2 ? 'bg-teal-600' : 'bg-gray-200'}`}></div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">{step === 1 ? 'Hesap Oluştur' : 'Vücut Profiliniz'}</h2>
              <p className="text-gray-500 text-sm">{step === 1 ? 'Giriş bilgilerinizi belirleyin.' : 'Doğru analiz için bu bilgiler gerekli.'}</p>
           </div>

           {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-6 text-sm border border-red-100">{error}</div>}

           <form onSubmit={handleRegister} className="space-y-4">
              {step === 1 && (
                 <div className="space-y-4 animate-in slide-in-from-right">
                    <div>
                       <label className="text-sm font-medium text-gray-700">Ad Soyad</label>
                       <div className="relative mt-1">
                          <User className="absolute left-3 top-3 text-gray-400" size={18}/>
                          <input type="text" required value={profileData.name} onChange={e => updateProfile('name', e.target.value)} className="w-full pl-10 p-3 bg-gray-50 border rounded-xl outline-none focus:ring-2 focus:ring-teal-500" placeholder="Adınız"/>
                       </div>
                    </div>
                    <div>
                       <label className="text-sm font-medium text-gray-700">E-posta</label>
                       <div className="relative mt-1">
                          <Mail className="absolute left-3 top-3 text-gray-400" size={18}/>
                          <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full pl-10 p-3 bg-gray-50 border rounded-xl outline-none focus:ring-2 focus:ring-teal-500" placeholder="ornek@email.com"/>
                       </div>
                    </div>
                    <div>
                       <label className="text-sm font-medium text-gray-700">Şifre</label>
                       <div className="relative mt-1">
                          <Lock className="absolute left-3 top-3 text-gray-400" size={18}/>
                          <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full pl-10 p-3 bg-gray-50 border rounded-xl outline-none focus:ring-2 focus:ring-teal-500" placeholder="••••••••"/>
                       </div>
                    </div>
                 </div>
              )}

              {step === 2 && (
                 <div className="space-y-4 animate-in slide-in-from-right">
                    <div className="grid grid-cols-2 gap-4">
                       <div>
                          <label className="text-sm font-medium text-gray-700">Yaş</label>
                          <input type="number" required value={profileData.age} onChange={e => updateProfile('age', Number(e.target.value))} className="w-full p-3 bg-gray-50 border rounded-xl mt-1 outline-none focus:ring-2 focus:ring-teal-500"/>
                       </div>
                       <div>
                          <label className="text-sm font-medium text-gray-700">Cinsiyet</label>
                          <select value={profileData.gender} onChange={e => updateProfile('gender', e.target.value)} className="w-full p-3 bg-gray-50 border rounded-xl mt-1 outline-none focus:ring-2 focus:ring-teal-500">
                             <option value="male">Erkek</option>
                             <option value="female">Kadın</option>
                          </select>
                       </div>
                    </div>
                    <div>
                       <label className="text-sm font-medium text-gray-700">Boy (cm)</label>
                       <div className="relative mt-1">
                          <Ruler className="absolute left-3 top-3 text-gray-400" size={18}/>
                          <input type="number" required value={profileData.height} onChange={e => updateProfile('height', Number(e.target.value))} className="w-full pl-10 p-3 bg-gray-50 border rounded-xl outline-none focus:ring-2 focus:ring-teal-500" placeholder="175"/>
                       </div>
                    </div>
                    <div>
                       <label className="text-sm font-medium text-gray-700">Kilo (kg)</label>
                       <div className="relative mt-1">
                          <Weight className="absolute left-3 top-3 text-gray-400" size={18}/>
                          <input type="number" required value={profileData.weight} onChange={e => updateProfile('weight', Number(e.target.value))} className="w-full pl-10 p-3 bg-gray-50 border rounded-xl outline-none focus:ring-2 focus:ring-teal-500" placeholder="70"/>
                       </div>
                    </div>
                 </div>
              )}

              <button type="submit" disabled={loading} className="w-full mt-4 bg-teal-600 hover:bg-teal-700 text-white font-bold py-4 rounded-xl shadow-lg transition flex items-center justify-center gap-2">
                 {loading ? "İşleniyor..." : (step === 1 ? <>Devam Et <ArrowRight size={18}/></> : "Kaydı Tamamla")}
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