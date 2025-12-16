import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Send, Hash, User, Settings, LogOut, Mic, MicOff, PhoneOff, Volume2, VolumeX, Menu, X, ChevronUp, ChevronDown, Signal } from 'lucide-react';
import { API, AgoraRTC, AgoraRTM } from '../App';

// --- Yardımcı Bileşenler ---

function ProfilePanel({ user, onClose, onUpdate }) {
  const [displayName, setDisplayName] = useState(user.displayName || '');
  const [bio, setBio] = useState(user.bio || '');
  const [isAnonymous, setIsAnonymous] = useState(user.isAnonymous || false);

  const testScore = user.assessmentScore || 0;
  const testPercentage = user.assessmentPercentage || 0;

  const handleSave = async () => {
    try {
      const updates = { displayName, bio, isAnonymous };
      await API.updateProfile(updates);
      onUpdate(updates);
      onClose();
    } catch (error) {
      console.error('Profil güncellenemedi:', error);
      alert('Profil güncellenirken bir hata oluştu. Lütfen tekrar deneyin.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-fade-in">
      <div className="bg-gray-800 rounded-xl w-full max-w-md p-6 shadow-2xl border border-gray-700 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Profil Ayarları</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-700 rounded-full text-gray-400 hover:text-white transition">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Görünen Ad</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-gray-900 text-white border border-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
              placeholder="Görünen adınız"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Biyografi</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-gray-900 text-white border border-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none transition"
              rows="3"
              placeholder="Kendinizden bahsedin..."
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-200">Anonim Mod</p>
              <p className="text-xs text-gray-400">İsminiz gizlenir, avatarınız değişir</p>
            </div>
            <button
              onClick={() => setIsAnonymous(!isAnonymous)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${
                isAnonymous ? 'bg-indigo-600' : 'bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out ${
                  isAnonymous ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="bg-gradient-to-r from-gray-800 to-gray-700 p-4 rounded-lg border border-gray-600">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-300 font-medium">Test Skoru</span>
              <span className={`text-sm font-bold px-2 py-0.5 rounded ${
                testPercentage >= 75 ? 'bg-green-500/20 text-green-400' :
                testPercentage >= 50 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'
              }`}>%{testPercentage}</span>
            </div>
            <div className="w-full bg-gray-900 rounded-full h-2.5">
              <div 
                className={`h-2.5 rounded-full ${
                  testPercentage >= 75 ? 'bg-green-500' :
                  testPercentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                }`} 
                style={{ width: `${testPercentage}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-400 mt-2 text-right">{testScore}/16 Puan</p>
          </div>
        </div>

        <div className="flex gap-3 mt-8">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-lg bg-gray-700 text-white hover:bg-gray-600 transition font-medium"
          >
            İptal
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition font-medium"
          >
            Kaydet
          </button>
        </div>
      </div>
    </div>
  );
}

function VoiceUserCard({ userId, username, isSpeaking, isMuted }) {
  return (
    <div className={`flex items-center gap-3 p-2 rounded-lg transition-all ${isSpeaking ? 'bg-gray-700/80 border-l-2 border-green-500' : 'hover:bg-gray-700/50'}`}>
      <div className="relative">
        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shadow-sm transition-all ${
          isSpeaking ? 'bg-green-600 ring-2 ring-green-400 ring-opacity-50 scale-105' : 'bg-indigo-600'
        }`}>
          {username?.[0]?.toUpperCase() || '?'}
        </div>
        {isMuted && (
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center ring-2 ring-gray-800">
            <MicOff size={10} className="text-white" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-medium truncate leading-tight">{username}</p>
        <div className="flex items-center gap-1">
          {isSpeaking ? (
            <span className="text-green-400 text-xs flex items-center gap-1 animate-pulse">
              <Signal size={10} /> Konuşuyor
            </span>
          ) : (
            <span className="text-gray-500 text-xs">Bağlı</span>
          )}
        </div>
      </div>
    </div>
  );
}

// Mobilde sesli sohbet kontrolleri için yüzen bar
function MobileVoiceBar({ isOpen, activeChannel, voiceUsers, isMuted, isDeafened, toggleMute, toggleDeafen, leaveVoiceCall }) {
  const [expanded, setExpanded] = useState(false);
  
  if (!isOpen) return null;

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 shadow-xl z-40 pb-safe">
      {/* Mini Bar (Always Visible) */}
      <div className="flex items-center justify-between px-4 py-3" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center gap-3">
          <div className="bg-green-500/20 p-2 rounded-full animate-pulse">
            <Signal className="w-5 h-5 text-green-500" />
          </div>
          <div>
            <p className="text-white font-medium text-sm">Sesli Sohbet</p>
            <p className="text-green-400 text-xs">{voiceUsers.length} kişi bağlı • {activeChannel?.name}</p>
          </div>
        </div>
        <button onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }} className="text-gray-400">
          {expanded ? <ChevronDown /> : <ChevronUp />}
        </button>
      </div>

      {/* Expanded Controls */}
      {expanded && (
        <div className="px-4 pb-4 animate-slide-up">
           <div className="max-h-40 overflow-y-auto mb-4 bg-gray-900/50 rounded-lg p-2 space-y-1">
             {voiceUsers.map(u => (
               <div key={u.uid} className="flex items-center gap-2 text-white text-sm p-1">
                 <div className={`w-2 h-2 rounded-full ${u.isSpeaking ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                 <span className="flex-1 truncate">{u.username}</span>
                 {u.isMuted && <MicOff size={12} className="text-red-400" />}
               </div>
             ))}
           </div>
           
           <div className="flex items-center justify-between gap-4">
            <button 
              onClick={toggleMute}
              className={`flex-1 flex flex-col items-center gap-1 p-3 rounded-xl transition ${isMuted ? 'bg-white text-red-600' : 'bg-gray-700 text-white'}`}
            >
              {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
              <span className="text-xs font-medium">{isMuted ? 'Aç' : 'Kapat'}</span>
            </button>
            
            <button 
              onClick={toggleDeafen}
              className={`flex-1 flex flex-col items-center gap-1 p-3 rounded-xl transition ${isDeafened ? 'bg-white text-red-600' : 'bg-gray-700 text-white'}`}
            >
              {isDeafened ? <VolumeX size={24} /> : <Volume2 size={24} />}
              <span className="text-xs font-medium">{isDeafened ? 'Duyma' : 'Duy'}</span>
            </button>
            
            <button 
              onClick={leaveVoiceCall}
              className="flex-1 flex flex-col items-center gap-1 p-3 rounded-xl bg-red-600 text-white hover:bg-red-700 transition"
            >
              <PhoneOff size={24} />
              <span className="text-xs font-medium">Ayrıl</span>
            </button>
           </div>
        </div>
      )}
    </div>
  );
}

// --- Ana Bileşen ---

function ChatView({ user, channels, onLogout, onProfileUpdate }) {
  const [activeChannel, setActiveChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [showProfile, setShowProfile] = useState(false);
  
  // Voice State
  const [inVoiceCall, setInVoiceCall] = useState(false);
  const [connectionState, setConnectionState] = useState('DISCONNECTED'); // DISCONNECTED, CONNECTING, CONNECTED, RECONNECTING
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [voiceUsers, setVoiceUsers] = useState([]);
  const [speakingUsers, setSpeakingUsers] = useState(new Set());
  
  // Cache ve Refs
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const messagesEndRef = useRef(null);
  const rtcClientRef = useRef(null);
  const audioTrackRef = useRef(null);
  const messagePollingRef = useRef(null);
  const userCacheRef = useRef({}); // UID -> Username cache

  // 1. Initial Load & Channel Selection Logic (Fixed Reload Issue)
  useEffect(() => {
    if (channels && channels.length > 0) {
      if (!activeChannel) {
        // İlk yükleme veya refresh sonrası
        setActiveChannel(channels[0]);
      } else {
        // Eğer mevcut kanal listeden silindiyse veya güncellendiyse kontrol et
        const currentStillExists = channels.find(c => (c.id || c._id) === (activeChannel.id || activeChannel._id));
        if (!currentStillExists) {
           setActiveChannel(channels[0]);
        }
      }
    }
  }, [channels, activeChannel]);

  // 2. Message Loading & Polling
  useEffect(() => {
    if (activeChannel) {
      const channelId = activeChannel.id || activeChannel._id;
      loadMessages(channelId);
      startMessagePolling();
      
      // RTM'e katıl (Chat odası için)
      initializeRTM(activeChannel.name);

      setSidebarOpen(false); // Mobilde kanal değişince menüyü kapat
    }
    
    return () => {
      stopMessagePolling();
      cleanupRTM();
    };
  }, [activeChannel]);

  // 3. Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    
    // Mesajlardan kullanıcı önbelleği oluştur (Voice chat isimleri için)
    messages.forEach(msg => {
      if (msg.username && !msg.isAnonymous) {
        // Not: Gerçek app'te user.id ile agora.uid eşleşmesi backend'den gelmeli.
        // Burada basitçe isimleri topluyoruz.
        userCacheRef.current[msg.username] = msg.username;
      }
    });
  }, [messages]);

  // 4. Cleanup on unmount
  useEffect(() => {
    return () => {
      leaveVoiceCall(); // Component ölürse sesten çık
    };
  }, []);

  const initializeRTM = async (channelName) => {
    try {
      const tokenData = await API.getAgoraToken();
      await AgoraRTM.initialize(tokenData.appId, tokenData.userId, tokenData.token);
      await AgoraRTM.joinChannel(channelName);
    } catch (error) {
      console.warn('RTM Connection Warning:', error);
    }
  };

  const cleanupRTM = async () => {
    try {
      await AgoraRTM.leaveChannel();
    } catch (e) { /* ignore */ }
  };

  const startMessagePolling = () => {
    stopMessagePolling();
    messagePollingRef.current = setInterval(async () => {
      if (activeChannel) {
        try {
          const msgs = await API.getMessages(activeChannel.id || activeChannel._id);
          // Sadece yeni mesaj varsa update et (optimizasyon eklenebilir)
          setMessages(msgs);
        } catch (error) {
          console.error('Polling error:', error);
        }
      }
    }, 3000); // 3 saniyeye çektim, sunucuyu yormamak için
  };

  const stopMessagePolling = () => {
    if (messagePollingRef.current) {
      clearInterval(messagePollingRef.current);
      messagePollingRef.current = null;
    }
  };

  const loadMessages = async (channelId) => {
    try {
      const msgs = await API.getMessages(channelId);
      setMessages(msgs);
    } catch (error) {
      console.error('Mesaj yükleme hatası:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim()) return;

    const tempId = `temp-${Date.now()}`;
    const optimisticMessage = {
      _id: tempId,
      id: tempId,
      channelId: activeChannel.id || activeChannel._id,
      userId: user.id,
      username: user.displayName || user.email.split('@')[0],
      text: messageInput,
      createdAt: new Date().toISOString(),
      isAnonymous: user.isAnonymous || false
    };

    setMessages(prev => [...prev, optimisticMessage]);
    const currentInput = messageInput;
    setMessageInput('');

    try {
      const savedMessage = await API.sendMessage(activeChannel.id || activeChannel._id, currentInput);
      setMessages(prev => prev.map(m => m._id === tempId ? savedMessage : m));
      
      try {
        await AgoraRTM.sendMessage(currentInput);
      } catch (e) { /* ignore RTM fail */ }
    } catch (error) {
      console.error('Mesaj gitmedi:', error);
      alert('Mesaj gönderilemedi.');
      setMessages(prev => prev.filter(m => m._id !== tempId));
      setMessageInput(currentInput);
    }
  };

  // --- Geliştirilmiş Sesli Sohbet Mantığı ---

  const joinVoiceCall = async () => {
  if (connectionState === 'CONNECTING' || connectionState === 'CONNECTED') return;
  
  try {
    setConnectionState('CONNECTING');
    const channelName = `voice-${activeChannel.name}`;
    
    // Token al
     const tokenData = await API.getAgoraRtcToken(channelName);
  if (tokenData.channelUsers) {
    tokenData.channelUsers.forEach(u => {
      userCacheRef.current[u.uid] = u.username;
    });}
    
    // Client oluştur
    if (!rtcClientRef.current) {
      rtcClientRef.current = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
    }

    const client = rtcClientRef.current;

    // Event Listener'ları ekle (önce temizle ki dublike olmasın)
    client.removeAllListeners();

    // USER PUBLISHED - Yeni kullanıcı yayına başladı
    client.on('user-published', async (user, mediaType) => {
      console.log('User published:', user.uid, mediaType);
      try {
        await client.subscribe(user, mediaType);
        console.log('Subscribed to user:', user.uid);
        
        if (mediaType === 'audio') {
          user.audioTrack.play();
          // Kullanıcıyı listeye ekle/güncelle
          updateVoiceUser(user.uid, { isMuted: false });
        }
      } catch (error) {
        console.error('Subscribe error:', error);
      }
    });

    // USER UNPUBLISHED - Kullanıcı yayını durdurdu (ama odada)
    client.on('user-unpublished', (user, mediaType) => {
      console.log('User unpublished:', user.uid, mediaType);
      if (mediaType === 'audio') {
        updateVoiceUser(user.uid, { isMuted: true });
      }
    });

    // USER JOINED - Yeni kullanıcı odaya katıldı
    client.on('user-joined', (user) => {
      console.log('User joined:', user.uid);
      // Kullanıcıyı listeye ekle (henüz yayın yapmıyor olabilir)
      updateVoiceUser(user.uid, { isMuted: true });
    });

    // USER LEFT - Kullanıcı odadan ayrıldı
    client.on('user-left', (user) => {
      console.log('User left:', user.uid);
      removeVoiceUser(user.uid);
    });

    // VOLUME INDICATOR - Konuşma tespiti
    client.on('volume-indicator', (volumes) => {
      const speaking = new Set();
      volumes.forEach(v => {
        if (v.level > 5) speaking.add(v.uid);
      });
      setSpeakingUsers(speaking);
    });
    
    // CONNECTION STATE - Bağlantı durumu değişimi
    client.on('connection-state-change', (curState, prevState) => {
      console.log('Agora State:', prevState, '->', curState);
      setConnectionState(curState);
      if (curState === 'DISCONNECTED') {
        if (inVoiceCall) leaveVoiceCall(); 
      }
    });

    // Kanala katıl
    const uid = await client.join(tokenData.appId, channelName, tokenData.token, tokenData.uid);
    console.log('Joined channel with UID:', uid);

    // Audio track oluştur ve yayınla
    audioTrackRef.current = await AgoraRTC.createMicrophoneAudioTrack({
      encoderConfig: 'speech_standard',
      AEC: true, 
      ANS: true, 
      AGC: true
    });
    
    await client.publish([audioTrackRef.current]);
    
    // Volume indicator'ı PUBLISH'den SONRA başlat
    client.enableAudioVolumeIndicator();

    // Kendini listeye ekle
    const myUsername = user.displayName || user.email.split('@')[0];
    userCacheRef.current[uid] = myUsername;
    
    addVoiceUser({
      uid: uid,
      username: myUsername,
      isMuted: false,
      isLocal: true
    });

    // CRITICAL FIX: Mevcut remote kullanıcıları tarayıp subscribe ol
    console.log('Remote users in channel:', client.remoteUsers.length);
    
    // Kısa bir gecikme ekle - diğer kullanıcıların track'lerinin hazır olması için
    await new Promise(resolve => setTimeout(resolve, 500));
    
    for (const remoteUser of client.remoteUsers) {
      console.log('Processing existing remote user:', remoteUser.uid);
      
      // Kullanıcıyı listeye ekle
      updateVoiceUser(remoteUser.uid, { isMuted: !remoteUser.hasAudio });
      
      // Eğer audio track varsa subscribe ol
      if (remoteUser.hasAudio && remoteUser.audioTrack) {
        try {
          await client.subscribe(remoteUser, 'audio');
          remoteUser.audioTrack.play();
          console.log('Subscribed to existing user audio:', remoteUser.uid);
          updateVoiceUser(remoteUser.uid, { isMuted: false });
        } catch (error) {
          console.error('Error subscribing to existing user:', remoteUser.uid, error);
        }
      }
    }

    setInVoiceCall(true);
    setConnectionState('CONNECTED');
    console.log('Voice call setup complete');

  } catch (error) {
    console.error('Ses bağlantı hatası:', error);
    alert('Sesli sohbete bağlanılamadı. Lütfen mikrofon izinlerini kontrol edin.');
    setConnectionState('DISCONNECTED');
    leaveVoiceCall();
  }
};

  const leaveVoiceCall = async () => {
    try {
      if (audioTrackRef.current) {
        audioTrackRef.current.close();
        audioTrackRef.current = null;
      }
      
      if (rtcClientRef.current) {
        rtcClientRef.current.removeAllListeners();
        await rtcClientRef.current.leave();
        // Client'ı null yapmıyoruz, reuse edebiliriz veya tekrar oluşturabiliriz.
        // Ama temiz state için null yapmak daha güvenli olabilir.
        rtcClientRef.current = null; 
      }
    } catch (e) {
      console.error('Leave error:', e);
    } finally {
      setInVoiceCall(false);
      setVoiceUsers([]);
      setSpeakingUsers(new Set());
      setIsMuted(false);
      setIsDeafened(false);
      setConnectionState('DISCONNECTED');
    }
  };

  // Helper: Kullanıcı listesini güncelleme (Ad sorunu çözümü)
  const updateVoiceUser = (uid, data = {}) => {
    setVoiceUsers(prev => {
      const existing = prev.find(u => u.uid === uid);
      
      // İsim bulma mantığı: Cache'den bak, yoksa fallback yap
      let username = existing?.username;
      if (!username) {
         username = userCacheRef.current[uid] || `Misafir ${String(uid).slice(-4)}`;
      }

      if (existing) {
        return prev.map(u => u.uid === uid ? { ...u, ...data, username } : u);
      } else {
        return [...prev, { uid, username, isMuted: false, ...data }];
      }
    });
  };
  
  const removeVoiceUser = (uid) => {
    setVoiceUsers(prev => prev.filter(u => u.uid !== uid));
    setSpeakingUsers(prev => {
      const next = new Set(prev);
      next.delete(uid);
      return next;
    });
  };

  const addVoiceUser = (userObj) => {
    setVoiceUsers(prev => {
       if (prev.find(u => u.uid === userObj.uid)) return prev;
       return [...prev, userObj];
    });
  };

  const toggleMute = async () => {
    if (audioTrackRef.current) {
      const newState = !isMuted;
      await audioTrackRef.current.setMuted(newState);
      setIsMuted(newState);
    }
  };

  const toggleDeafen = () => {
    const newState = !isDeafened;
    setIsDeafened(newState);
    if (newState && !isMuted) toggleMute(); // Sağır olunca mikrofonu da kapat
    
    // Remote user seslerini kapat/aç
    if (rtcClientRef.current) {
      rtcClientRef.current.remoteUsers.forEach(user => {
        if (user.audioTrack) {
          user.audioTrack.setVolume(newState ? 0 : 100);
        }
      });
    }
  };

  const groupedChannels = useMemo(() => {
    return channels.reduce((acc, channel) => {
      if (!acc[channel.category]) acc[channel.category] = [];
      acc[channel.category].push(channel);
      return acc;
    }, {});
  }, [channels]);

  return (
    <div className="h-screen flex bg-gray-900 overflow-hidden font-sans">
      
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm transition-opacity" onClick={() => setSidebarOpen(false)} />
      )}

      {/* --- SIDEBAR --- */}
      <div className={`
        fixed lg:relative inset-y-0 left-0 z-50
        w-72 bg-gray-800 flex flex-col border-r border-gray-700
        transform transition-transform duration-300 ease-in-out shadow-2xl
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-gray-700 bg-gray-800">
          <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            Destek Topluluğu
          </h1>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        {/* Channels List */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {Object.entries(groupedChannels).map(([category, categoryChannels]) => (
            <div key={category} className="mb-6">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 px-2 flex items-center justify-between group cursor-pointer hover:text-gray-300">
                {category}
                <ChevronDown size={12} className="opacity-0 group-hover:opacity-100 transition" />
              </h3>
              <div className="space-y-0.5">
                {categoryChannels.map((channel) => {
                  const isActive = (activeChannel?.id || activeChannel?._id) === (channel.id || channel._id);
                  return (
                    <button
                      key={channel.id || channel._id}
                      onClick={() => setActiveChannel(channel)}
                      className={`w-full flex items-center px-3 py-2 rounded-lg transition-all duration-200 group ${
                        isActive 
                          ? 'bg-indigo-600/10 text-white shadow-sm border border-indigo-600/20' 
                          : 'text-gray-400 hover:bg-gray-700/50 hover:text-gray-200'
                      }`}
                    >
                      <Hash size={18} className={`mr-2.5 flex-shrink-0 ${isActive ? 'text-indigo-400' : 'text-gray-500 group-hover:text-gray-400'}`} />
                      <span className={`text-sm font-medium truncate ${isActive ? 'text-indigo-100' : ''}`}>{channel.name}</span>
                      {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.5)]"></div>}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Desktop Voice Panel (Hidden on Mobile if not expanded, handled by floating bar) */}
        {inVoiceCall && (
          <div className="hidden lg:block bg-gray-900/50 border-t border-gray-700 backdrop-blur-md">
            <div className="p-3 border-b border-gray-700/50 flex items-center justify-between">
              <div className="flex items-center gap-2 text-green-400">
                 <Signal size={16} className="animate-pulse"/>
                 <span className="text-xs font-bold uppercase tracking-wide">Ses Bağlantısı</span>
              </div>
              <span className="text-xs text-gray-500 font-mono">{activeChannel?.name}</span>
            </div>
            
            <div className="p-2 max-h-48 overflow-y-auto space-y-1 custom-scrollbar">
               {voiceUsers.map((voiceUser) => (
                 <VoiceUserCard
                   key={voiceUser.uid}
                   userId={voiceUser.uid}
                   username={voiceUser.username}
                   isSpeaking={speakingUsers.has(voiceUser.uid)}
                   isMuted={voiceUser.isMuted}
                 />
               ))}
            </div>

            <div className="p-3 grid grid-cols-3 gap-2">
              <button onClick={toggleMute} className={`p-2 rounded-lg flex justify-center items-center transition ${isMuted ? 'bg-white text-red-600' : 'bg-gray-800 hover:bg-gray-700 text-white'}`}>
                 {isMuted ? <MicOff size={18} /> : <Mic size={18} />}
              </button>
              <button onClick={toggleDeafen} className={`p-2 rounded-lg flex justify-center items-center transition ${isDeafened ? 'bg-white text-red-600' : 'bg-gray-800 hover:bg-gray-700 text-white'}`}>
                 {isDeafened ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>
              <button onClick={leaveVoiceCall} className="p-2 rounded-lg bg-red-600/20 hover:bg-red-600/40 text-red-500 hover:text-red-200 transition flex justify-center items-center">
                 <PhoneOff size={18} />
              </button>
            </div>
          </div>
        )}

        {/* User Profile Bar */}
        <div className="bg-gray-850 p-4 border-t border-gray-700">
          <div className="flex items-center gap-3">
            <div className="relative group cursor-pointer" onClick={() => setShowProfile(true)}>
               <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold shadow-lg group-hover:ring-2 ring-indigo-400 transition">
                  {user.displayName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase()}
               </div>
               <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-gray-800 rounded-full"></div>
            </div>
            <div className="flex-1 min-w-0">
               <p className="text-sm font-bold text-white truncate">{user.displayName || user.email.split('@')[0]}</p>
               <p className="text-xs text-gray-400 truncate">#{String(user.id).slice(-4)}</p>
            </div>
            <div className="flex flex-col gap-1">
              <button onClick={() => setShowProfile(true)} className="p-1.5 hover:bg-gray-700 rounded text-gray-400 hover:text-white transition">
                <Settings size={16} />
              </button>
              <button onClick={onLogout} className="p-1.5 hover:bg-red-900/30 rounded text-gray-400 hover:text-red-400 transition">
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* --- MAIN CHAT AREA --- */}
      <div className="flex-1 flex flex-col min-w-0 bg-gray-900 relative">
        
        {/* Chat Header */}
        <div className="h-16 border-b border-gray-700 flex items-center justify-between px-4 sm:px-6 bg-gray-800 shadow-sm z-10">
          <div className="flex items-center min-w-0">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden mr-4 text-gray-400 hover:text-white">
              <Menu size={24} />
            </button>
            <Hash size={24} className="text-gray-500 mr-3 flex-shrink-0" />
            <div>
              <h2 className="text-white font-bold text-base sm:text-lg truncate leading-tight">
                {activeChannel?.name || 'Kanal Yükleniyor...'}
              </h2>
              {activeChannel?.description && (
                <p className="hidden sm:block text-xs text-gray-400 truncate mt-0.5">{activeChannel.description}</p>
              )}
            </div>
          </div>

          {!inVoiceCall ? (
             <button
               onClick={joinVoiceCall}
               className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition shadow-lg hover:shadow-green-500/20 active:scale-95"
             >
               <Mic size={18} />
               <span className="hidden sm:inline font-medium">Sesli Sohbet</span>
             </button>
          ) : (
            <div className="hidden lg:flex items-center gap-2 px-4 py-2 bg-green-900/30 border border-green-500/30 text-green-400 rounded-lg">
               <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
               <span className="font-medium text-sm">Bağlı</span>
            </div>
          )}
        </div>

        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 custom-scrollbar scroll-smooth">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center opacity-50">
               <div className="w-16 h-16 bg-gray-800 rounded-2xl flex items-center justify-center mb-4">
                 <Hash size={32} className="text-gray-600" />
               </div>
               <p className="text-gray-400 font-medium">Bu kanal henüz çok sessiz...</p>
               <p className="text-gray-600 text-sm mt-1">İlk mesajı sen gönder!</p>
            </div>
          ) : (
            messages.map((msg, i) => {
               const isSameUser = i > 0 && messages[i-1].userId === msg.userId;
               const isSystem = msg.type === 'system';
               
               if (isSystem) return (
                 <div key={msg._id} className="flex items-center justify-center my-4">
                   <div className="bg-gray-800/50 px-3 py-1 rounded-full border border-gray-700/50">
                     <span className="text-xs text-gray-400">{msg.text}</span>
                   </div>
                 </div>
               );

               return (
                <div key={msg._id || i} className={`flex gap-4 group ${isSameUser ? 'mt-1' : 'mt-6'}`}>
                  {!isSameUser ? (
                    <div className="w-10 h-10 rounded-full bg-indigo-600 flex-shrink-0 flex items-center justify-center text-white font-bold text-sm shadow-sm mt-0.5">
                      {msg.username?.[0]?.toUpperCase() || '?'}
                    </div>
                  ) : (
                    <div className="w-10 flex-shrink-0" /> // Spacer
                  )}
                  
                  <div className="flex-1 min-w-0">
                    {!isSameUser && (
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="text-white font-bold hover:underline cursor-pointer">
                          {msg.isAnonymous ? 'Anonim' : msg.username}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(msg.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    )}
                    <p className={`text-gray-300 leading-relaxed break-words ${!isSameUser ? '' : 'text-gray-300/90'}`}>
                      {msg.text}
                    </p>
                  </div>
                </div>
               );
            })
          )}
          <div ref={messagesEndRef} className="h-4" />
        </div>

        {/* Floating Voice Bar (Mobile Only) */}
        {inVoiceCall && (
          <MobileVoiceBar 
            isOpen={true}
            activeChannel={activeChannel}
            voiceUsers={voiceUsers}
            isMuted={isMuted}
            isDeafened={isDeafened}
            toggleMute={toggleMute}
            toggleDeafen={toggleDeafen}
            leaveVoiceCall={leaveVoiceCall}
          />
        )}

        {/* Input Area */}
        <div className={`p-4 bg-gray-800 border-t border-gray-700 ${inVoiceCall ? 'lg:pb-4 pb-20' : ''}`}>
          <div className="relative flex items-center bg-gray-700/50 rounded-xl border border-gray-600/50 focus-within:border-indigo-500/50 focus-within:ring-1 focus-within:ring-indigo-500/50 transition shadow-inner">
             <input
               type="text"
               value={messageInput}
               onChange={(e) => setMessageInput(e.target.value)}
               onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
               placeholder={`#${activeChannel?.name || 'kanal'} kanalına mesaj gönder`}
               className="flex-1 bg-transparent text-white px-4 py-3.5 outline-none placeholder-gray-500"
               disabled={!activeChannel}
             />
             <div className="pr-2">
               <button
                 onClick={handleSendMessage}
                 disabled={!messageInput.trim()}
                 className="p-2 bg-indigo-600 rounded-lg text-white hover:bg-indigo-700 disabled:opacity-50 disabled:bg-gray-600 disabled:cursor-not-allowed transition shadow-lg"
               >
                 <Send size={18} />
               </button>
             </div>
          </div>
        </div>
      </div>

      {/* Profile Modal */}
      {showProfile && (
        <ProfilePanel
          user={user}
          onClose={() => setShowProfile(false)}
          onUpdate={onProfileUpdate}
        />
      )}
    </div>
  );
}

export default ChatView;