import React, { useState, useEffect, useRef } from 'react';
import { Send, Hash, User, Settings, LogOut, Mic, MicOff, PhoneOff, Volume2, VolumeX, Menu, X } from 'lucide-react';
import { API, AgoraRTC, AgoraRTM } from '../App';

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg w-full max-w-md p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-bold text-white">Profil Ayarları</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            ✕
          </button>
        </div>

        <div className="space-y-3 sm:space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Görünen Ad</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-3 sm:px-4 py-2 rounded bg-gray-700 text-white border border-gray-600 focus:ring-2 focus:ring-indigo-500 outline-none text-sm sm:text-base"
              placeholder="Görünen adınız"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Biyografi</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full px-3 sm:px-4 py-2 rounded bg-gray-700 text-white border border-gray-600 focus:ring-2 focus:ring-indigo-500 outline-none resize-none text-sm sm:text-base"
              rows="3"
              placeholder="Kendiniz hakkında yazın..."
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-300">Anonim Mod</p>
              <p className="text-xs text-gray-400">Kimliğinizi gizleyin</p>
            </div>
            <button
              onClick={() => setIsAnonymous(!isAnonymous)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                isAnonymous ? 'bg-indigo-600' : 'bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                  isAnonymous ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="bg-gray-700 p-3 sm:p-4 rounded-lg border border-gray-600">
            <p className="text-sm text-gray-300 font-semibold mb-1">Test Sonucunuz</p>
            <p className="text-white text-base sm:text-lg font-bold mb-1">
              {testScore}/16 Puan
            </p>
            <p className={`text-sm font-semibold ${
              testPercentage >= 75 ? 'text-green-400' :
              testPercentage >= 50 ? 'text-yellow-400' : 'text-red-400'
            }`}>
              %{testPercentage}
            </p>
          </div>
        </div>

        <div className="flex gap-3 mt-4 sm:mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded bg-gray-700 text-white hover:bg-gray-600 transition text-sm sm:text-base"
          >
            İptal
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700 transition text-sm sm:text-base"
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
    <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-gray-700 rounded-lg">
      <div className="relative">
        <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center ${
          isSpeaking ? 'bg-green-600 ring-2 ring-green-400' : 'bg-indigo-600'
        } transition-all`}>
          <span className="text-white font-semibold text-xs sm:text-sm">
            {username?.[0]?.toUpperCase() || '?'}
          </span>
        </div>
        {isMuted && (
          <div className="absolute -bottom-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-red-600 rounded-full flex items-center justify-center">
            <MicOff className="w-2 h-2 sm:w-3 sm:h-3 text-white" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white text-xs sm:text-sm font-medium truncate">{username}</p>
        <p className="text-gray-400 text-xs">
          {isSpeaking ? 'Konuşuyor...' : 'Bağlı'}
        </p>
      </div>
    </div>
  );
}

function ChatView({ user, channels, onLogout, onProfileUpdate }) {
  const [activeChannel, setActiveChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [showProfile, setShowProfile] = useState(false);
  const [inVoiceCall, setInVoiceCall] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [voiceUsers, setVoiceUsers] = useState([]);
  const [speakingUsers, setSpeakingUsers] = useState(new Set());
  const [myUid, setMyUid] = useState(null);
  const [userIdToNameMap, setUserIdToNameMap] = useState({});
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const messagesEndRef = useRef(null);
  const rtcClientRef = useRef(null);
  const audioTrackRef = useRef(null);
  const messagePollingRef = useRef(null);

  useEffect(() => {
    if (channels.length > 0 && !activeChannel) {
      setActiveChannel(channels[0]);
    }
  }, [channels]);

  useEffect(() => {
    if (activeChannel) {
      loadMessages(activeChannel.id || activeChannel._id);
      startMessagePolling();
      initializeRTM();
      setSidebarOpen(false); // Close sidebar on mobile when channel changes
    }
    
    return () => {
      stopMessagePolling();
      cleanupRTM();
    };
  }, [activeChannel]);

  const initializeRTM = async () => {
    try {
      console.log('🔄 RTM initialize ediliyor...');
      const tokenData = await API.getAgoraToken();
      console.log('✅ RTM token alındı:', tokenData.userId);
      
      await AgoraRTM.initialize(tokenData.appId, tokenData.userId, tokenData.token);
      console.log('✅ RTM client oluşturuldu');
      
      await AgoraRTM.joinChannel(activeChannel.name);
      console.log('✅ RTM kanalına katıldı:', activeChannel.name);
    } catch (error) {
      console.error('❌ RTM initialization failed:', error);
    }
  };

  const cleanupRTM = async () => {
    try {
      await AgoraRTM.leaveChannel();
    } catch (error) {
      console.error('RTM cleanup error:', error);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    return () => {
      if (inVoiceCall) {
        leaveVoiceCall();
      }
    };
  }, []);

  const startMessagePolling = () => {
    stopMessagePolling();
    messagePollingRef.current = setInterval(async () => {
      if (activeChannel) {
        try {
          const msgs = await API.getMessages(activeChannel.id || activeChannel._id);
          setMessages(msgs);
        } catch (error) {
          console.error('Mesajlar yüklenemedi:', error);
        }
      }
    }, 2000);
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
      console.error('Mesajlar yüklenemedi:', error);
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

    setMessages([...messages, optimisticMessage]);
    const currentInput = messageInput;
    setMessageInput('');

    try {
      const savedMessage = await API.sendMessage(activeChannel.id || activeChannel._id, currentInput);
      setMessages(prev => prev.map(m => 
        m._id === tempId ? savedMessage : m
      ));
      
      try {
        console.log('📤 RTM mesajı gönderiliyor...');
        await AgoraRTM.sendMessage(currentInput);
        console.log('✅ RTM mesajı gönderildi');
      } catch (rtmError) {
        console.warn('⚠️ RTM message failed, but database message succeeded:', rtmError);
      }
    } catch (error) {
      console.error('❌ Mesaj gönderilemedi:', error);
      setMessages(prev => prev.filter(m => m._id !== tempId));
      setMessageInput(currentInput);
      alert('Mesaj gönderilemedi. Lütfen tekrar deneyin.');
    }
  };

  const joinVoiceCall = async () => {
    try {
      const channelName = `voice-${activeChannel.name}`;
      const tokenData = await API.getAgoraRtcToken(channelName);
      
      rtcClientRef.current = AgoraRTC.createClient({ 
        mode: 'rtc', 
        codec: 'vp8' 
      });
      
      const joinedUid = await rtcClientRef.current.join(
        tokenData.appId, 
        channelName, 
        tokenData.token, 
        tokenData.uid
      );
      
      setMyUid(joinedUid);
      
      setUserIdToNameMap(prev => ({
        ...prev,
        [joinedUid]: tokenData.username || user.displayName || user.email.split('@')[0]
      }));
      
      console.log('Sesli kanala katıldı:', channelName, 'UID:', joinedUid);
      
      audioTrackRef.current = await AgoraRTC.createMicrophoneAudioTrack({
        encoderConfig: 'music_standard',
        AEC: true,
        AGC: true,
        ANS: true
      });
      
      await rtcClientRef.current.publish([audioTrackRef.current]);
      
      setInVoiceCall(true);
      setVoiceUsers([{
        uid: joinedUid,
        username: tokenData.username || user.displayName || user.email.split('@')[0],
        isMuted: false
      }]);
      
      console.log('🎤 İlk voice user eklendi:', {
        uid: joinedUid,
        username: tokenData.username || user.displayName || user.email.split('@')[0]
      });
      
      if (typeof rtcClientRef.current.enableAudioVolumeIndicator === 'function') {
        rtcClientRef.current.enableAudioVolumeIndicator();
      }
      
      rtcClientRef.current.on('user-published', async (remoteUser, mediaType) => {
        console.log('Kullanıcı yayına başladı:', remoteUser.uid, mediaType);
        
        if (mediaType === 'audio') {
          await rtcClientRef.current.subscribe(remoteUser, mediaType);
          
          if (!isDeafened && remoteUser.audioTrack) {
            remoteUser.audioTrack.play();
          }
          
          const username = userIdToNameMap[remoteUser.uid] || `Kullanıcı ${String(remoteUser.uid).slice(-4)}`;
          
          setVoiceUsers(prev => {
            const exists = prev.find(u => u.uid === remoteUser.uid);
            if (exists) return prev;
            
            console.log('Yeni kullanıcı ekleniyor:', remoteUser.uid, username);
            return [...prev, {
              uid: remoteUser.uid,
              username: username,
              isMuted: false
            }];
          });
        }
      });
      
      rtcClientRef.current.on('user-unpublished', (remoteUser, mediaType) => {
        console.log('Kullanıcı yayını durdurdu:', remoteUser.uid);
        if (mediaType === 'audio') {
          setVoiceUsers(prev => prev.filter(u => u.uid !== remoteUser.uid));
          setSpeakingUsers(prev => {
            const newSet = new Set(prev);
            newSet.delete(remoteUser.uid);
            return newSet;
          });
        }
      });

      rtcClientRef.current.on('user-left', (remoteUser) => {
        console.log('Kullanıcı ayrıldı:', remoteUser.uid);
        setVoiceUsers(prev => prev.filter(u => u.uid !== remoteUser.uid));
        setSpeakingUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(remoteUser.uid);
          return newSet;
        });
      });

      rtcClientRef.current.on('volume-indicator', (volumes) => {
        const speaking = new Set();
        volumes.forEach(volume => {
          if (volume.level > 10) {
            speaking.add(volume.uid);
          }
        });
        setSpeakingUsers(speaking);
      });
      
      setTimeout(() => {
        if (rtcClientRef.current) {
          const remoteUsers = rtcClientRef.current.remoteUsers || [];
          console.log('🔍 Mevcut remote kullanıcılar kontrolü:', remoteUsers.length);
          
          if (remoteUsers.length > 0) {
            remoteUsers.forEach(remoteUser => {
              console.log('👤 Remote user bulundu:', remoteUser.uid);
              
              if (remoteUser.hasAudio && remoteUser.audioTrack) {
                console.log('🔊 Remote user audio track mevcut, oynatılıyor');
                remoteUser.audioTrack.play();
              }
              
              setVoiceUsers(prev => {
                const exists = prev.find(u => u.uid === remoteUser.uid);
                if (exists) {
                  console.log('ℹ️ User zaten listede:', remoteUser.uid);
                  return prev;
                }
                console.log('➕ User listeye ekleniyor:', remoteUser.uid);
                return [...prev, {
                  uid: remoteUser.uid,
                  username: `Kullanıcı ${String(remoteUser.uid).slice(-4)}`,
                  isMuted: false
                }];
              });
            });
          } else {
            console.log('ℹ️ Henüz remote kullanıcı yok, bekleniyor...');
          }
        }
      }, 1500);
      
      console.log('✅ Sesli aramaya başarıyla katıldı');
      
    } catch (error) {
      console.error('Ses araması başarısız:', error);
      alert('Ses araması başarısız. Mikrofon izinlerini kontrol edin ve tekrar deneyin.');
      setInVoiceCall(false);
    }
  };

  const leaveVoiceCall = async () => {
    try {
      if (audioTrackRef.current) {
        audioTrackRef.current.close();
        audioTrackRef.current = null;
      }
      
      if (rtcClientRef.current) {
        await rtcClientRef.current.leave();
        rtcClientRef.current = null;
      }
      
      setInVoiceCall(false);
      setVoiceUsers([]);
      setSpeakingUsers(new Set());
      setIsMuted(false);
      setIsDeafened(false);
      
      console.log('Sesli aramadan ayrıldı');
    } catch (error) {
      console.error('Ses araması kapatılamadı:', error);
    }
  };

  const toggleMute = () => {
    if (audioTrackRef.current) {
      const newMutedState = !isMuted;
      audioTrackRef.current.setEnabled(!newMutedState);
      setIsMuted(newMutedState);
      
      setVoiceUsers(prev => prev.map(u => 
        u.uid === myUid ? { ...u, isMuted: newMutedState } : u
      ));
      
      console.log(newMutedState ? 'Mikrofon kapatıldı' : 'Mikrofon açıldı');
    }
  };

  const toggleDeafen = () => {
    const newDeafenedState = !isDeafened;
    setIsDeafened(newDeafenedState);
    
    if (newDeafenedState && !isMuted) {
      toggleMute();
    }
    
    if (rtcClientRef.current && rtcClientRef.current.remoteUsers) {
      rtcClientRef.current.remoteUsers.forEach(remoteUser => {
        if (remoteUser.audioTrack) {
          remoteUser.audioTrack.setVolume(newDeafenedState ? 0 : 100);
        }
      });
    }
    
    console.log(newDeafenedState ? 'Ses kapatıldı' : 'Ses açıldı');
  };

  const groupedChannels = channels.reduce((acc, channel) => {
    if (!acc[channel.category]) {
      acc[channel.category] = [];
    }
    acc[channel.category].push(channel);
    return acc;
  }, {});

  return (
    <div className="h-screen flex bg-gray-900 overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:relative inset-y-0 left-0 z-50
        w-64 bg-gray-800 flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-3 sm:p-4 border-b border-gray-700 flex items-center justify-between">
          <h1 className="text-lg sm:text-xl font-bold text-white">Destek Topluluğu</h1>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 sm:p-3">
          {Object.entries(groupedChannels).map(([category, categoryChannels]) => (
            <div key={category} className="mb-3 sm:mb-4">
              <h3 className="text-xs font-semibold text-gray-400 uppercase mb-2 px-2">
                {category}
              </h3>
              {categoryChannels.map((channel) => (
                <button
                  key={channel.id || channel._id}
                  onClick={() => setActiveChannel(channel)}
                  className={`w-full flex items-center px-2 py-2 rounded mb-1 transition ${
                    (activeChannel?.id || activeChannel?._id) === (channel.id || channel._id)
                      ? 'bg-gray-700 text-white'
                      : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  <Hash className="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0" />
                  <span className="text-xs sm:text-sm font-medium truncate">{channel.name}</span>
                </button>
              ))}
            </div>
          ))}
        </div>

        {/* Voice Users Section */}
        {inVoiceCall && (
          <div className="border-t border-gray-700 p-2 sm:p-3 max-h-48 sm:max-h-64 overflow-y-auto">
            <h3 className="text-xs font-semibold text-gray-400 uppercase mb-2">
              Sesli Sohbet ({voiceUsers.length})
            </h3>
            {voiceUsers.length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-2">Kullanıcılar yükleniyor...</p>
            ) : (
              <div className="space-y-2">
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
            )}
          </div>
        )}

        {/* User Panel */}
        <div className="p-2 sm:p-3 border-t border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center min-w-0 flex-1">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-indigo-600 flex items-center justify-center mr-2 flex-shrink-0">
                <User className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-white truncate">
                  {user.displayName || user.email.split('@')[0]}
                </p>
                <p className="text-xs text-gray-400">
                  {user.isAnonymous ? 'Anonim' : 'Görünür'}
                </p>
              </div>
            </div>
            <div className="flex gap-1 flex-shrink-0">
              <button
                onClick={() => setShowProfile(true)}
                className="p-1.5 rounded hover:bg-gray-700 text-gray-400 hover:text-white"
              >
                <Settings className="w-3 h-3 sm:w-4 sm:h-4" />
              </button>
              <button
                onClick={onLogout}
                className="p-1.5 rounded hover:bg-gray-700 text-gray-400 hover:text-white"
              >
                <LogOut className="w-3 h-3 sm:w-4 sm:h-4" />
              </button>
            </div>
          </div>

          {/* Voice Controls */}
          {inVoiceCall && (
            <div className="flex gap-1 sm:gap-2 justify-center">
              <button
                onClick={toggleMute}
                className={`p-1.5 sm:p-2 rounded transition ${
                  isMuted ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-700 hover:bg-gray-600'
                }`}
                title={isMuted ? 'Mikrofonu Aç' : 'Mikrofonu Kapat'}
              >
                {isMuted ? <MicOff className="w-3 h-3 sm:w-4 sm:h-4 text-white" /> : <Mic className="w-3 h-3 sm:w-4 sm:h-4 text-white" />}
              </button>
              <button
                onClick={toggleDeafen}
                className={`p-1.5 sm:p-2 rounded transition ${
                  isDeafened ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-700 hover:bg-gray-600'
                }`}
                title={isDeafened ? 'Sesi Aç' : 'Sesi Kapat'}
              >
                {isDeafened ? <VolumeX className="w-3 h-3 sm:w-4 sm:h-4 text-white" /> : <Volume2 className="w-3 h-3 sm:w-4 sm:h-4 text-white" />}
              </button>
              <button
                onClick={leaveVoiceCall}
                className="p-1.5 sm:p-2 rounded bg-red-600 hover:bg-red-700 transition"
                title="Aramadan Ayrıl"
              >
                <PhoneOff className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Channel Header */}
        <div className="h-12 sm:h-14 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-3 sm:px-4">
          <div className="flex items-center min-w-0 flex-1">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden mr-2 text-gray-400 hover:text-white flex-shrink-0"
            >
              <Menu className="w-5 h-5" />
            </button>
            <Hash className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 mr-2 flex-shrink-0" />
            <h2 className="text-white font-semibold text-sm sm:text-base truncate">{activeChannel?.name}</h2>
            {activeChannel?.description && (
              <span className="hidden md:block ml-3 text-xs sm:text-sm text-gray-400 truncate">
                {activeChannel.description}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            {!inVoiceCall ? (
              <button
                onClick={joinVoiceCall}
                className="px-2 py-1 sm:px-4 sm:py-2 rounded bg-green-600 hover:bg-green-700 text-white flex items-center gap-1 sm:gap-2 transition"
              >
                <Mic className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="text-xs sm:text-sm hidden sm:inline">Sesli Sohbete Katıl</span>
                <span className="text-xs sm:hidden">Katıl</span>
              </button>
            ) : (
              <div className="flex items-center gap-1 sm:gap-2">
                <div className="px-2 py-1 sm:px-3 sm:py-2 rounded bg-green-600 text-white flex items-center gap-1 sm:gap-2">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full animate-pulse" />
                  <span className="text-xs sm:text-sm hidden sm:inline">Sesli Sohbettesiniz</span>
                  <span className="text-xs sm:inline hidden">Bağlı</span>
                </div>
                <div className="text-xs text-gray-400 hidden lg:block">
                  ({voiceUsers.length})
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 bg-gray-900">
          {messages.length === 0 ? (
            <div className="text-center py-8">
              <Hash className="w-10 h-10 sm:w-12 sm:h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 text-sm sm:text-base">Henüz mesaj yok. Konuşmaya başla!</p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {messages.map((msg) => (
                <div key={msg._id || msg.id} className="flex items-start">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-indigo-600 flex items-center justify-center mr-2 sm:mr-3 flex-shrink-0">
                    <span className="text-white font-semibold text-xs sm:text-sm">
                      {msg.username?.[0]?.toUpperCase() || '?'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-white font-semibold text-xs sm:text-sm truncate">
                        {msg.isAnonymous ? 'Anonim' : msg.username}
                      </span>
                      <span className="text-xs text-gray-500 flex-shrink-0">
                        {new Date(msg.createdAt || msg.timestamp).toLocaleTimeString('tr-TR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <p className="text-gray-300 text-xs sm:text-sm break-words">{msg.text}</p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Message Input */}
        <div className="p-2 sm:p-4 bg-gray-800">
          <div className="flex items-center bg-gray-700 rounded-lg px-3 sm:px-4 py-2 sm:py-3">
            <input
              type="text"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder={`#${activeChannel?.name} kanalına yazın`}
              className="flex-1 bg-transparent text-white placeholder-gray-400 outline-none text-sm sm:text-base"
            />
            <button
              onClick={handleSendMessage}
              disabled={!messageInput.trim()}
              className="ml-2 sm:ml-3 p-1.5 sm:p-2 rounded bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex-shrink-0"
            >
              <Send className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Profile Panel */}
      {showProfile && (
        <ProfilePanel
          user={{
            ...user,
            assessmentScore: user.assessmentScore,
            assessmentPercentage: user.assessmentPercentage
          }}
          onClose={() => setShowProfile(false)}
          onUpdate={onProfileUpdate}
        />
      )}
    </div>
  );
}

export default ChatView;