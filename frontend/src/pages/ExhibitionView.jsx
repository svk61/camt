import React, { useState, useEffect } from 'react';
import {
    ChevronLeft, ChevronRight, Users, Brain, Target, BarChart3,
    Lightbulb, Heart, Hash, Shield, MessageCircle, Headphones,
    Award, Sparkles, QrCode, CheckCircle2, TrendingUp, Image, Bird
} from 'lucide-react';

// Animated counter
function AnimatedNumber({ value, suffix = '' }) {
    const [count, setCount] = useState(0);

    useEffect(() => {
        setCount(0);
        const numValue = parseInt(value);
        const duration = 1500;
        const increment = numValue / (duration / 16);
        let current = 0;

        const timer = setInterval(() => {
            current += increment;
            if (current >= numValue) {
                setCount(numValue);
                clearInterval(timer);
            } else {
                setCount(Math.floor(current));
            }
        }, 16);

        return () => clearInterval(timer);
    }, [value]);

    return <span className="tabular-nums">{count}{suffix}</span>;
}

// Animated progress bar
function AnimatedBar({ value, label, delay = 0 }) {
    const [width, setWidth] = useState(0);

    useEffect(() => {
        setWidth(0);
        const timer = setTimeout(() => setWidth(value), 100 + delay);
        return () => clearTimeout(timer);
    }, [value, delay]);

    return (
        <div className="space-y-2">
            <div className="flex justify-between items-center">
                <span className="text-xs sm:text-sm font-semibold text-gray-700">{label}</span>
                <span className="text-xs sm:text-sm font-bold text-indigo-600">%{value}</span>
            </div>
            <div className="h-3 sm:h-4 bg-gray-100 rounded-full overflow-hidden">
                <div
                    className="h-full bg-indigo-600 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${width}%` }}
                />
            </div>
        </div>
    );
}

// Circular progress
function CircularProgress({ value, label, size = 100 }) {
    const [progress, setProgress] = useState(0);
    const radius = (size - 12) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (progress / 100) * circumference;

    useEffect(() => {
        setProgress(0);
        const timer = setTimeout(() => setProgress(value), 300);
        return () => clearTimeout(timer);
    }, [value]);

    return (
        <div className="flex flex-col items-center">
            <div className="relative" style={{ width: size, height: size }}>
                <svg className="transform -rotate-90" width={size} height={size}>
                    <circle cx={size / 2} cy={size / 2} r={radius} stroke="#e5e7eb" strokeWidth="6" fill="none" />
                    <circle cx={size / 2} cy={size / 2} r={radius} stroke="#6366f1" strokeWidth="6" fill="none" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} className="transition-all duration-1500 ease-out" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-lg sm:text-xl font-black text-gray-900">{progress}%</span>
                </div>
            </div>
            <span className="mt-2 text-xs sm:text-sm font-semibold text-gray-600 text-center">{label}</span>
        </div>
    );
}

// Image placeholder
function ImagePlaceholder({ label = "Görsel Alanı" }) {
    return (
        <div className="aspect-video bg-gray-100 rounded-xl sm:rounded-2xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center p-4">
            <Image className="w-8 h-8 sm:w-12 sm:h-12 text-gray-300 mb-2" />
            <span className="text-xs sm:text-sm text-gray-400 font-medium text-center">{label}</span>
        </div>
    );
}

// Typing animation for quotes
function TypedText({ text, className }) {
    const [displayed, setDisplayed] = useState('');

    useEffect(() => {
        setDisplayed('');
        let i = 0;
        const timer = setInterval(() => {
            if (i < text.length) {
                setDisplayed(text.slice(0, i + 1));
                i++;
            } else {
                clearInterval(timer);
            }
        }, 30);
        return () => clearInterval(timer);
    }, [text]);

    return <span className={className}>{displayed}<span className="animate-pulse">|</span></span>;
}

function ExhibitionView() {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isAutoPlaying, setIsAutoPlaying] = useState(true);
    const [isAnimating, setIsAnimating] = useState(false);

    const slides = [
        {
            id: 1,
            type: 'hero',
            title: "Cam Tavan Sendromu",
            subtitle: "Erkek Ergenlerde Görünmez Engeller",
            quote: "Bireyin kendisine dış baskılar sonucunda koyduğu görünmez bir engeli kırmaya hazır mısın?",
            icon: Brain,
            features: [
                { icon: Shield, title: "Güvenli", desc: "KVKK uyumlu" },
                { icon: MessageCircle, title: "Anonim", desc: "Gizlilik garantili" },
                { icon: Headphones, title: "7/24", desc: "Destek" }
            ]
        },
        {
            id: 2,
            type: 'penguin',
            title: "Cesur Penguen",
            subtitle: "Sürüden Ayrılma Cesareti",
            quote: "Sürünün gittiği güvenli rotayı reddedip tek başına dağlara yürüyen o cesur penguen gibi...",
            description: "Her grubun üyesine aynı özellik, tutum ve değerleri yükleyen, karakteristik özellikleri yok sayan kalıplaşmış yargıları bireye dayatan toplumsal hegemonya, o penguenle kanlı canlı önümüze düştü.",
            icon: Bird
        },
        {
            id: 3,
            type: 'problem',
            title: "Problem",
            subtitle: "Okul Ortamındaki Hegemonya",
            quote: "Erkeklik biyolojik değil, toplumsal bir inşadır.",
            description: "Hegemonyanın en sert yaşandığı yer, ergenin hayatının çoğunu kapsayan okuldur.",
            icon: Target,
            bulletPoints: [
                "Sürekli güçlü görünme baskısı",
                "Duygularını saklama zorunluluğu",
                "Cinsiyetçi kalıp yargılar",
                "Öğretmen stereotipleri"
            ]
        },
        {
            id: 4,
            type: 'solution',
            title: "Çözüm",
            subtitle: "Dijital Sığınak",
            quote: "Yüz yüze konuşmaktan çekindikleri konuları tartışabilecekleri anonim ve güvenli bir dijital alan.",
            icon: Users,
            features: [
                { icon: Shield, title: "100%", desc: "KVKK Uyumlu" },
                { icon: MessageCircle, title: "6", desc: "Sohbet Kanalı" },
                { icon: Headphones, title: "24/7", desc: "Aktif Destek" }
            ]
        },
        {
            id: 5,
            type: 'data',
            title: "Bulgular",
            subtitle: "138 Öğrenci ile Araştırma",
            quote: "Sayılar yalan söylemez. Erkek öğrenciler ciddi baskı altında.",
            icon: BarChart3,
            chartData: [
                { label: "Duygu Gizleme Baskısı", value: 70 },
                { label: "Güçlü Olma İhtiyacı", value: 61 },
                { label: "Sert Görünme Baskısı", value: 55 },
                { label: "Toleranssız Davranış", value: 48 }
            ]
        },
        {
            id: 6,
            type: 'stats',
            title: "Sonuçlar",
            subtitle: "Verilerle Kanıtlandı",
            quote: "Cam tavanın varlığını fark edip aşabilirler mi? Evet, aşabilirler!",
            icon: TrendingUp,
            circularStats: [
                { value: 70, label: "Duygu Gizleme" },
                { value: 85, label: "Farkındalık" },
                { value: 72, label: "Memnuniyet" }
            ]
        },
        {
            id: 7,
            type: 'unique',
            title: "Neden Özgünüz?",
            subtitle: "Literatürde Bir İlk",
            quote: "Cam tavan kavramı ilk kez erkek ergenler ve okul bağlamında ele alındı.",
            icon: Lightbulb,
            highlights: [
                { icon: Award, title: "İlk Araştırma", desc: "Erkek ergenler için cam tavan" },
                { icon: Sparkles, title: "Özgün Platform", desc: "Web tabanlı destek sistemi" }
            ]
        },
        {
            id: 8,
            type: 'impact',
            title: "Misyonumuz",
            subtitle: "Kendi Rotanı Çiz",
            quote: "Bu proje; dayatılan erkeklik kalıpları içinde sıkışan gençlere, o penguenin cesaretini kazandırmayı hedefler.",
            description: "Kendi duygusal dünyalarına doğru özgürce yürümelerini ve potansiyellerini ortaya koymalarını sağlıyoruz.",
            icon: Heart,
            results: [
                "Cam tavanı kabul ederek farkındalık",
                "Güvenli paylaşım ortamı",
                "Akran desteği ile güç"
            ]
        },
        {
            id: 9,
            type: 'qr',
            title: "Katıl!",
            subtitle: "Cam Tavanını Kır",
            quote: "Üzerindeki cam tavanı kırarak kendi rotanı çizmeye hazır mısın?",
            icon: QrCode
        }
    ];

    // Auto-play
    useEffect(() => {
        if (!isAutoPlaying) return;
        const interval = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % slides.length);
        }, 8000);
        return () => clearInterval(interval);
    }, [isAutoPlaying, slides.length]);

    // Animation trigger
    useEffect(() => {
        setIsAnimating(true);
        const timer = setTimeout(() => setIsAnimating(false), 50);
        return () => clearTimeout(timer);
    }, [currentSlide]);

    const goToSlide = (index) => {
        setCurrentSlide(index);
        setIsAutoPlaying(false);
        setTimeout(() => setIsAutoPlaying(true), 25000);
    };

    const nextSlide = () => {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
    };

    const prevSlide = () => {
        setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    };

    const slide = slides[currentSlide];
    const CurrentIcon = slide.icon;

    const renderContent = () => {
        switch (slide.type) {
            case 'hero':
                return (
                    <div className="space-y-6 sm:space-y-8">
                        <div className="grid grid-cols-3 gap-3 sm:gap-6">
                            {slide.features.map((item, i) => (
                                <div
                                    key={i}
                                    className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-6 border border-gray-200 shadow-sm hover:shadow-xl hover:scale-105 hover:border-indigo-300 transition-all duration-500 animate-fade-in-up"
                                    style={{ animationDelay: `${i * 150}ms` }}
                                >
                                    <div className="w-10 h-10 sm:w-14 sm:h-14 bg-indigo-100 rounded-xl sm:rounded-2xl flex items-center justify-center mb-2 sm:mb-4 mx-auto">
                                        <item.icon className="w-5 h-5 sm:w-7 sm:h-7 text-indigo-600" />
                                    </div>
                                    <h4 className="font-bold text-gray-900 text-sm sm:text-lg text-center">{item.title}</h4>
                                    <p className="text-gray-500 text-xs sm:text-sm text-center">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                        <ImagePlaceholder label="Proje Tanıtım Görseli" />
                    </div>
                );

            case 'penguin':
                return (
                    <div className="space-y-6 sm:space-y-8">
                        <div className="bg-white rounded-xl sm:rounded-2xl p-6 sm:p-10 border border-gray-200 shadow-lg text-center animate-fade-in">
                            <Bird className="w-16 h-16 sm:w-24 sm:h-24 text-indigo-600 mx-auto mb-4 sm:mb-6 animate-bounce-slow" />
                            <p className="text-base sm:text-xl text-gray-700 leading-relaxed font-medium italic">
                                "{slide.description}"
                            </p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                            <ImagePlaceholder label="Penguen Görseli" />
                            <ImagePlaceholder label="Metafor Görseli" />
                        </div>
                    </div>
                );

            case 'problem':
                return (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
                        <div className="bg-white rounded-xl sm:rounded-2xl p-5 sm:p-8 border border-gray-200 shadow-sm">
                            <ul className="space-y-3 sm:space-y-4">
                                {slide.bulletPoints.map((point, i) => (
                                    <li
                                        key={i}
                                        className="flex items-center gap-3 sm:gap-4 animate-fade-in-left"
                                        style={{ animationDelay: `${i * 200}ms` }}
                                    >
                                        <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
                                        <span className="font-medium text-gray-700 text-sm sm:text-base">{point}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <ImagePlaceholder label="Hegemonya Görseli" />
                    </div>
                );

            case 'solution':
                return (
                    <div className="space-y-6 sm:space-y-8">
                        <div className="grid grid-cols-3 gap-3 sm:gap-6">
                            {slide.features.map((item, i) => (
                                <div
                                    key={i}
                                    className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-6 border border-gray-200 shadow-sm text-center hover:shadow-xl hover:scale-105 transition-all duration-500 animate-scale-in"
                                    style={{ animationDelay: `${i * 150}ms` }}
                                >
                                    <div className="w-10 h-10 sm:w-14 sm:h-14 bg-indigo-100 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-2 sm:mb-4">
                                        <item.icon className="w-5 h-5 sm:w-7 sm:h-7 text-indigo-600" />
                                    </div>
                                    <div className="text-2xl sm:text-4xl font-black text-indigo-600 mb-1">
                                        {item.title}
                                    </div>
                                    <p className="text-xs sm:text-sm font-semibold text-gray-500">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                        <div className="grid grid-cols-2 gap-3 sm:gap-6">
                            <ImagePlaceholder label="Platform Görüntüsü 1" />
                            <ImagePlaceholder label="Platform Görüntüsü 2" />
                        </div>
                    </div>
                );

            case 'data':
                return (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
                        <div className="bg-white rounded-xl sm:rounded-2xl p-5 sm:p-8 border border-gray-200 shadow-sm">
                            <div className="space-y-4 sm:space-y-6">
                                {slide.chartData.map((item, i) => (
                                    <AnimatedBar key={i} value={item.value} label={item.label} delay={i * 200} />
                                ))}
                            </div>
                        </div>
                        <div className="space-y-4 sm:space-y-6">
                            <div className="bg-indigo-600 rounded-xl sm:rounded-2xl p-6 sm:p-8 text-white text-center animate-pulse-slow">
                                <div className="text-4xl sm:text-6xl font-black mb-2">
                                    <AnimatedNumber value="138" />
                                </div>
                                <p className="text-indigo-100 font-semibold text-sm sm:text-base">Katılımcı Öğrenci</p>
                            </div>
                            <ImagePlaceholder label="Araştırma Görseli" />
                        </div>
                    </div>
                );

            case 'stats':
                return (
                    <div className="space-y-6 sm:space-y-8">
                        <div className="flex justify-center gap-6 sm:gap-12 flex-wrap">
                            {slide.circularStats.map((stat, i) => (
                                <div key={i} className="animate-fade-in" style={{ animationDelay: `${i * 300}ms` }}>
                                    <CircularProgress value={stat.value} label={stat.label} size={window.innerWidth < 640 ? 80 : 110} />
                                </div>
                            ))}
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-6">
                            <ImagePlaceholder label="Grafik 1" />
                            <ImagePlaceholder label="Grafik 2" />
                            <ImagePlaceholder label="Grafik 3" className="col-span-2 sm:col-span-1" />
                        </div>
                    </div>
                );

            case 'unique':
                return (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
                        <div className="space-y-4 sm:space-y-6">
                            {slide.highlights.map((item, i) => (
                                <div
                                    key={i}
                                    className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-200 shadow-sm hover:shadow-xl hover:scale-102 transition-all duration-500 animate-slide-in-right"
                                    style={{ animationDelay: `${i * 200}ms` }}
                                >
                                    <div className="flex items-start gap-3 sm:gap-4">
                                        <div className="w-12 h-12 sm:w-14 sm:h-14 bg-amber-100 rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0">
                                            <item.icon className="w-6 h-6 sm:w-7 sm:h-7 text-amber-600" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-900 text-base sm:text-lg">{item.title}</h4>
                                            <p className="text-gray-500 text-sm mt-1">{item.desc}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <ImagePlaceholder label="Özgünlük Görseli" />
                    </div>
                );

            case 'impact':
                return (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
                        <div className="bg-white rounded-xl sm:rounded-2xl p-5 sm:p-8 border border-gray-200 shadow-sm">
                            <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 italic">"{slide.description}"</p>
                            <ul className="space-y-3 sm:space-y-4">
                                {slide.results.map((result, i) => (
                                    <li
                                        key={i}
                                        className="flex items-start gap-3 sm:gap-4 animate-fade-in-left"
                                        style={{ animationDelay: `${i * 200}ms` }}
                                    >
                                        <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-green-500 flex-shrink-0 mt-0.5" />
                                        <span className="font-medium text-gray-700 text-sm sm:text-base">{result}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <ImagePlaceholder label="Etki Görseli" />
                    </div>
                );

            case 'qr':
                return (
                    <div className="flex flex-col items-center gap-6 sm:gap-8">
                        <div className="bg-white rounded-xl sm:rounded-2xl p-6 sm:p-10 border border-gray-200 shadow-xl animate-scale-in">
                            <div className="w-40 h-40 sm:w-56 sm:h-56 bg-gray-50 rounded-xl flex items-center justify-center border-2 border-dashed border-gray-300">
                                <div className="text-center">
                                    <QrCode className="w-14 h-14 sm:w-20 sm:h-20 text-gray-300 mx-auto mb-2" />
                                    <p className="text-xs sm:text-sm text-gray-400">QR Kod</p>
                                </div>
                            </div>
                        </div>
                        <div className="text-center animate-fade-in" style={{ animationDelay: '300ms' }}>
                            <p className="text-2xl sm:text-4xl font-black text-indigo-600 mb-2">camtavan.app</p>
                            <p className="text-gray-500 text-sm sm:text-lg">Şimdi tara, hemen başla!</p>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header - Purple */}
            <header className="bg-indigo-600 text-white p-3 sm:p-4 sticky top-0 z-50 shadow-lg">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-9 h-9 sm:w-11 sm:h-11 bg-white/20 rounded-xl flex items-center justify-center">
                            <Hash className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-base sm:text-lg font-bold tracking-tight">CamTavanApp</h1>
                            <p className="text-[10px] sm:text-xs text-indigo-200">TÜBİTAK 2204-A</p>
                        </div>
                    </div>

                    {/* Progress dots - hidden on mobile */}
                    <div className="hidden md:flex items-center gap-1.5">
                        {slides.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => goToSlide(i)}
                                className={`h-1.5 rounded-full transition-all duration-300 hover:scale-125 ${i === currentSlide ? 'w-6 bg-white' : i < currentSlide ? 'w-1.5 bg-indigo-300' : 'w-1.5 bg-indigo-400 hover:bg-indigo-300'
                                    }`}
                            />
                        ))}
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3">
                        <div className={`w-2 h-2 rounded-full ${isAutoPlaying ? 'bg-green-400 animate-pulse' : 'bg-white/50'}`} />
                        <span className="text-xs sm:text-sm font-bold text-indigo-200">{currentSlide + 1}/{slides.length}</span>
                    </div>
                </div>
            </header>

            {/* Main content */}
            <main className="flex-1 p-4 sm:p-6 lg:p-10 overflow-auto">
                <div className={`max-w-5xl mx-auto transition-all duration-700 ${isAnimating ? 'opacity-0 translate-y-8 scale-95' : 'opacity-100 translate-y-0 scale-100'}`}>
                    {/* Slide header */}
                    <div className="text-center mb-6 sm:mb-10">
                        <div className="inline-flex w-12 h-12 sm:w-16 sm:h-16 bg-indigo-100 rounded-xl sm:rounded-2xl items-center justify-center mb-4 sm:mb-6 animate-bounce-slow">
                            <CurrentIcon className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-600" />
                        </div>
                        <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-gray-900 tracking-tight mb-2 sm:mb-3 animate-fade-in">
                            {slide.title}
                        </h2>
                        <p className="text-lg sm:text-xl lg:text-2xl font-semibold text-indigo-600 mb-3 sm:mb-4 animate-fade-in" style={{ animationDelay: '100ms' }}>
                            {slide.subtitle}
                        </p>
                        {/* Quote with typing animation */}
                        <div className="bg-indigo-50 rounded-xl sm:rounded-2xl p-4 sm:p-6 max-w-3xl mx-auto animate-fade-in" style={{ animationDelay: '200ms' }}>
                            <p className="text-sm sm:text-lg text-indigo-700 font-medium italic">
                                "{slide.quote}"
                            </p>
                        </div>
                    </div>

                    {/* Dynamic content */}
                    {renderContent()}
                </div>
            </main>

            {/* Footer navigation */}
            <footer className="bg-white border-t border-gray-100 p-3 sm:p-4">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <button
                            onClick={prevSlide}
                            className="p-2 sm:p-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 hover:border-indigo-300 hover:scale-105 transition-all"
                        >
                            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                        </button>
                        <button
                            onClick={nextSlide}
                            className="px-4 sm:px-6 py-2 sm:py-3 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 hover:scale-105 transition-all shadow-lg shadow-indigo-200 flex items-center gap-1 sm:gap-2 font-bold text-sm sm:text-base"
                        >
                            Sonraki
                            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                    </div>

                    {/* Mobile dots */}
                    <div className="flex items-center gap-1 sm:gap-1.5 md:hidden">
                        {slides.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => goToSlide(i)}
                                className={`h-1.5 rounded-full transition-all ${i === currentSlide ? 'w-4 bg-indigo-600' : 'w-1.5 bg-gray-300'
                                    }`}
                            />
                        ))}
                    </div>

                    <p className="hidden sm:block text-xs sm:text-sm font-medium text-gray-400">
                        Melike & Sevkan
                    </p>
                </div>
            </footer>

            {/* CSS Animations */}
            <style>{`
        @keyframes fade-in-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fade-in-left { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scale-in { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
        @keyframes slide-in-right { from { opacity: 0; transform: translateX(30px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes bounce-slow { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        @keyframes pulse-slow { 0%, 100% { opacity: 1; } 50% { opacity: 0.8; } }
        .animate-fade-in-up { animation: fade-in-up 0.6s ease-out forwards; }
        .animate-fade-in-left { animation: fade-in-left 0.5s ease-out forwards; }
        .animate-fade-in { animation: fade-in 0.5s ease-out forwards; }
        .animate-scale-in { animation: scale-in 0.5s ease-out forwards; }
        .animate-slide-in-right { animation: slide-in-right 0.5s ease-out forwards; }
        .animate-bounce-slow { animation: bounce-slow 2s ease-in-out infinite; }
        .animate-pulse-slow { animation: pulse-slow 2s ease-in-out infinite; }
        .duration-1500 { transition-duration: 1500ms; }
        .hover\\:scale-102:hover { transform: scale(1.02); }
      `}</style>
        </div>
    );
}

export default ExhibitionView;
