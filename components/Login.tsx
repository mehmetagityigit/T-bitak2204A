import React, { useState } from 'react';
import { auth } from '../firebaseConfig';
import { Link, useHistory } from 'react-router-dom';
import { Activity, Lock, Mail, Key, ArrowLeft, CheckCircle2, HeartPulse } from 'lucide-react';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const history = useHistory();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await auth.signInWithEmailAndPassword(email, password);
      history.push('/');
    } catch (err: any) {
      console.error(err);
      setError('Giriş başarısız. Lütfen bilgilerinizi kontrol edin.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { setError("Lütfen e-posta adresinizi girin."); return; }
    setLoading(true); setError(''); setSuccessMessage('');
    try {
      await auth.sendPasswordResetEmail(email);
      setSuccessMessage("Sıfırlama bağlantısı gönderildi.");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white">
      
      {/* LEFT SIDE - BRANDING (Hidden on Mobile) */}
      <div className="hidden lg:flex lg:w-1/2 bg-teal-600 relative overflow-hidden items-center justify-center text-white p-12">
        <div className="absolute inset-0 bg-gradient-to-br from-teal-600 to-emerald-800 opacity-90"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        
        {/* Floating Shapes Decor */}
        <div className="absolute top-20 left-20 w-32 h-32 bg-white/10 rounded-full blur-2xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-48 h-48 bg-emerald-400/20 rounded-full blur-3xl"></div>

        <div className="relative z-10 max-w-lg space-y-6">
          <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6 shadow-xl border border-white/10">
            <Activity size={48} className="text-white" />
          </div>
          <h1 className="text-5xl font-bold leading-tight">
            Sağlığınızın <br/> <span className="text-emerald-300">Akıllı Asistanı.</span>
          </h1>
          <p className="text-teal-100 text-lg leading-relaxed opacity-90">
            TÜBİTAK 2204A projesi kapsamında geliştirilen yapay zeka destekli kişisel sağlık hafızası. Tahlillerinizi analiz edin, bağışıklığınızı takip edin.
          </p>
          <div className="flex items-center gap-4 pt-4">
             <div className="flex -space-x-3">
                {[1,2,3].map(i => (
                  <div key={i} className="w-10 h-10 rounded-full bg-teal-800 border-2 border-teal-600 flex items-center justify-center text-xs font-bold">U{i}</div>
                ))}
             </div>
             <p className="text-sm font-medium">Binlerce veri analiz edildi.</p>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE - FORM */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12">
        <div className="max-w-md w-full space-y-8">
          
          <div className="text-center lg:text-left">
             <h2 className="text-3xl font-bold text-gray-900">
               {isResetting ? 'Şifre Sıfırlama' : 'Hoş Geldiniz'}
             </h2>
             <p className="text-gray-500 mt-2">
               {isResetting ? 'E-postanızı girerek şifrenizi yenileyin.' : 'Hesabınıza giriş yaparak devam edin.'}
             </p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm flex items-start gap-3 border border-red-100 animate-in slide-in-from-top-2">
              <span className="font-bold">!</span> {error}
            </div>
          )}

          {successMessage && (
            <div className="bg-green-50 text-green-700 p-4 rounded-xl text-sm flex items-start gap-3 border border-green-100 animate-in slide-in-from-top-2">
              <CheckCircle2 size={18} /> {successMessage}
            </div>
          )}

          {isResetting ? (
            <form onSubmit={handleResetPassword} className="space-y-5">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">E-posta Adresi</label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-3.5 text-gray-400 group-focus-within:text-teal-600 transition" size={20} />
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)} 
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:bg-white transition outline-none" placeholder="ornek@email.com" />
                </div>
              </div>
              <button type="submit" disabled={loading} className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3.5 rounded-xl transition shadow-lg shadow-teal-200 disabled:opacity-50">
                {loading ? "Gönderiliyor..." : "Sıfırlama Bağlantısı Gönder"}
              </button>
              <button onClick={() => { setIsResetting(false); setError(''); }} className="w-full text-gray-500 text-sm hover:text-gray-800 py-2 flex items-center justify-center gap-2">
                <ArrowLeft size={14} /> Girişe Dön
              </button>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">E-posta</label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-3.5 text-gray-400 group-focus-within:text-teal-600 transition" size={20} />
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)} 
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:bg-white transition outline-none" placeholder="ornek@email.com" />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between">
                   <label className="text-sm font-medium text-gray-700">Şifre</label>
                   <button type="button" onClick={() => setIsResetting(true)} className="text-xs text-teal-600 font-bold hover:underline">Şifremi Unuttum</button>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-3 top-3.5 text-gray-400 group-focus-within:text-teal-600 transition" size={20} />
                  <input type="password" required value={password} onChange={e => setPassword(e.target.value)} 
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:bg-white transition outline-none" placeholder="••••••••" />
                </div>
              </div>

              <button type="submit" disabled={loading} className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3.5 rounded-xl transition shadow-lg shadow-teal-200 disabled:opacity-50 transform active:scale-[0.98]">
                {loading ? "Giriş Yapılıyor..." : "Giriş Yap"}
              </button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100"></div></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-gray-400">veya</span></div>
              </div>

              <div className="text-center">
                 <p className="text-gray-600">Hesabınız yok mu? <Link to="/register" className="text-teal-600 font-bold hover:underline">Hemen Kaydolun</Link></p>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};