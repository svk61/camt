import React, { useState, useEffect } from 'react';
import { CheckCircle } from 'lucide-react';

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
    question: "Öğretmenler sınıfta öğrencilere hitap, davranış ve cezalandırma şekillerinde cinsiyete göre farklılıklar gösterdiğini hissediyor musun?",
    type: "yes_no"
  },
  {
    id: 6,
    question: "Sınıf içinde herhangi bir görev dağılımı yapıldığında bu dağılım esnasında cinsiyet belirleyici bir nitelik gösterir mi?",
    type: "yes_no"
  },
  {
    id: 7,
    question: "Okulda ya da sosyal çevrende, 'erkeksen bunu yapmalısın / yapmamalısın' gibi kalıplaşmış beklentiler hissediyor musun?",
    type: "yes_no"
  },
  {
    id: 8,
    question: "Başarılarınla ilgili olarak 'erkek olduğun için' daha fazla ya da daha az takdir edildiğini hissettiğin oldu mu?",
    type: "yes_no"
  },
  {
    id: 9,
    question: "Hegemonik (Bir şeyin veya birinin diğerleri üzerinde baskın ve yönlendirici olması.) erkeklik anlayışı okulun kültüründe dolaylı biçimde hissedilir.",
    type: "yes_no"
  },
  {
    id: 10,
    question: "Sence güçlü olmak her zaman hegemonik (Bir şeyin veya birinin diğerleri üzerinde baskın ve yönlendirici olması.) bir davranış mıdır?",
    type: "yes_no"
  },
  {
    id: 11,
    question: "'Erkek gibi davranmak' ifadesi sana ne hissettiriyor?",
    type: "yes_no"
  },
  {
    id: 12,
    question: "Sence bu hegemonik (Bir şeyin veya birinin diğerleri üzerinde baskın ve yönlendirici olması.) kalıplar, erkeklerin kariyer yaşamında da cam tavan oluşturur mu?",
    type: "yes_no"
  },
  {
    id: 13,
    question: "Erkekler duygularını bastırmak zorunda hisseder çünkü toplum böyle bekler.",
    type: "yes_no"
  },
  {
    id: 14,
    question: "Hegemonik (Bir şeyin veya birinin diğerleri üzerinde baskın ve yönlendirici olması.) erkeklik anlayışı, erkeklerin de kendi potansiyellerini sınırlayabilir.",
    type: "yes_no"
  },
  {
    id: 15,
    question: "Sınıf ortamında cinsiyete dayalı şakalar, dışlamalar veya etiketlemeler oluyor mu?",
    type: "yes_no"
  },
  {
    id: 16,
    question: "Okulun sana 'erkeklik' hakkında hangi mesajları verdiğini düşünüyorsun? Bu mesajlardan hangilerini kabul ediyor, hangilerini reddediyorsun?",
    type: "yes_no"
  }
];

function AssessmentView({ user, onComplete }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [totalQuestions] = useState(ASSESSMENT_QUESTIONS.length);

  const currentQuestion = ASSESSMENT_QUESTIONS[step];
  const isLastStep = step === ASSESSMENT_QUESTIONS.length - 1;
  const answered = Object.keys(answers).length;
  const allAnswered = answered === totalQuestions;

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
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 text-center">
          <div className="mb-6">
            <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-3">Teşekkürler!</h1>
            <p className="text-gray-600 mb-4">
              Ankete katıldığınız ve projemize destek olduğunuz için teşekkür ederiz.
            </p>
          </div>

          <div className="bg-indigo-50 rounded-lg p-6 mb-6">
            <p className="text-sm text-gray-600 mb-2">Anket Puanınız:</p>
            <p className="text-4xl font-bold text-indigo-600">{score}/{totalQuestions}</p>
            <p className="text-sm text-gray-600 mt-2">
              ({Math.round((score / totalQuestions) * 100)}%)
            </p>
          </div>

          <p className="text-gray-600 text-sm mb-6">
            Sizin geri bildiriminiz, erkeklik ve toplumsal cinsiyet kalıpları hakkında daha derinlemesine araştırma yapabilmemize yardımcı olacaktır.
          </p>

          <button
            onClick={handleContinue}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition"
          >
            Uygulamaya Git
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Anket</h1>
            <span className="text-sm text-gray-600">
              Soru {step + 1} / {ASSESSMENT_QUESTIONS.length}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((step + 1) / ASSESSMENT_QUESTIONS.length) * 100}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Cevaplanan: {answered}/{totalQuestions}
          </p>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            {currentQuestion.id}: {currentQuestion.question}
              </h2>

          <div className="space-y-3">
            {[
              { value: 'yes', label: 'Evet' },
              { value: 'no', label: 'Hayır' }
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => handleAnswer(currentQuestion.id, option.value)}
                className={`w-full px-6 py-4 rounded-lg border-2 text-left transition ${
                  answers[currentQuestion.id] === option.value
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-900'
                    : 'border-gray-200 hover:border-indigo-300 text-gray-700'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-between gap-3">
          <button
            onClick={handleBack}
            disabled={step === 0}
            className="px-6 py-3 rounded-lg font-semibold text-gray-700 hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Geri
          </button>
         
          {!isLastStep ? (
            <button
              onClick={handleNext}
              disabled={!answers[currentQuestion.id]}
              className="px-6 py-3 rounded-lg font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              İleri
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!allAnswered}
              className="px-6 py-3 rounded-lg font-semibold bg-green-600 text-white hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Anketi Tamamla
            </button>
          )}
        </div>

        <p className="text-xs text-gray-500 text-center mt-6">
          Tüm soruları cevaplamadan anketi tamamlayamazsınız.
        </p>
          <div className="mt-8 p-4 bg-red-50 rounded-lg text-xs text-red-600 border border-red-200">
            <p className="font-semibold mb-2">Yasal Uyarı</p>
            <p>Formda yer alan sorular anket formundadır. Sorular alanında uzman kişiler
tarafından kontrol edilmiş, geçerliliği ve güvenilirliği doğrulanmıştır. Ankete katılan
öğrencilerin herhangi kişisel bir bilgisi alınmayacak ve araştırmadan sonra kişisel
bilgileri kullanılmayacaktır. Öğrenciler uygulamaya tamamen gönüllülük esaslı ve
veli onayıyla katılacaktır. Öğrencilerin sorulara evet-hayır şeklinde cevap vermesi
gerekmektedir.</p>
          </div>
      </div>
      
    </div>
    
  );
}

export default AssessmentView;