import React, { useState } from 'react';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { Link, useNavigate } from 'react-router-dom';
import { Activity, Lock, Mail, Key, ArrowLeft, CheckCircle2 } from 'lucide-react';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // UI States
  const [isResetting, setIsResetting] = useState(false); // Toggle between Login and Reset mode
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/'); // Redirect to dashboard on success
    } catch (err: any) {
      console.error(err);
      setError('Giriş başarısız. Lütfen e-posta ve şifrenizi kontrol edin.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Lütfen şifre sıfırlama bağlantısı için e-posta adresinizi girin.");
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      await sendPasswordResetEmail(auth, email);
      setSuccessMessage("Şifre sıfırlama bağlantısı e-posta adresinize gönderildi. Lütfen gelen kutunuzu (ve spam klasörünü) kontrol edin.");
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/user-not-found') {
        setError('Bu e-posta adresiyle kayıtlı bir kullanıcı bulunamadı.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Geçersiz bir e-posta adresi girdiniz.');
      } else {
        setError('Bir hata oluştu: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 space-y-6 border border-gray-100 relative overflow-hidden">
        
        {/* Decor */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-400 to-teal-600"></div>

        {/* --- MODE: RESET PASSWORD --- */}
        {isResetting ? (
          <div className="space-y-6 animate-in slide-in-from-right duration-300">
            <div className="text-center space-y-2">
              <div className="inline-flex p-3 bg-teal-100 text-teal-700 rounded-full mb-2">
                <Key size={32} />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Şifremi Unuttum</h1>
              <p className="text-gray-500 text-sm">
                Hesabınıza kayıtlı e-posta adresinizi girin, size şifrenizi yenilemeniz için bir bağlantı gönderelim.
              </p>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-start gap-2">
                <span className="font-bold">!</span> {error}
              </div>
            )}

            {successMessage && (
              <div className="bg-green-50 text-green-700 p-4 rounded-lg text-sm flex items-start gap-2 border border-green-200">
                <CheckCircle2 className="shrink-0" size={18} />
                <span>{successMessage}</span>
              </div>
            )}

            {!successMessage && (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">E-posta</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 text-gray-400" size={20} />
                    <input 
                      type="email" 
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition"
                      placeholder="ornek@email.com"
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 rounded-xl transition duration-200 transform active:scale-95 disabled:opacity-50 shadow-md"
                >
                  {loading ? "Gönderiliyor..." : "Sıfırlama Bağlantısı Gönder"}
                </button>
              </form>
            )}

            <button 
              onClick={() => { setIsResetting(false); setError(''); setSuccessMessage(''); }}
              className="w-full flex items-center justify-center gap-2 text-gray-500 hover:text-gray-700 font-medium py-2 transition"
            >
              <ArrowLeft size={16} /> Giriş Ekranına Dön
            </button>
          </div>
        ) : (
          /* --- MODE: LOGIN --- */
          <div className="space-y-6 animate-in slide-in-from-left duration-300">
            <div className="text-center space-y-2">
              <div className="inline-flex p-3 bg-teal-100 text-teal-700 rounded-full mb-2">
                <Activity size={32} />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">SağlıkAsist</h1>
              <p className="text-gray-500">Kişisel Sağlık Hafızanıza Giriş Yapın</p>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center border border-red-100">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">E-posta</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 text-gray-400" size={20} />
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition"
                    placeholder="ornek@email.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Şifre</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 text-gray-400" size={20} />
                  <input 
                    type="password" 
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition"
                    placeholder="••••••••"
                  />
                </div>
                <div className="flex justify-end mt-1">
                  <button 
                    type="button"
                    onClick={() => setIsResetting(true)}
                    className="text-xs font-semibold text-teal-600 hover:text-teal-800 hover:underline transition"
                  >
                    Şifremi Unuttum?
                  </button>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 rounded-xl transition duration-200 transform active:scale-95 disabled:opacity-50 shadow-md"
              >
                {loading ? "Giriş Yapılıyor..." : "Giriş Yap"}
              </button>
            </form>

            <div className="text-center text-sm text-gray-500 pt-2 border-t border-gray-100">
              Hesabınız yok mu? <Link to="/register" className="text-teal-600 font-bold hover:underline">Kayıt Ol</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};