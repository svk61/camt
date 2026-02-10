import React, { useState, useEffect, useRef } from 'react';
import {
    ChevronLeft, ChevronRight, Users, Brain, Target, BarChart3,
    Shield, MessageCircle, Quote, ArrowRight, Play, Pause, Activity, Lock,
    Bird, Sparkles, TrendingUp, QrCode, Image
} from 'lucide-react';

// --- Sub-components for Animations & UI ---

// Animated Counter
function AnimatedNumber({ value, suffix = '', duration = 1500 }) {
    const [count, setCount] = useState(0);
    const [isVisible, setIsVisible] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) setIsVisible(true);
        });
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if (!isVisible) return;

        const start = 0;
        const end = parseFloat(value);
        if (start === end) return;

        let startTime = null;

        const animate = (currentTime) => {
            if (!startTime) startTime = currentTime;
            const progress = Math.min((currentTime - startTime) / duration, 1);

            // Ease out quart
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);

            setCount(start + (end - start) * easeOutQuart);

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }, [value, isVisible, duration]);

    return <span ref={ref} className="tabular-nums tracking-tight">{count.toFixed(value % 1 !== 0 ? 2 : 0)}{suffix}</span>;
}

// Animated Progress Bar
function AnimatedBar({ value, label, delay = 0, color = "bg-indigo-600" }) {
    const [width, setWidth] = useState(0);
    const [isVisible, setIsVisible] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                setIsVisible(true);
            }
        });
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if (isVisible) {
            const timer = setTimeout(() => setWidth(value), 100 + delay);
            return () => clearTimeout(timer);
        }
    }, [value, delay, isVisible]);

    return (
        <div ref={ref} className="space-y-2 group w-full">
            <div className="flex justify-between items-end">
                <span className="text-sm font-semibold text-gray-700 group-hover:text-indigo-700 transition-colors">{label}</span>
                <span className="text-xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">%{value}</span>
            </div>
            <div className="h-4 bg-gray-100 rounded-full overflow-hidden shadow-inner relative">
                <div
                    className={`h-full ${color} rounded-full transition-all duration-1500 ease-out relative`}
                    style={{ width: `${width}%` }}
                >
                    <div className="absolute inset-0 bg-white/30 animate-[shimmer_2s_infinite] skew-x-12"></div>
                </div>
            </div>
        </div>
    );
}

// Typing Text Effect
function TypedText({ text, speed = 30, className }) {
    const [displayed, setDisplayed] = useState('');
    const [isVisible, setIsVisible] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) setIsVisible(true);
        });
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if (!isVisible) return;
        setDisplayed('');
        let i = 0;
        const timer = setInterval(() => {
            if (i < text.length) {
                setDisplayed(text.slice(0, i + 1));
                i++;
            } else {
                clearInterval(timer);
            }
        }, speed);
        return () => clearInterval(timer);
    }, [text, isVisible, speed]);

    return <span ref={ref} className={className}>{displayed}</span>;
}

// Main Component
function ExhibitionView() {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isAutoPlaying, setIsAutoPlaying] = useState(true);

    // Content Data tailored to the presentation script
    const slides = [
        {
            id: 'intro',
            theme: 'dark',
            title: "Okul Ortamındaki Hegemonyanın Erkek Ergenlerde Cam Tavan Sendromuna Etkisi",
            subtitle: "Melike Van Welsen & Mehmet Sevkan Baş",
            content: (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-8 animate-fade-in relative z-10 p-4">
                    <div className="w-32 h-32 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center mb-4 animate-bounce-slow border border-white/20 shadow-[0_0_50px_rgba(255,255,255,0.2)]">
                        <Brain className="w-16 h-16 text-indigo-300" />
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black text-white leading-tight max-w-5xl tracking-tight drop-shadow-2xl">
                        Cam Tavan Sadece <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-purple-300">Kadınlar İçin Mi?</span>
                    </h1>
                    <p className="text-xl md:text-2xl text-indigo-200 max-w-3xl font-light leading-relaxed">
                        Erkeklerin potansiyellerini sınırlayan <span className="font-semibold text-white">görünmez engelleri</span> keşfetmeye hazır mısınız?
                    </p>
                    <div className="mt-12 animate-pulse">
                        <ArrowRight className="w-10 h-10 text-white opacity-80" />
                    </div>
                </div>
            )
        },
        {
            id: 'origin',
            theme: 'light',
            title: "Çıkış Noktası",
            subtitle: "Bir Gözlem, Bir Sohbet, Bir Keşif",
            content: (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center h-full max-w-6xl mx-auto">
                    <div className="space-y-8 animate-slide-in-left">
                        <div className="bg-white p-8 rounded-3xl border border-indigo-100 shadow-xl hover:shadow-2xl transition-all hover:scale-105 duration-500 relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-2 h-full bg-indigo-500 group-hover:bg-indigo-600 transition-colors"></div>
                            <h3 className="text-2xl font-bold text-indigo-900 mb-3 flex items-center gap-3">
                                <Users className="w-6 h-6 text-indigo-500" /> Gözlem
                            </h3>
                            <p className="text-gray-600 text-lg italic leading-relaxed">"Sevkan okul dışında çok başarılıydı ama okulda bu yönünü göremiyordum. Sanki görünmez bir duvar vardı..."</p>
                        </div>

                        <div className="bg-white p-8 rounded-3xl border border-purple-100 shadow-xl hover:shadow-2xl transition-all hover:scale-105 duration-500 translate-x-4 relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-2 h-full bg-purple-500 group-hover:bg-purple-600 transition-colors"></div>
                            <h3 className="text-2xl font-bold text-purple-900 mb-3 flex items-center gap-3">
                                <MessageCircle className="w-6 h-6 text-purple-500" /> Diyalog
                            </h3>
                            <p className="text-gray-600 text-lg italic leading-relaxed">"Psikoloji ilgim sayesinde 'Cam Tavan' kavramını biliyordum. Bir sohbette Sevkan'a bundan bahsettim ve taşlar yerine oturdu."</p>
                        </div>
                    </div>
                    <div className="relative flex items-center justify-center animate-scale-in">
                        <div className="absolute inset-0 bg-gradient-to-tr from-indigo-200 to-purple-200 rounded-full blur-[100px] opacity-60 animate-pulse-slow"></div>
                        <div className="relative bg-white/80 backdrop-blur-sm p-6 rounded-3xl shadow-2xl border border-white">
                            <Brain className="w-48 h-48 text-indigo-900 opacity-80" />
                            <div className="absolute -bottom-6 -right-6 bg-white p-4 rounded-2xl shadow-lg flex items-center gap-3">
                                <Sparkles className="w-8 h-8 text-amber-500" />
                                <span className="font-bold text-gray-800">Farkındalık</span>
                            </div>
                        </div>
                    </div>
                </div>
            )
        },
        {
            id: 'theory',
            theme: 'light',
            title: "Teori ve Kavramlar",
            subtitle: "Hegemonya & Cam Tavan",
            content: (
                <div className="flex flex-col h-full justify-center max-w-5xl mx-auto gap-8">
                    <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-10 shadow-2xl text-center relative overflow-hidden transform hover:scale-[1.02] transition-transform duration-500">
                        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                        <Quote className="w-16 h-16 text-white/20 absolute top-6 left-6" />
                        <p className="text-2xl md:text-4xl font-serif text-white leading-relaxed mb-6 font-medium relative z-10">
                            "Erkeklik biyolojik değil, <br />
                            <span className="text-yellow-300 font-bold bg-white/10 px-4 py-1 rounded-lg inline-block mt-2">toplumsal bir inşadır</span>."
                        </p>
                        <p className="text-indigo-200 font-bold text-xl tracking-wider">- R.W. Connell</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-lg hover:shadow-2xl transition-all duration-300 group">
                            <h4 className="flex items-center gap-4 text-2xl font-bold text-gray-900 mb-4 group-hover:text-red-600 transition-colors">
                                <div className="p-3 bg-red-100 rounded-xl group-hover:bg-red-200 transition-colors">
                                    <Shield className="w-8 h-8 text-red-600" />
                                </div>
                                Hegemonya
                            </h4>
                            <p className="text-gray-600 text-lg leading-relaxed">Bir kişinin veya grubun diğerine kurduğu tartışılmaz üstünlük ve baskı.</p>
                        </div>
                        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-lg hover:shadow-2xl transition-all duration-300 group">
                            <h4 className="flex items-center gap-4 text-2xl font-bold text-gray-900 mb-4 group-hover:text-blue-600 transition-colors">
                                <div className="p-3 bg-blue-100 rounded-xl group-hover:bg-blue-200 transition-colors">
                                    <Lock className="w-8 h-8 text-blue-600" />
                                </div>
                                Cam Tavan
                            </h4>
                            <p className="text-gray-600 text-lg leading-relaxed">Bireyin yükselmesini ve potansiyelini gerçekleştirmesini engelleyen görünmez bariyerler.</p>
                        </div>
                    </div>
                </div>
            )
        },
        {
            id: 'hypothesis',
            theme: 'dark',
            title: "Hipotezimiz",
            subtitle: "Teknoloji, bu engeli aşabilir mi?",
            content: (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-12 relative z-10 max-w-5xl mx-auto">
                    <div className="relative">
                        <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl blur opacity-30 animate-pulse"></div>
                        <p className="text-2xl md:text-5xl text-white font-light leading-snug relative z-10 p-4">
                            "Erkek öğrencilere, <span className="font-bold text-yellow-300 border-b-4 border-yellow-300/50">anonim ve güvenli</span> bir dijital alan sunarsak, cam tavanın varlığını fark edip aşabilirler mi?"
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-8">
                        {[
                            { icon: MessageCircle, text: "İfade Özgürlüğü", desc: "Yargılanmadan konuş." },
                            { icon: Shield, text: "Güvenli Alan", desc: "Anonim ve korunaklı." },
                            { icon: Activity, text: "Farkındalık", desc: "Sorunu tanı ve çöz." }
                        ].map((item, i) => (
                            <div key={i} className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 hover:bg-white/10 transition-colors animate-fade-in-up flex flex-col items-center gap-4" style={{ animationDelay: `${i * 200}ms` }}>
                                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg">
                                    <item.icon className="w-8 h-8 text-white" />
                                </div>
                                <div>
                                    <h4 className="text-xl font-bold text-white mb-1">{item.text}</h4>
                                    <p className="text-indigo-200 text-sm">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )
        },
        {
            id: 'method',
            theme: 'light',
            title: "Yöntem",
            subtitle: "Karma Yöntem Araştırması",
            content: (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-full items-center max-w-6xl mx-auto">
                    <div className="md:col-span-1 h-full flex flex-col justify-center">
                        <div className="bg-gradient-to-br from-indigo-600 to-blue-700 text-white p-10 rounded-[2.5rem] shadow-2xl transform hover:scale-[1.02] transition-transform duration-500 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-[60px] -translate-y-1/2 translate-x-1/2"></div>
                            <h3 className="text-3xl font-bold mb-8 flex items-center gap-3">
                                <BarChart3 className="w-8 h-8" /> Nicel Bölüm
                            </h3>
                            <div className="space-y-6">
                                <div>
                                    <div className="text-6xl font-black mb-2 tracking-tighter">
                                        <AnimatedNumber value={138} />
                                    </div>
                                    <p className="text-indigo-200 uppercase tracking-widest text-sm font-bold">Katılımcı Öğrenci</p>
                                </div>
                                <div className="h-px bg-white/20 w-full"></div>
                                <p className="text-lg text-indigo-100 font-light leading-relaxed">
                                    Kullanıcıların anonim kalabileceği, <span className="font-semibold text-white">KVKK uyumlu</span> güvenli web sitesi altyapısı.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="md:col-span-1 space-y-6">
                        <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-100 transform hover:scale-[1.02] transition-transform duration-500 h-full flex flex-col justify-center">
                            <h3 className="text-3xl font-bold mb-6 flex items-center gap-3 text-indigo-900">
                                <MessageCircle className="w-8 h-8 text-indigo-600" /> Nitel Bölüm
                            </h3>
                            <ul className="space-y-4">
                                <li className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
                                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse mx-2"></div>
                                    <span className="text-gray-700 font-medium text-lg">Yarı yapılandırılmış görüşmeler</span>
                                </li>
                                <li className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
                                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse mx-2"></div>
                                    <span className="text-gray-700 font-medium text-lg">Sesli deneyim paylaşımı</span>
                                </li>
                                <li className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
                                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse mx-2"></div>
                                    <span className="text-gray-700 font-medium text-lg">Metin tabanlı etkileşim</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            )
        },
        {
            id: 'findings-quant',
            theme: 'light',
            title: "Bulgular (Nicel)",
            subtitle: "Sayılar Yalan Söylemez",
            content: (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 h-full items-center max-w-6xl mx-auto">
                    <div className="space-y-10 w-full">
                        <AnimatedBar value={70} label="Duygularını Gizleme Baskısı" color="bg-red-500" delay={0} />
                        <AnimatedBar value={61} label="Güçlü Olma İhtiyacı" color="bg-orange-500" delay={200} />
                        <AnimatedBar value={55} label="Sert Görünme Baskısı" color="bg-amber-500" delay={400} />
                        <AnimatedBar value={48} label="Toleranssız Davranış Algısı" color="bg-indigo-500" delay={600} />
                    </div>

                    <div className="bg-gray-900 text-white p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col justify-center min-h-[400px]">
                        <div className="absolute top-[-50px] right-[-50px] w-64 h-64 bg-indigo-600 rounded-full blur-[80px] opacity-40"></div>
                        <div className="absolute bottom-[-50px] left-[-50px] w-64 h-64 bg-purple-600 rounded-full blur-[80px] opacity-40"></div>

                        <Quote className="w-12 h-12 text-indigo-400 mb-6" />
                        <p className="text-2xl leading-relaxed font-light mb-8">
                            "Bu oranlar gösteriyor ki, erkek öğrenciler okul ortamında ciddi bir <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-400 font-bold">duygusal baskı</span> altında."
                        </p>

                        <div className="grid grid-cols-2 gap-8 pt-8 border-t border-gray-800">
                            <div>
                                <span className="block text-5xl font-black text-indigo-400 tracking-tighter">0.70</span>
                                <span className="text-sm font-medium text-gray-400 uppercase tracking-widest mt-1">GİZLEME</span>
                            </div>
                            <div>
                                <span className="block text-5xl font-black text-orange-400 tracking-tighter">0.61</span>
                                <span className="text-sm font-medium text-gray-400 uppercase tracking-widest mt-1">GÜÇ</span>
                            </div>
                        </div>
                    </div>
                </div>
            )
        },
        {
            id: 'findings-qual',
            theme: 'light',
            title: "Bulgular (Nitel)",
            subtitle: "Öğrenci Sesleri",
            content: (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 h-full content-center max-w-7xl mx-auto">
                    {[
                        { text: "Sürekli güçlü görünme ve duygularımı saklama baskısı hissediyorum.", color: "bg-blue-50/50", border: "border-blue-200" },
                        { text: "Öğretmenler kızlara ve erkeklere bariz farklı davranıyor.", color: "bg-purple-50/50", border: "border-purple-200" },
                        { text: "Cinsiyetçi şakalar artık kanıksandı, rahatsız etse de gülüyoruz.", color: "bg-pink-50/50", border: "border-pink-200" },
                        { text: "Erkek olduğum için sert ve duygusuz olmam bekleniyor.", color: "bg-green-50/50", border: "border-green-200" },
                        { text: "Bize daha sert ve toleranssız davranılıyor.", color: "bg-amber-50/50", border: "border-amber-200" },
                        { text: "Hem arkadaş ortamı hem öğretmenler bu hegemonyayı besliyor.", color: "bg-indigo-50/50", border: "border-indigo-200" }
                    ].map((item, i) => (
                        <div key={i} className={`p-8 rounded-3xl border ${item.border} ${item.color} shadow-sm hover:shadow-xl transition-all hover:scale-105 duration-300 flex flex-col justify-center`}>
                            <Quote className="w-8 h-8 text-black/10 mb-4" />
                            <p className="text-gray-800 font-medium text-lg leading-relaxed">"{item.text}"</p>
                            <div className="w-8 h-1 bg-black/5 mt-6 rounded-full"></div>
                        </div>
                    ))}
                </div>
            )
        },
        {
            id: 'penguin',
            theme: 'dark',
            title: "Cesur Penguen Metaforu",
            subtitle: "Sürüden Ayrılabilmek",
            content: (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-10 relative z-10 max-w-4xl mx-auto">
                    <div className="w-48 h-48 bg-gray-100 rounded-full flex items-center justify-center animate-bounce-slow shadow-[0_0_80px_rgba(255,255,255,0.2)] border-4 border-white">
                        <Bird className="w-24 h-24 text-gray-900" />
                    </div>

                    {/* Video Section */}
                    <div className="w-full max-w-3xl">
                        <div className="aspect-video bg-white/10 rounded-3xl overflow-hidden shadow-2xl border border-white/20 backdrop-blur-sm">
                            <video
                                className="w-full h-full object-cover"
                                controls
                                poster="/api/placeholder/800/450"
                            >
                                <source src="/media/video.mp4" type="video/mp4" />
                                Video yüklenemedi.
                            </video>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <p className="text-3xl md:text-5xl text-white font-serif italic leading-snug">
                            "Sürünün gittiği güvenli rotayı reddedip tek başına dağlara yürüyen o <span className="text-yellow-300">cesur penguen</span>..."
                        </p>
                        <p className="text-indigo-200 text-xl font-light max-w-2xl mx-auto">
                            Toplumsal hegemonyanın dayattığı kalıpları reddedip, kendi rotasını çizen özgür birey.
                        </p>
                    </div>

                    <div className="flex gap-4 pt-8">
                        {['Cesaret', 'Özgünlük', 'Özgürlük'].map((tag, i) => (
                            <span key={i} className="px-6 py-3 rounded-full bg-white/10 border border-white/20 text-white font-bold tracking-wide backdrop-blur-sm hover:bg-white/20 transition-colors cursor-default">
                                {tag}
                            </span>
                        ))}
                    </div>
                </div>
            )
        },
        {
            id: 'solution',
            theme: 'light',
            title: "Çözüm: Platformumuz",
            subtitle: "Dijital Bir Sığınak ve Rehber",
            content: (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 h-full items-center max-w-7xl mx-auto">
                    {/* Feature Cards */}
                    <div className="col-span-1 md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {[
                            { icon: Target, title: "Anonimlik", desc: "Kimlik baskısı olmadan kendini ifade etme imkanı." },
                            { icon: Users, title: "Akran Desteği", desc: "Yalnız olmadığını hissettiren paylaşım odaları." },
                            { icon: Shield, title: "Güvenlik", desc: "KVKK uyumlu, kötüye kullanımı engelleyen altyapı." },
                            { icon: TrendingUp, title: "Farkındalık", desc: "Cam tavanı kırmak için ilk adım: Adını koymak." }
                        ].map((feature, i) => (
                            <div key={i} className="bg-white p-8 rounded-3xl shadow-lg border border-indigo-50 hover:border-indigo-200 transition-all hover:-translate-y-2 group">
                                <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-indigo-600 transition-colors duration-300">
                                    <feature.icon className="w-7 h-7 text-indigo-600 group-hover:text-white transition-colors duration-300" />
                                </div>
                                <h4 className="font-bold text-gray-900 text-xl mb-2">{feature.title}</h4>
                                <p className="text-gray-500 text-sm leading-relaxed">{feature.desc}</p>
                            </div>
                        ))}
                    </div>

                    {/* Phone/App Mockup */}
                    <div className="hidden lg:flex bg-gray-900 rounded-[3rem] p-4 shadow-2xl rotate-3 hover:rotate-0 transition-all duration-700 border-8 border-gray-800 h-[600px] items-center justify-center relative overflow-hidden group">
                        {/* Notch */}
                        <div className="absolute top-0 w-40 h-8 bg-black rounded-b-2xl z-20"></div>

                        {/* Screen Content */}
                        <div className="w-full h-full bg-gray-50 rounded-[2rem] overflow-hidden relative">
                            {/* Platform Screenshot - Fotoğrafınızı buraya ekleyin */}
                            <img
                                src="/media/site.png"
                                alt="Platform Ekran Görüntüsü"
                                className="w-full h-full object-cover"
                            />

                            {/* Alternatif: Eğer fotoğraf yoksa mock içerik göster */}
                            {/* <div className="w-full h-full">
                                <div className="h-16 bg-indigo-600 w-full"></div>
                                <div className="p-6 space-y-4">
                                    <div className="w-3/4 h-10 bg-indigo-100 rounded-2xl rounded-tl-none self-start"></div>
                                    <div className="w-3/4 h-16 bg-indigo-100 rounded-2xl rounded-tl-none self-start"></div>
                                    <div className="w-2/3 h-10 bg-gray-200 rounded-2xl rounded-tr-none ml-auto"></div>
                                    <div className="w-1/2 h-8 bg-indigo-100 rounded-2xl rounded-tl-none self-start mt-8"></div>
                                </div>
                            </div> */}
                        </div>

                        {/* Reflections */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none rounded-[3rem] z-30"></div>
                    </div>
                </div>
            )
        },
        {
            id: 'conclusion',
            theme: 'dark',
            title: "Sonuç ve Gelecek",
            subtitle: "Hegemonyadan Arınmış Bir Nesil",
            content: (
                <div className="relative h-full flex flex-col items-center justify-center text-center z-10 max-w-5xl mx-auto">
                    <div className="bg-white p-6 rounded-[2rem] shadow-[0_0_60px_rgba(255,255,255,0.3)] mb-10 animate-scale-in transform hover:scale-105 transition-transform duration-300">
                        <QrCode className="w-48 h-48 text-gray-900" />
                        <p className="mt-4 text-lg font-black text-gray-900 tracking-widest">CAMTAVAN.APP</p>
                    </div>

                    <h2 className="text-4xl md:text-7xl font-black text-white mb-6 uppercase tracking-tight">
                        Şimdi Sıra Sende!
                    </h2>
                    <p className="text-xl md:text-2xl text-indigo-200 max-w-3xl mb-12 font-light">
                        Kendi duygusal dünyana özgürce yürü. <br />Potansiyelini kimseden çekinmeden ortaya koy.
                    </p>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-left w-full border-t border-white/10 pt-10">
                        {[
                            { title: "Yaygınlaştırma", desc: "Farklı şehirlerde uygulama" },
                            { title: "Mentörlük", desc: "Rehberlik sistemi entegrasyonu" },
                            { title: "Eğitim", desc: "Ebeveyn & Öğretmen farkındalığı" },
                            { title: "Araştırma", desc: "Değişken odaklı yeni analizler" }
                        ].map((item, i) => (
                            <div key={i} className="p-6 bg-white/5 rounded-2xl backdrop-blur-sm hover:bg-white/10 transition-colors group">
                                <h5 className="font-bold text-white mb-2 text-lg group-hover:text-indigo-300 transition-colors">{item.title}</h5>
                                <p className="text-sm text-gray-400 leading-snug">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )
        }
    ];


    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'ArrowRight' || e.key === ' ') {
                nextSlide();
            } else if (e.key === 'ArrowLeft') {
                prevSlide();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentSlide]);

    useEffect(() => {
        if (!isAutoPlaying) return;
        const interval = setInterval(() => {
            nextSlide();
        }, 12000);
        return () => clearInterval(interval);
    }, [isAutoPlaying, currentSlide]);


    const nextSlide = () => {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
    };

    const prevSlide = () => {
        setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
    };

    const goToSlide = (index) => {
        setCurrentSlide(index);
        setIsAutoPlaying(false);
    };

    const currentData = slides[currentSlide];

    return (
        <div className="min-h-screen font-sans flex flex-col md:flex-row bg-black overflow-hidden relative selection:bg-indigo-500 selection:text-white">

            {/* Dynamic Background */}
            <div className={`absolute inset-0 transition-colors duration-1000 ease-in-out z-0 ${currentData.theme === 'dark' ? 'bg-[#0a0a0c]' : 'bg-[#fafafa]'}`}>
                {currentData.theme === 'dark' && (
                    <>
                        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-indigo-900/40 rounded-full blur-[120px] animate-pulse-slow"></div>
                        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-purple-900/30 rounded-full blur-[120px] animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
                    </>
                )}
                {currentData.theme === 'light' && (
                    <>
                        <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-indigo-100/80 rounded-full blur-[100px]"></div>
                        <div className="absolute bottom-0 left-0 w-[50%] h-[50%] bg-purple-100/60 rounded-full blur-[100px]"></div>
                    </>
                )}
            </div>

            {/* Navigation Sidebar (Desktop) */}
            <div className="hidden md:flex flex-col w-24 z-20 border-r border-white/10 backdrop-blur-xl bg-white/5 justify-between py-10 items-center">
                <div className="w-12 h-12 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/40 animate-bounce-slow">
                    <Bird className="text-white w-7 h-7" />
                </div>

                <div className="flex flex-col gap-4">
                    {slides.map((_, i) => (
                        <div key={i} className="group relative flex items-center justify-center">
                            <button
                                onClick={() => goToSlide(i)}
                                className={`w-3 h-3 rounded-full transition-all duration-500 ${i === currentSlide ? 'bg-indigo-500 scale-150 ring-4 ring-indigo-500/20' : 'bg-gray-400/30 hover:bg-indigo-400/80'}`}
                            />
                            {/* Tooltip */}
                            <span className="absolute left-10 py-1 px-3 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                                {slides[i].title}
                            </span>
                        </div>
                    ))}
                </div>

                <button
                    onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                    className={`p-4 rounded-2xl transition-all duration-300 ${isAutoPlaying ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/40' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
                >
                    {isAutoPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
                </button>
            </div>

            {/* Main Content */}
            <div className="flex-1 relative z-10 flex flex-col h-screen max-h-screen">

                {/* Header */}
                <header className="px-12 py-8 flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className={`h-1 w-8 rounded-full ${currentData.theme === 'dark' ? 'bg-indigo-500' : 'bg-indigo-600'}`}></div>
                            <p className={`text-xs font-bold uppercase tracking-[0.2em] ${currentData.theme === 'dark' ? 'text-indigo-300' : 'text-indigo-600'}`}>
                                TÜBİTAK 2204-A
                            </p>
                        </div>
                        <h2 className={`text-3xl font-bold max-w-2xl leading-tight ${currentData.theme === 'dark' ? 'text-white' : 'text-gray-900'} animate-fade-in`}>
                            {currentData.title}
                        </h2>
                    </div>
                    <div className={`hidden lg:block text-right ${currentData.theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                        <p className="text-base font-medium font-serif italic">{currentData.subtitle}</p>
                    </div>
                </header>

                {/* Body Content */}
                <div className="flex-1 px-4 md:px-12 pb-8 overflow-y-auto overflow-x-hidden no-scrollbar">
                    <div key={currentSlide} className="h-full w-full animate-slide-in-up">
                        {currentData.content}
                    </div>
                </div>

                {/* Mobile Footer Nav */}
                <div className="p-4 md:hidden flex justify-between items-center bg-white/5 backdrop-blur-xl border-t border-white/10 absolute bottom-0 w-full z-50">
                    <button onClick={prevSlide} className="p-3 rounded-full bg-white/10 text-current hover:bg-white/20 active:scale-95 transition-all">
                        <ChevronLeft className={`${currentData.theme === 'dark' ? 'text-white' : 'text-gray-800'}`} />
                    </button>
                    <span className={`text-xs font-bold uppercase tracking-widest ${currentData.theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                        {currentSlide + 1} / {slides.length}
                    </span>
                    <button onClick={nextSlide} className="p-3 rounded-full bg-indigo-600 text-white shadow-lg active:scale-95 transition-all">
                        <ChevronRight />
                    </button>
                </div>
            </div>

            {/* Custom Animations & Styles */}
            <style>{`
                @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
                @keyframes slide-in-up { 
                    0% { opacity: 0; transform: translateY(30px) scale(0.98); } 
                    100% { opacity: 1; transform: translateY(0) scale(1); } 
                }
                @keyframes slide-in-left { 
                    from { opacity: 0; transform: translateX(-30px); } 
                    to { opacity: 1; transform: translateX(0); } 
                }
                @keyframes scale-in { 
                    from { opacity: 0; transform: scale(0.9); } 
                    to { opacity: 1; transform: scale(1); } 
                }
                @keyframes bounce-slow { 
                    0%, 100% { transform: translateY(0); } 
                    50% { transform: translateY(-15px); } 
                }
                @keyframes pulse-slow { 
                    0%, 100% { opacity: 0.5; transform: scale(1); } 
                    50% { opacity: 0.3; transform: scale(1.05); } 
                }
                @keyframes shimmer { 
                    0% { transform: translateX(-150%) skewX(-12deg); } 
                    100% { transform: translateX(150%) skewX(-12deg); } 
                }
                
                .animate-fade-in { animation: fade-in 1s ease-out forwards; }
                .animate-fade-in-up { animation: slide-in-up 0.8s ease-out forwards; }
                .animate-slide-in-up { animation: slide-in-up 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
                .animate-slide-in-left { animation: slide-in-left 0.8s ease-out forwards; }
                .animate-scale-in { animation: scale-in 0.8s ease-out forwards; }
                .animate-bounce-slow { animation: bounce-slow 4s ease-in-out infinite; }
                .animate-pulse-slow { animation: pulse-slow 5s ease-in-out infinite; }
                
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
}

export default ExhibitionView;
