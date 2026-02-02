import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Hash, ArrowRight, ArrowLeft, CheckCircle2, ShieldCheck, Heart, Award, Sparkles } from 'lucide-react';
import { API } from '../App';

function RegisterView({ onRegister, onBack }) {
  const [step, setStep] = useState(1);
  const [activeTextIndex, setActiveTextIndex] = useState(0);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    gender: '',
    age: '',
    education: '',
    school: '',
    kvkkApproved: false,
    showPassword: false
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Sol paneldeki animasyonlu metinler (İkonlar eklendi)
  const infoTexts = [
    { 
        title: "Güvenli Paylaşım", 
        desc: "Sorunlarını anonim olarak paylaş, topluluktan destek al.",
        icon: <ShieldCheck className="w-8 h-8 mb-4 opacity-90" />
    },
    { 
        title: "Uzman Görüşleri", 
        desc: "Eğitim ve gelişim yolculuğunda doğru bilgiye ulaş.",
        icon: <Award className="w-8 h-8 mb-4 opacity-90" />
    },
    { 
        title: "Birlikte Güçlüyüz", 
        desc: "Seninle benzer yollardan geçen binlerce kişi burada.",
        icon: <Heart className="w-8 h-8 mb-4 opacity-90" />
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTextIndex((prev) => (prev + 1) % infoTexts.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [infoTexts.length]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  const validateStep2 = () => {
    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Geçerli bir e-mail adresi giriniz.');
      return false;
    }
    if (formData.password.length < 8) {
      setError('Şifre en az 8 karakter olmalıdır.');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Şifreler birbiriyle eşleşmiyor.');
      return false;
    }
    if (!formData.kvkkApproved) {
      setError('Devam etmek için KVKK metnini onaylamalısınız.');
      return false;
    }
    return true;
  };

  const handleRegister = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await API.register(formData.email, formData.password, {
        gender: formData.gender,
        age: parseInt(formData.age),
        education: formData.education,
        school: formData.school || null
      });
      localStorage.setItem('token', result.token);
      localStorage.setItem('user', JSON.stringify(result.user));
      onRegister(result.user);
    } catch (err) {
      setError(err.message || 'Kayıt başarısız. Bu e-mail zaten kayıtlı olabilir.');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (step === 1) {
      if (!formData.gender || !formData.age || !formData.education) {
        setError('Lütfen tüm alanları doldurun.');
        return;
      }
      setError('');
      setStep(2);
    } else if (step === 2) {
      if (validateStep2()) {
        handleRegister();
      }
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col md:flex-row font-sans transition-colors duration-500">
      
      {/* SOL PANEL: Animasyonlu Bölüm */}
      <div className="hidden md:flex md:w-2/5 bg-indigo-600 dark:bg-indigo-900 p-16 flex-col justify-between text-white relative overflow-hidden transition-colors duration-500">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-16 cursor-pointer group" onClick={onBack}>
            <div className="bg-white/10 p-2 rounded-xl backdrop-blur-sm group-hover:bg-white/20 transition-all">
               <Hash className="w-8 h-8" />
            </div>
            <span className="text-2xl font-bold tracking-tight">CamTavanApp</span>
          </div>

          <div className="h-72 flex flex-col justify-center relative">
            {infoTexts.map((text, index) => (
              <div
                key={index}
                className={`transition-all duration-700 absolute inset-0 transform ${
                  index === activeTextIndex 
                    ? 'opacity-100 translate-y-0 blur-0' 
                    : 'opacity-0 -translate-y-8 blur-sm pointer-events-none'
                }`}
              >
                <div className="animate-bounce-slow">{text.icon}</div>
                <h2 className="text-5xl font-black leading-tight mb-6">{text.title}</h2>
                <p className="text-indigo-100 dark:text-indigo-200 text-xl max-w-sm leading-relaxed font-medium">{text.desc}</p>
              </div>
            ))}
          </div>
        </div>
        
        <div className="relative z-10 flex items-center gap-2">
          {infoTexts.map((_, i) => (
            <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${i === activeTextIndex ? 'w-10 bg-white' : 'w-2 bg-indigo-400 dark:bg-indigo-700'}`} />
          ))}
        </div>

        {/* Dekoratif Blur Efektleri */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-[100px] opacity-30 -mr-20 -mt-20 animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500 rounded-full mix-blend-multiply filter blur-[80px] opacity-20 -ml-10 -mb-10 animate-pulse delay-700"></div>
      </div>

      {/* SAĞ PANEL: Form Bölümü */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-gray-50 dark:bg-gray-900 transition-colors duration-500">
        <div className="w-full max-w-md space-y-8">
          
          <div className="text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-xs font-bold mb-4 tracking-wider border border-indigo-200 dark:border-indigo-800">
              <Sparkles size={14} /> ADIM {step} / 2
            </div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Hesap Oluştur</h1>
            <p className="mt-2 text-gray-500 dark:text-gray-400 font-medium">Bize katılmak için sadece birkaç saniye yeterli.</p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-8 rounded-[2rem] shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-gray-700 transition-all duration-300">
            {step === 1 ? (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 ml-1">Cinsiyet</label>
                  <div className="grid grid-cols-3 gap-3">
                    {['Erkek', 'Kadın', 'Diğer'].map((opt) => (
                      <button 
                        key={opt} 
                        type="button"
                        onClick={() => setFormData({...formData, gender: opt})} 
                        className={`py-3.5 rounded-2xl border-2 text-sm font-bold transition-all ${
                            formData.gender === opt 
                            ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 shadow-sm' 
                            : 'border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 ml-1">Yaşınız</label>
                  <input type="number" name="age" value={formData.age} onChange={handleChange} 
                    className="w-full px-5 py-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-white focus:bg-white dark:focus:bg-gray-800 focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all" 
                    placeholder="Örn: 17" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 ml-1">Okulunuz</label>
                  <div className="relative">
                    <select name="education" value={formData.education} onChange={handleChange} 
                        className="w-full px-5 py-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-white focus:bg-white dark:focus:bg-gray-800 focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all appearance-none cursor-pointer"
                    >
                        <option value="">Seçiniz...</option>
                        <option value="Alanya Lisesi">Alanya Lisesi</option>
                        <option value="Hüseyin Girenes Fen Lisesi">Hüseyin Girenes Fen Lisesi</option>
                        <option value="Diğer">Diğer</option>
                    </select>
                    <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-5 animate-in fade-in slide-in-from-right-8 duration-500">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 ml-1">E-mail</label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} 
                    className="w-full px-5 py-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-white focus:bg-white dark:focus:bg-gray-800 focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all" 
                    placeholder="eposta@adresiniz.com" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 ml-1">Şifre</label>
                  <div className="relative">
                    <input type={formData.showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange} 
                        className="w-full px-5 py-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-white focus:bg-white dark:focus:bg-gray-800 focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all" 
                        placeholder="••••••••" 
                    />
                    <button type="button" onClick={() => setFormData(p => ({ ...p, showPassword: !p.showPassword }))} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400">
                      {formData.showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 ml-1">Şifre Tekrar</label>
                  <input type={formData.showPassword ? 'text' : 'password'} name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} 
                    className="w-full px-5 py-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-white focus:bg-white dark:focus:bg-gray-800 focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all" 
                    placeholder="••••••••" 
                  />
                </div>

                <div className="pt-2">
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <div className="relative flex items-center pt-0.5">
                      <input
                        type="checkbox"
                        name="kvkkApproved"
                        checked={formData.kvkkApproved}
                        onChange={handleChange}
                        className="peer h-5 w-5 cursor-pointer appearance-none rounded-lg border-2 border-gray-300 dark:border-gray-600 checked:bg-indigo-600 checked:border-indigo-600 transition-all bg-white dark:bg-gray-800"
                      />
                      <CheckCircle2 className="absolute h-5 w-5 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none p-0.5" />
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 leading-tight group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors">
                      <button type="button" className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline">KVKK Aydınlatma Metni</button>'ni okudum, anladım ve kabul ediyorum.
                    </span>
                  </label>
                </div>
              </div>
            )}

            {error && (
              <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-2xl text-xs font-bold border border-red-100 dark:border-red-800/50 animate-shake flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                {error}
              </div>
            )}

            <div className="flex gap-3 mt-8">
              {step === 2 && (
                <button onClick={() => setStep(1)} className="px-5 py-4 rounded-2xl font-bold text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all border border-transparent hover:border-gray-200 dark:hover:border-gray-600">
                  <ArrowLeft size={22} />
                </button>
              )}
              <button
                onClick={handleNext}
                disabled={loading}
                className="flex-1 bg-indigo-600 dark:bg-indigo-500 text-white py-4 rounded-2xl font-bold hover:bg-indigo-700 dark:hover:bg-indigo-600 transform transition-all active:scale-95 shadow-xl shadow-indigo-200 dark:shadow-none flex items-center justify-center gap-2 disabled:opacity-50 group"
              >
                {loading ? "İşleniyor..." : step === 1 ? "Sonraki Adım" : "Hesabımı Oluştur"}
                {!loading && <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />}
              </button>
            </div>
          </div>

          <p className="text-center text-gray-500 dark:text-gray-400 text-sm font-medium">
            Zaten bir hesabın var mı? <button onClick={onBack} className="text-indigo-600 dark:text-indigo-400 font-bold hover:text-indigo-800 dark:hover:text-indigo-300 transition underline decoration-transparent hover:decoration-indigo-600 dark:hover:decoration-indigo-400 underline-offset-2">Giriş Yap</button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default RegisterView;