import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Hash, ArrowRight, ShieldCheck, Zap, Users } from 'lucide-react';
import { API } from '../App';

function LoginView({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTextIndex, setActiveTextIndex] = useState(0);

  // Sol paneldeki animasyonlu metinler (Login için özel)
  const infoTexts = [
    { 
      title: "Tekrar Hoş Geldin", 
      desc: "Kaldığın yerden devam et, topluluğun gücünü yanında hisset.",
      icon: <Users className="w-8 h-8 mb-4 opacity-80" />
    },
    { 
      title: "Güvenli Alan", 
      desc: "Verilerin ve paylaşımların uçtan uca şifreleme ile güvende.",
      icon: <ShieldCheck className="w-8 h-8 mb-4 opacity-80" />
    },
    { 
      title: "Hızlı Erişim", 
      desc: "Uzmanlara ve deneyim paylaşımlarına anında ulaş.",
      icon: <Zap className="w-8 h-8 mb-4 opacity-80" />
    }
  ];

  // Metin rotasyonu
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTextIndex((prev) => (prev + 1) % infoTexts.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [infoTexts.length]);

  const handleLogin = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!email || !password) return;
    
    setError('');
    setLoading(true);
    
    try {
      const result = await API.login(email, password);
      localStorage.setItem('token', result.token);
      localStorage.setItem('user', JSON.stringify(result.user));
      onLogin(result.user);
    } catch (err) {
      setError(err.message || 'Geçersiz kimlik bilgileri');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col md:flex-row transition-colors duration-500">
      {/* Sol Panel: Animasyonlu Görsel */}
      <div className="hidden md:flex md:w-1/2 bg-indigo-600 dark:bg-indigo-900 p-12 flex-col justify-between text-white relative overflow-hidden transition-colors duration-500">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-12 animate-fade-in">
            <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
              <Hash className="w-8 h-8 text-white" />
            </div>
            <span className="text-2xl font-bold tracking-tight">CamTavanApp</span>
          </div>

          <div className="h-80 flex flex-col justify-center relative">
            {infoTexts.map((text, index) => (
              <div
                key={index}
                className={`transition-all duration-700 absolute inset-0 transform flex flex-col justify-center ${
                  index === activeTextIndex 
                    ? 'opacity-100 translate-x-0 blur-0' 
                    : 'opacity-0 -translate-x-12 blur-sm pointer-events-none'
                }`}
              >
                <div className="animate-bounce-slow ml-1">{text.icon}</div>
                <h2 className="text-5xl font-extrabold leading-tight mb-6 tracking-tight">
                  {text.title}
                </h2>
                <p className="text-indigo-100 dark:text-indigo-200 text-lg max-w-md leading-relaxed">
                  {text.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Carousel Noktaları */}
        <div className="relative z-10 flex items-center gap-2 mb-8">
          {infoTexts.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveTextIndex(i)}
              className={`h-1.5 rounded-full transition-all duration-500 cursor-pointer hover:bg-white/80 ${
                i === activeTextIndex ? 'w-8 bg-white' : 'w-2 bg-indigo-400 dark:bg-indigo-700'
              }`}
            />
          ))}
        </div>
        
        {/* Dekoratif Arkaplan */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-[100px] opacity-40 animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-[80px] opacity-40 animate-pulse delay-1000"></div>
        
        <div className="relative z-10 text-xs text-indigo-200 mt-4">
          © 2026 Destek Topluluğu.{" "}
<span className="opacity-60">Sürüm {process.env.REACT_APP_VER}</span>
        </div>
      </div>

      {/* Sağ Panel: Login Formu */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-16 relative">
        <div className="w-full max-w-md space-y-8 animate-slide-up-fade">
          
          {/* Mobil Logo */}
          <div className="md:hidden flex flex-col items-center mb-8">
             <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-indigo-200 dark:shadow-none">
                <Hash className="w-7 h-7 text-white" />
             </div>
             <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Giriş Yap</h1>
          </div>

          <div className="hidden md:block">
            <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-3 tracking-tight">Giriş Yap</h1>
            <p className="text-gray-500 dark:text-gray-400 font-medium">Hesabınıza erişmek için bilgilerinizi girin.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-1">
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">E-mail Adresi</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-5 py-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder-gray-400 dark:placeholder-gray-500"
                placeholder="ornek@email.com"
                required
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center ml-1">
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Şifre</label>
                <button type="button" className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors">
                  Şifremi Unuttum?
                </button>
              </div>
              <div className="relative group">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleLogin(e)}
                  className="w-full px-5 py-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder-gray-400 dark:placeholder-gray-500"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors p-1"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/50 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm font-semibold flex items-center gap-2 animate-shake">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full bg-indigo-600 dark:bg-indigo-500 text-white py-4 rounded-2xl font-bold hover:bg-indigo-700 dark:hover:bg-indigo-600 transform transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-indigo-200 dark:shadow-none flex items-center justify-center gap-2 group"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Giriş Yap 
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="space-y-6 pt-2">
            <div className="relative py-2">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100 dark:border-gray-800"></div></div>
                <div className="relative flex justify-center text-xs uppercase font-bold tracking-wider"><span className="bg-gray-50 dark:bg-gray-900 px-3 text-gray-400 dark:text-gray-500">veya</span></div>
            </div>

            <p className="text-center text-gray-600 dark:text-gray-400 text-sm font-medium">
              Hesabın yok mu?{' '}
              <button
                onClick={() => window.location.hash = 'register'}
                className="text-indigo-600 dark:text-indigo-400 font-bold hover:text-indigo-800 dark:hover:text-indigo-300 transition underline decoration-transparent hover:decoration-indigo-600 dark:hover:decoration-indigo-400 underline-offset-2"
              >
                Hemen Kaydol
              </button>
            </p>

            <button
              onClick={() => window.location.hash = '#admin'}
              className="w-full py-2 text-xs text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors font-medium text-center"
            >
              Yönetici Paneli Girişi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginView;