import React, { useState } from 'react';
import { Eye, EyeOff, Hash } from 'lucide-react';
import { API } from '../App';

function RegisterView({ onRegister, onBack }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    gender: '', // erkek, kadın, diğer
    age: '',
    education: '', // İlkokul, Ortaokul, Lise, Üniversite, Diğer
    school: '',
    showPassword: false
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleGenderChange = (gender) => {
    setFormData(prev => ({
      ...prev,
      gender
    }));
  };

  const validateStep1 = () => {
    if (!formData.gender) {
      setError('Lütfen cinsiyet seçiniz');
      return false;
    }
    if (!formData.age || formData.age < 13 || formData.age > 100) {
      setError('Lütfen geçerli bir yaş giriniz');
      return false;
    }
    if (!formData.education) {
      setError('Lütfen eğitim durumunu seçiniz');
      return false;
    }
    if (formData.education === 'Okuyorum' && !formData.school) {
      setError('Lütfen okul adını giriniz');
      return false;
    }
    setError('');
    return true;
  };

  const validateStep2 = () => {
    if (!formData.email) {
      setError('Lütfen e-mail giriniz');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Lütfen geçerli bir e-mail giriniz');
      return false;
    }
    if (!formData.password) {
      setError('Lütfen şifre giriniz');
      return false;
    }
    if (formData.password.length < 8) {
      setError('Şifre en az 8 karakter olmalıdır');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Şifreler eşleşmiyor');
      return false;
    }
    setError('');
    return true;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      handleRegister();
    }
  };

  const handleRegister = async () => {
    setLoading(true);

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
      setError(err.message || 'Kayıt başarısız. E-mail zaten kullanımda olabilir.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-indigo-600 rounded-full mx-auto mb-4 flex items-center justify-center">
            <Hash className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Hesap Oluştur</h1>
          <p className="text-gray-600">Destek topluluğumuza katıl</p>
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-between">
            <span className={`text-sm font-medium ${step === 1 ? 'text-indigo-600' : 'text-gray-400'}`}>
              Adım 1: Bilgiler
            </span>
            <span className={`text-sm font-medium ${step === 2 ? 'text-indigo-600' : 'text-gray-400'}`}>
              Adım 2: Hesap
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
            <div 
              className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / 2) * 100}%` }}
            />
          </div>
        </div>

        <div className="space-y-4">
          {step === 1 ? (
            <>
              {/* CINSIYET */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Cinsiyet</label>
                <div className="space-y-2">
                  {['Erkek', 'Kadın', 'Diğer'].map((option) => (
                    <button
                      key={option}
                      onClick={() => handleGenderChange(option)}
                      className={`w-full px-4 py-3 rounded-lg border-2 text-left transition ${
                        formData.gender === option
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-900'
                          : 'border-gray-200 hover:border-indigo-300 text-gray-700'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              {/* YAŞ */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Yaş</label>
                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleChange}
                  min="13"
                  max="100"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                  placeholder="Yaşınız"
                />
              </div>

              {/* EĞİTİM */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Okul Seçiniz</label>
                <select
                  name="education"
                  value={formData.education}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                >
                  <option value="">— Okul seçiniz —</option>
  <option value="">— Okul seçiniz —</option>

  <option value="Alanya Mesleki ve Teknik Anadolu Lisesi">Alanya Mesleki ve Teknik Anadolu Lisesi —  (Resmi)</option>
  <option value="Rıfat Azakoğlu Mesleki ve Teknik Anadolu Lisesi">Rıfat Azakoğlu Mesleki ve Teknik Anadolu Lisesi — 346659 (Resmi)</option>
  <option value="Alanya Nezihe Soydan Mesleki ve Teknik Anadolu Lisesi">Alanya Nezihe Soydan Mesleki ve Teknik Anadolu Lisesi — 124150 (Resmi)</option>
  <option value="Arıkan Yılmaz Dim Mesleki ve Teknik Anadolu Lisesi">Arıkan Yılmaz Dim Mesleki ve Teknik Anadolu Lisesi — 973062 (Resmi)</option>
  <option value="Alanya Ümit Altay Mesleki ve Teknik Anadolu Lisesi">Alanya Ümit Altay Mesleki ve Teknik Anadolu Lisesi — 215596 (Resmi)</option>
  <option value="Okurcalar Çok Programlı Anadolu Lisesi">Okurcalar Çok Programlı Anadolu Lisesi — 962078 (Resmi)</option>
  <option value="Demirtaş Çok Programlı Anadolu Lisesi">Demirtaş Çok Programlı Anadolu Lisesi — 963823 (Resmi)</option>
  <option value="Avsallar Recep KARACA Çok Programlı Anadolu Lisesi">Avsallar Recep KARACA Çok Programlı Anadolu Lisesi — 876878 (Resmi)</option>
  <option value="Cemile Kuyumcu Mesleki ve Teknik Anadolu Lisesi">Cemile Kuyumcu Mesleki ve Teknik Anadolu Lisesi — 748757 (Resmi)</option>
  <option value="Eczacı Güzin-Velittin Bekrioğlu Mesleki ve Teknik Anadolu Lisesi">Eczacı Güzin-Velittin Bekrioğlu Mesleki ve Teknik Anadolu Lisesi — 758327 (Resmi)</option>
  <option value="Emine Gümrükçüler Turizm Mesleki ve Teknik Anadolu Lisesi">Emine Gümrükçüler Turizm Mesleki ve Teknik Anadolu Lisesi — 776181 (Resmi)</option>
  <option value="İrfan Bileydi Mesleki ve Teknik Anadolu Lisesi">İrfan Bileydi Mesleki ve Teknik Anadolu Lisesi — 775889 (Resmi)</option>
  <option value="Payallar Çok Programlı Anadolu Lisesi">Payallar Çok Programlı Anadolu Lisesi — 758312 (Resmi)</option>
  <option value="Feyzi Alaettinoğlu Anadolu Lisesi">Feyzi Alaettinoğlu Anadolu Lisesi — 972439 (Resmi)</option>
  <option value="Oba Anadolu Lisesi">Oba Anadolu Lisesi — 750707 (Resmi)</option>
  <option value="Alanya Lisesi">Alanya Lisesi — 974830 (Resmi)</option>
  <option value="Alanya Mehmet Arif Türktaş Anadolu Lisesi">Alanya Mehmet Arif Türktaş Anadolu Lisesi — 751179 (Resmi)</option>
  <option value="Hasan Çolak Anadolu Lisesi">Hasan Çolak Anadolu Lisesi — 223432 (Resmi)</option>
  <option value="Mahmutlar Anadolu Lisesi">Mahmutlar Anadolu Lisesi — 750708 (Resmi)</option>
  <option value="Mustafa-Mürüvvet Alaattinoğlu Anadolu Lisesi">Mustafa-Mürüvvet Alaattinoğlu Anadolu Lisesi — 750709 (Resmi)</option>
  <option value="Nimet Alaettinoğlu Anadolu Lisesi">Nimet Alaettinoğlu Anadolu Lisesi — 974828 (Resmi)</option>
  <option value="Kestel Sultan Alparslan Anadolu Lisesi">Kestel Sultan Alparslan Anadolu Lisesi — 758395 (Resmi)</option>
  <option value="Oba Nazmi Yılmaz Anadolu Lisesi">Oba Nazmi Yılmaz Anadolu Lisesi — 974829 (Resmi)</option>
  <option value="Şehit Abdullah Ümit Sercan Anadolu Lisesi">Şehit Abdullah Ümit Sercan Anadolu Lisesi — 964290 (Resmi)</option>
  <option value="15 Temmuz Şehitler Anadolu Lisesi">15 Temmuz Şehitler Anadolu Lisesi — 762118 (Resmi)</option>
  <option value="Hüseyin Girenes Fen Lisesi">Hüseyin Girenes Fen Lisesi — 970851 (Resmi)</option>
  <option value="Türkler Borsa İstanbul Sosyal Bilimler Lisesi">Türkler Borsa İstanbul Sosyal Bilimler Lisesi — 758087 (Resmi)</option>
  <option value="Türkler Güzel Sanatlar Lisesi">Türkler Güzel Sanatlar Lisesi — 758377 (Resmi)</option>
  <option value="Alanya Kız Anadolu İmam Hatip Lisesi">Alanya Kız Anadolu İmam Hatip Lisesi — 124162 (Resmi)</option>
  <option value="Emine Ahmet Uysal Teknoloji Anadolu Lisesi">Emine Ahmet Uysal Teknoloji Anadolu Lisesi — 764673 (Resmi)</option>
  <option value="Nebahat Şifa Anadolu İmam Hatip Lisesi">Nebahat Şifa Anadolu İmam Hatip Lisesi — 757703 (Resmi)</option>
  <option value="Fatma Özmüftüoğlu Anadolu İmam Hatip Lisesi">Fatma Özmüftüoğlu Anadolu İmam Hatip Lisesi — 761369 (Resmi)</option>
  <option value="Alanya Mevlüt Çavuşoğlu Spor Lisesi">Alanya Mevlüt Çavuşoğlu Spor Lisesi — 763520 (Resmi)</option>
  <option value="Demirtaş Anadolu İmam Hatip Lisesi">Demirtaş Anadolu İmam Hatip Lisesi — 766152 (Resmi)</option>

  <option value="Özel Doğa Fen Lisesi">Özel Doğa Fen Lisesi — 99971387 (Özel)</option>
  <option value="Özel Doğa Anadolu Lisesi">Özel Doğa Anadolu Lisesi — 99957288 (Özel)</option>
  <option value="Özel Alanya Bahçeşehir Koleji Fen ve Teknoloji Lisesi">Özel Alanya Bahçeşehir Koleji Fen ve Teknoloji Lisesi — 99997318 (Özel)</option>
  <option value="Özel Alanya Final Akademi Anadolu Lisesi">Özel Alanya Final Akademi Anadolu Lisesi — 99985754 (Özel)</option>
  <option value="Alanya Özel Hamdullah Eminpaşa Anadolu Lisesi">Alanya Özel Hamdullah Eminpaşa Anadolu Lisesi — 99910036 (Özel)</option>
  <option value="Özel Alanya Oba Bahçeşehir Koleji Anadolu Lisesi">Özel Alanya Oba Bahçeşehir Koleji Anadolu Lisesi — 99991582 (Özel)</option>
  <option value="Özel Klassika -M Uluslararası Lisesi">Özel Klassika -M Uluslararası Lisesi — 99957856 (Özel Milletlerarası)</option>
  <option value="TED Alanya Koleji Özel Lisesi">TED Alanya Koleji Özel Lisesi — 99947412 (Özel)</option>
  <option value="Özel Alanya Yedi Bilim Anadolu Lisesi">Özel Alanya Yedi Bilim Anadolu Lisesi — 99977865 (Özel)</option>
  <option value="Özel Alanya Yedi Bilim Fen Lisesi">Özel Alanya Yedi Bilim Fen Lisesi — 99977863 (Özel)</option>
  <option value="Özel Yaşam Tasarım Fen Lisesi">Özel Yaşam Tasarım Fen Lisesi — 99982739 (Özel)</option>
  <option value="Özel Yaşam Tasarım Anadolu Lisesi">Özel Yaşam Tasarım Anadolu Lisesi — 99982734 (Özel)</option>
  <option value="Özel Yaşam Anadolu Lisesi">Özel Yaşam Anadolu Lisesi — 99994732 (Özel)</option>
  <option value="Özel Eğitim İncisi Milletlerarası Lisesi">Özel Eğitim İncisi Milletlerarası Lisesi — 99917181 (Özel Milletlerarası)</option>

                </select>
              </div>

              {/* OKUL BİLGİSİ */}
              {formData.education === 'Okuyorum' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Okul Adı</label>
                  <input
                    type="text"
                    name="school"
                    value={formData.school}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                    placeholder="Okul adınız"
                  />
                </div>
              )}
            </>
          ) : (
            <>
              {/* E-MAİL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">E-mail</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                  placeholder="ornek@email.com"
                />
              </div>

              {/* ŞİFRE */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Şifre</label>
                <div className="relative">
                  <input
                    type={formData.showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({
                      ...prev,
                      showPassword: !prev.showPassword
                    }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {formData.showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* ŞİFRE ONAYI */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Şifre Onayla</label>
                <input
                  type={formData.showPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                  placeholder="••••••••"
                />
              </div>
            </>
          )}

          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 mt-6">
            {step === 2 && (
              <button
                onClick={() => setStep(1)}
                className="flex-1 px-4 py-3 rounded-lg font-semibold text-gray-700 hover:bg-gray-100 transition"
              >
                Geri
              </button>
            )}
            <button
              onClick={handleNext}
              disabled={loading}
              className={`flex-1 px-4 py-3 rounded-lg font-semibold text-white transition ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              } ${step === 1 ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}
            >
              {loading ? 'İşleniyor...' : step === 1 ? 'İleri' : 'Hesap Oluştur'}
            </button>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Zaten hesabın var mı?{' '}
            <button
              onClick={onBack}
              className="text-indigo-600 font-semibold hover:text-indigo-700"
            >
              Giriş Yap
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default RegisterView;