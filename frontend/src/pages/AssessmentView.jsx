import React, { useState, useEffect } from 'react';
import { CheckCircle, Hash, ArrowRight, ArrowLeft, ShieldCheck } from 'lucide-react';

const ASSESSMENT_QUESTIONS = [
  {
    id: 1,
    question: "Erkek aslında duygusaldır fakat güçlü görünmek zorundadır.",
    type: "yes_no"
  },
  {
    id: 2,
    question: "Okulda, gücümün üstünde çalıştığımı hissediyorum.",
    type: "yes_no"
  },
  {
    id: 3,
    question: "Bu okulda pek çok değerli işler başardım.",
    type: "yes_no"
  },
  {
    id: 4,
    question: "Bir erkek olarak engeller veya zorluklarla karşılaştınız mı?",
    type: "yes_no"
  },
  {
    id: 5,
    question: "Öğretmenlerin öğrencilere hitap, davranış ve cezalandırma biçimlerinde cinsiyete göre farklılıklar olduğunu hissediyor musun?",
    type: "yes_no"
  },
  {
    id: 6,
    question: "Sınıf içinde görev dağılımı yapılırken cinsiyet belirleyici bir rol oynar mı?",
    type: "yes_no"
  },
  {
    id: 7,
    question: "Okulda ya da sosyal çevrende, 'erkeksen bunu yapmalısın/yapmamalısın' gibi kalıplaşmış beklentiler hissediyor musun?",
    type: "yes_no"
  },
  {
    id: 8,
    question: "Başarıların konusunda 'erkek olduğun için' daha fazla ya da daha az takdir edildiğini hissettiğin oldu mu?",
    type: "yes_no"
  },
  {
    id: 9,
    question: "Hegemonik erkeklik anlayışı okul kültüründe dolaylı biçimde hissedilir.",
    type: "yes_no"
  },
  {
    id: 10,
    question: "Sence güçlü olmak her zaman hegemonik bir davranış mıdır?",
    type: "yes_no"
  },
  {
    id: 11,
    question: "'Erkek gibi davranmak' ifadesi kötü hissettiriyor mu?",
    type: "yes_no"
  },
  {
    id: 12,
    question: "Hegemonik erkeklik kalıpları, erkeklerin kariyer yaşamında da cam tavan oluşturur mu?",
    type: "yes_no"
  },
  {
    id: 13,
    question: "Erkekler, toplumun beklentileri nedeniyle duygularını bastırmak zorunda hisseder.",
    type: "yes_no"
  },
  {
    id: 14,
    question: "Hegemonik erkeklik anlayışı, erkeklerin kendi potansiyellerini de sınırlayabilir.",
    type: "yes_no"
  },
  {
    id: 15,
    question: "Sınıf ortamında cinsiyete dayalı şakalar, dışlamalar veya etiketlemeler oluyor mu?",
    type: "yes_no"
  },
  {
    id: 16,
    question: "Okulun sana 'erkeklik' hakkında mesajlar verdiğini düşünüyor musun? Bu mesajları kabul ediyor musun?",
    type: "yes_no"
  }
];

function AssessmentView({ user, onComplete }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [totalQuestions] = useState(ASSESSMENT_QUESTIONS.length);
  const [activeTextIndex, setActiveTextIndex] = useState(0);

  const currentQuestion = ASSESSMENT_QUESTIONS[step];
  const isLastStep = step === ASSESSMENT_QUESTIONS.length - 1;
  const answered = Object.keys(answers).length;
  const allAnswered = answered === totalQuestions;

  // Sol panel animasyonlu metinler
  const infoTexts = [
    { 
      title: "Sesini Duyur", 
      desc: "Düşüncelerini paylaş, araştırmamıza katkıda bulun.",
      icon: <ShieldCheck className="w-8 h-8 mb-4 opacity-80" />
    },
    { 
      title: "Gizlilik Güvencesi", 
      desc: "Tüm cevapların tamamen anonim ve güvenli şekilde saklanır.",
      icon: <ShieldCheck className="w-8 h-8 mb-4 opacity-80" />
    },
    { 
      title: "Değerli Katkı", 
      desc: "Her cevap, toplumsal cinsiyet araştırmamız için çok değerli.",
      icon: <CheckCircle className="w-8 h-8 mb-4 opacity-80" />
    }
  ];

  // Metin rotasyonu
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTextIndex((prev) => (prev + 1) % infoTexts.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [infoTexts.length]);

  const handleNext = () => {
    if (step < ASSESSMENT_QUESTIONS.length - 1) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const handleSubmit = () => {
    const totalScore = Object.values(answers).filter(answer => answer === 'yes').length;
    setScore(totalScore);
    setSubmitted(true);
  };

  const handleContinue = async () => {
    onComplete(answers);
  };

  const handleAnswer = (questionId, value) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  if (submitted) {
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

            <div className="h-80 flex flex-col justify-center">
              <div className="animate-bounce-slow ml-1">
                <CheckCircle className="w-16 h-16 mb-4 opacity-80" />
              </div>
              <h2 className="text-5xl font-extrabold leading-tight mb-6 tracking-tight">
                Tebrikler!
              </h2>
              <p className="text-indigo-100 dark:text-indigo-200 text-lg max-w-md leading-relaxed">
                Anketi başarıyla tamamladınız. Katkılarınız için teşekkür ederiz.
              </p>
            </div>
          </div>

          {/* Dekoratif Arkaplan */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-[100px] opacity-40 animate-pulse"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-[80px] opacity-40 animate-pulse delay-1000"></div>
          
          <div className="relative z-10 text-xs text-indigo-200 mt-4">
            © 2026 Destek Topluluğu.{" "}
            <span className="opacity-60">Sürüm {import.meta.env.VITE_VER}</span>
          </div>
        </div>

        {/* Sağ Panel: Sonuç */}
        <div className="flex-1 flex items-center justify-center p-6 lg:p-16">
          <div className="w-full max-w-md space-y-8 animate-slide-up-fade">
            
            {/* Mobil Logo */}
            <div className="md:hidden flex flex-col items-center mb-8">
              <div className="w-14 h-14 bg-green-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-green-200 dark:shadow-none">
                <CheckCircle className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Anket Tamamlandı</h1>
            </div>

            <div className="hidden md:block">
              <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-3 tracking-tight">Teşekkürler!</h1>
              <p className="text-gray-500 dark:text-gray-400 font-medium">
                Ankete katıldığınız ve projemize destek olduğunuz için teşekkür ederiz.
              </p>
            </div>

            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl p-8 border border-indigo-100 dark:border-indigo-800 shadow-xl">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 font-semibold text-center">
                Anket Puanınız
              </p>
              <p className="text-6xl font-black text-indigo-600 dark:text-indigo-400 text-center">
                {score}/{totalQuestions}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-3 text-center font-medium">
                ({Math.round((score / totalQuestions) * 100)}% "Evet" cevabı)
              </p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-2xl p-6">
              <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                Sizin geri bildiriminiz, erkeklik ve toplumsal cinsiyet kalıpları hakkında daha derinlemesine araştırma yapabilmemize yardımcı olacaktır.
              </p>
            </div>

            <button
              onClick={handleContinue}
              className="w-full bg-indigo-600 dark:bg-indigo-500 text-white py-4 rounded-2xl font-bold hover:bg-indigo-700 dark:hover:bg-indigo-600 transform transition-all active:scale-[0.98] shadow-xl shadow-indigo-200 dark:shadow-none flex items-center justify-center gap-2 group"
            >
              Uygulamaya Git
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    );
  }

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
          <span className="opacity-60">Sürüm {import.meta.env.VITE_VER}</span>
        </div>
      </div>

      {/* Sağ Panel: Anket Formu */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-16">
        <div className="w-full max-w-2xl space-y-8 animate-slide-up-fade">
          
          {/* Mobil Logo */}
          <div className="md:hidden flex flex-col items-center mb-8">
            <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-indigo-200 dark:shadow-none">
              <Hash className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Anket</h1>
          </div>

          <div className="hidden md:block">
            <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-3 tracking-tight">Anket</h1>
            <p className="text-gray-500 dark:text-gray-400 font-medium">
              Lütfen aşağıdaki soruları dikkatlice okuyarak cevaplayın.
            </p>
          </div>

          {/* Progress Bar */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                Soru {step + 1} / {ASSESSMENT_QUESTIONS.length}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {answered}/{totalQuestions} Cevaplandı
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2.5 rounded-full transition-all duration-500 ease-out shadow-lg shadow-indigo-200 dark:shadow-none"
                style={{ width: `${((step + 1) / ASSESSMENT_QUESTIONS.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Question Card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-8 transition-all duration-300">
            <div className="mb-8">
              <div className="inline-block bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-3 py-1 rounded-full text-xs font-bold mb-4">
                Soru {currentQuestion.id}
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white leading-relaxed">
                {currentQuestion.question}
              </h2>
            </div>

            <div className="space-y-3">
              {[
                { value: 'yes', label: 'Evet', color: 'indigo' },
                { value: 'no', label: 'Hayır', color: 'gray' }
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleAnswer(currentQuestion.id, option.value)}
                  className={`w-full px-6 py-5 rounded-2xl border-2 text-left transition-all transform hover:scale-[1.02] active:scale-[0.98] font-semibold ${
                    answers[currentQuestion.id] === option.value
                      ? 'border-indigo-600 dark:border-indigo-500 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 text-indigo-900 dark:text-indigo-100 shadow-lg shadow-indigo-100 dark:shadow-none'
                      : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{option.label}</span>
                    {answers[currentQuestion.id] === option.value && (
                      <CheckCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between gap-3">
            <button
              onClick={handleBack}
              disabled={step === 0}
              className="px-6 py-4 rounded-2xl font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all disabled:opacity-30 disabled:cursor-not-allowed border-2 border-gray-200 dark:border-gray-700 flex items-center gap-2 group"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              Geri
            </button>
           
            {!isLastStep ? (
              <button
                onClick={handleNext}
                disabled={!answers[currentQuestion.id]}
                className="px-6 py-4 rounded-2xl font-bold bg-indigo-600 dark:bg-indigo-500 text-white hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-indigo-200 dark:shadow-none transform active:scale-[0.98] flex items-center gap-2 group"
              >
                İleri
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!allAnswered}
                className="px-6 py-4 rounded-2xl font-bold bg-green-600 dark:bg-green-500 text-white hover:bg-green-700 dark:hover:bg-green-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-green-200 dark:shadow-none transform active:scale-[0.98] flex items-center gap-2"
              >
                Anketi Tamamla
                <CheckCircle className="w-5 h-5" />
              </button>
            )}
          </div>

          {!allAnswered && (
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center font-medium">
              Tüm soruları cevaplamadan anketi tamamlayamazsınız.
            </p>
          )}

          {/* Legal Notice */}
          <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl p-6 border border-red-100 dark:border-red-800">
            <p className="font-bold text-red-900 dark:text-red-300 mb-3 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5" />
              Yasal Uyarı
            </p>
            <p className="text-xs text-red-800 dark:text-red-300 leading-relaxed">
              Formda yer alan sorular anket formundadır. Sorular alanında uzman kişiler
              tarafından kontrol edilmiş, geçerliliği ve güvenilirliği doğrulanmıştır. Ankete katılan
              kullanıcıların herhangi kişisel bir bilgisi alınmayacak ve araştırmadan sonra kişisel
              bilgileri kullanılmayacaktır. Kullanıcıların sorulara evet-hayır şeklinde cevap vermesi
              gerekmektedir.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AssessmentView;