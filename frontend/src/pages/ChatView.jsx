// ChatView.jsx - FINAL VERSION - All bugs fixed
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Send, Hash, Settings, LogOut, Mic, MicOff, PhoneOff, Volume2, VolumeX, Menu, X, ChevronUp, ChevronDown, Signal } from 'lucide-react';
import { API, AgoraRTC, AgoraRTM } from '../App';

// Profile Panel Component
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
      console.error('Profile update failed:', error);
      alert('Profil güncellenemedi.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
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
              className="w-full px-4 py-3 rounded-lg bg-gray-900 text-white border border-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="Görünen adınız"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Biyografi</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-gray-900 text-white border border-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
              rows="3"
              placeholder="Kendinizden bahsedin..."
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-200">Anonim Mod</p>
              <p className="text-xs text-gray-400">İsminiz gizlenir</p>
            </div>
            <button
              onClick={() => setIsAnonymous(!isAnonymous)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                isAnonymous ? 'bg-indigo-600' : 'bg-gray-600'
              }`}
            >
              <span className={`inline-block h-4 w-4 rounded-full bg-white transition ${
                isAnonymous ? 'translate-x-6' : 'translate-x-1'
              }`} />
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
              />
            </div>
            <p className="text-xs text-gray-400 mt-2 text-right">{testScore}/16 Puan</p>
          </div>
        </div>

        <div className="flex gap-3 mt-8">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-lg bg-gray-700 text-white hover:bg-gray-600 transition">
            İptal
          </button>
          <button onClick={handleSave} className="flex-1 px-4 py-2.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition">
            Kaydet
          </button>
        </div>
      </div>
    </div>
  );
}

// Voice User Card
const VoiceUserCard = React.memo(({ username, isSpeaking, isMuted }) => {
  return (
    <div className={`flex items-center gap-3 p-2 rounded-lg transition ${isSpeaking ? 'bg-gray-700/80 border-l-2 border-green-500' : 'hover:bg-gray-700/50'}`}>
      <div className="relative">
        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shadow-sm transition ${
          isSpeaking ? 'bg-green-600 ring-2 ring-green-400 scale-105' : 'bg-indigo-600'
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
        <p className="text-white text-sm font-medium truncate">{username}</p>
        <span className={`text-xs ${isSpeaking ? 'text-green-400' : 'text-gray-500'}`}>
          {isSpeaking ? 'Konuşuyor' : 'Bağlı'}
        </span>
      </div>
    </div>
  );
});

// Mobile Voice Bar
function MobileVoiceBar({ isOpen, activeChannel, voiceUsers, isMuted, isDeafened, toggleMute, toggleDeafen, leaveVoiceCall }) {
  const [expanded, setExpanded] = useState(false);
  
  if (!isOpen) return null;

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 shadow-xl z-40">
      <div className="flex items-center justify-between px-4 py-4 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center gap-3 flex-1">
          <div className="bg-green-500/20 p-2 rounded-full">
            <Signal className="w-5 h-5 text-green-500 animate-pulse" />
          </div>
          <div className="flex-1">
            <p className="text-white font-medium text-sm">Sesli Sohbet</p>
            <p className="text-green-400 text-xs">{voiceUsers.length} kişi • {activeChannel?.name}</p>
          </div>
        </div>
        <button onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }} className="text-gray-400 p-2">
          {expanded ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
        </button>
      </div>

      {expanded && (
        <div className="px-4 pb-4">
           <div className="max-h-32 overflow-y-auto mb-4 bg-gray-900/50 rounded-lg p-2 space-y-1">
             {voiceUsers.map(u => (
               <div key={u.uid} className="flex items-center gap-2 text-white text-sm p-2 rounded">
                 <div className={`w-2 h-2 rounded-full ${u.isSpeaking ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
                 <span className="flex-1 truncate">{u.username}</span>
                 {u.isMuted && <MicOff size={14} className="text-red-400" />}
               </div>
             ))}
           </div>
           
           <div className="grid grid-cols-3 gap-3">
            <button onClick={toggleMute} className={`flex flex-col items-center gap-2 p-4 rounded-xl ${isMuted ? 'bg-red-600' : 'bg-gray-700'}`}>
              {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
              <span className="text-xs text-white">{isMuted ? 'Aç' : 'Kapat'}</span>
            </button>
            
            <button onClick={toggleDeafen} className={`flex flex-col items-center gap-2 p-4 rounded-xl ${isDeafened ? 'bg-red-600' : 'bg-gray-700'}`}>
              {isDeafened ? <VolumeX size={24} /> : <Volume2 size={24} />}
              <span className="text-xs text-white">{isDeafened ? 'Duy' : 'Sustur'}</span>
            </button>
            
            <button onClick={leaveVoiceCall} className="flex flex-col items-center gap-2 p-4 rounded-xl bg-red-600">
              <PhoneOff size={24} />
              <span className="text-xs text-white">Ayrıl</span>
            </button>
           </div>
        </div>
      )}
    </div>
  );
}

// Main ChatView Component
function ChatView({ user, channels, onLogout, onProfileUpdate }) {
  const [activeChannel, setActiveChannel] = useState(() => channels?.[0] || null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [showProfile, setShowProfile] = useState(false);
  
  // Voice State
  const [inVoiceCall, setInVoiceCall] = useState(false);
  const [connectionState, setConnectionState] = useState('DISCONNECTED');
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [voiceUsers, setVoiceUsers] = useState([]);
  const [speakingUsers, setSpeakingUsers] = useState(new Set());
  
  // UI State
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Refs
  const messagesEndRef = useRef(null);
  const rtcClientRef = useRef(null);
  const audioTrackRef = useRef(null);
  const messagePollingRef = useRef(null);
  const userCacheRef = useRef({});
  const rtmInitializedRef = useRef(false);

  // Update active channel if channels change
  useEffect(() => {
    if (channels?.length > 0 && !activeChannel) {
      setActiveChannel(channels[0]);
    }
  }, [channels]);

  // 🔥 FIXED: RTM initialization - ONCE per app lifecycle
  useEffect(() => {
    const initRTM = async () => {
      if (rtmInitializedRef.current) return;
      
      try {
        const tokenData = await API.getAgoraToken();
        await AgoraRTM.initialize(tokenData.appId, tokenData.userId, tokenData.token);
        rtmInitializedRef.current = true;
        console.log('✅ RTM initialized globally');
      } catch (error) {
        console.warn('⚠️ RTM init failed:', error.message);
      }
    };

    initRTM();
  }, []);

  // Channel-specific RTM join
  useEffect(() => {
    if (!activeChannel || !rtmInitializedRef.current) return;
    
    const channelName = activeChannel.name;
    
    const joinRTMChannel = async () => {
      try {
        await AgoraRTM.joinChannel(channelName);
        
        // Set message callback for this channel
        AgoraRTM.onMessage(channelName, (msg) => {
          // Optionally update messages in real-time
          console.log('📨 RTM message:', msg.text);
        });
      } catch (error) {
        console.warn('⚠️ RTM channel join failed:', error.message);
      }
    };

    joinRTMChannel();
    
    // Cleanup - leave channel when switching
    return () => {
      AgoraRTM.leaveChannel(channelName);
    };
  }, [activeChannel]);

  // Message loading & polling
  useEffect(() => {
    if (!activeChannel) return;
    
    const channelId = activeChannel.id || activeChannel._id;
    loadMessages(channelId);
    startMessagePolling(channelId);
    setSidebarOpen(false);

    return () => stopMessagePolling();
  }, [activeChannel]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      leaveVoiceCall();
    };
  }, []);

  const startMessagePolling = useCallback((channelId) => {
    stopMessagePolling();
    messagePollingRef.current = setInterval(async () => {
      try {
        const msgs = await API.getMessages(channelId);
        setMessages(msgs);
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 5000);
  }, []);

  const stopMessagePolling = useCallback(() => {
    if (messagePollingRef.current) {
      clearInterval(messagePollingRef.current);
      messagePollingRef.current = null;
    }
  }, []);

  const loadMessages = useCallback(async (channelId) => {
    try {
      const msgs = await API.getMessages(channelId);
      setMessages(msgs);
    } catch (error) {
      console.error('Load messages error:', error);
    }
  }, []);

  const handleSendMessage = useCallback(async () => {
    if (!messageInput.trim() || !activeChannel) return;

    const tempId = `temp-${Date.now()}`;
    const optimisticMessage = {
      _id: tempId,
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
      
      // Try RTM send (optional)
      try {
        await AgoraRTM.sendMessage(activeChannel.name, currentInput);
      } catch (e) { /* ignore */ }
    } catch (error) {
      console.error('Send message error:', error);
      alert('Mesaj gönderilemedi.');
      setMessages(prev => prev.filter(m => m._id !== tempId));
      setMessageInput(currentInput);
    }
  }, [messageInput, activeChannel, user]);

  const fetchUsernameByUid = useCallback(async (uid) => {
    try {
      const response = await API.getUsernameByUid(uid);
      if (response?.username) {
        userCacheRef.current[uid] = response.username;
        return response.username;
      }
    } catch (error) {
      console.error('Fetch username error:', uid, error);
    }
    return `Misafir ${String(uid).slice(-4)}`;
  }, []);

  // 🔥🔥🔥 COMPLETELY FIXED Voice Call
  const joinVoiceCall = useCallback(async () => {
    if (connectionState !== 'DISCONNECTED') return;
    
    try {
      setConnectionState('CONNECTING');
      const channelName = `voice-${activeChannel.name}`;
      
      console.log('🎤 Joining voice:', channelName);
      
      const tokenData = await API.getAgoraRtcToken(channelName);
      console.log('✅ Token received, UID:', tokenData.uid);

      // 🎯 Cache all existing users
      if (tokenData.channelUsers?.length > 0) {
        console.log(`📥 Caching ${tokenData.channelUsers.length} users`);
        tokenData.channelUsers.forEach(u => {
          if (u.uid && u.username) {
            userCacheRef.current[u.uid] = u.username;
          }
        });
      }
      
      if (!rtcClientRef.current) {
        rtcClientRef.current = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
      }

      const client = rtcClientRef.current;
      client.removeAllListeners();

      // Event listeners
      client.on('user-published', async (remoteUser, mediaType) => {
        console.log('🎤 User published:', remoteUser.uid);
        try {
          await client.subscribe(remoteUser, mediaType);
          
          if (mediaType === 'audio') {
            remoteUser.audioTrack.play();
            
            let username = userCacheRef.current[remoteUser.uid];
            if (!username) {
              username = await fetchUsernameByUid(remoteUser.uid);
            }
            
            updateVoiceUser(remoteUser.uid, { isMuted: false, username });
          }
        } catch (error) {
          console.error('Subscribe error:', error);
        }
      });

      client.on('user-unpublished', (remoteUser, mediaType) => {
        if (mediaType === 'audio') {
          updateVoiceUser(remoteUser.uid, { isMuted: true });
        }
      });

      client.on('user-joined', async (remoteUser) => {
        console.log('👋 User joined:', remoteUser.uid);
        
        let username = userCacheRef.current[remoteUser.uid];
        if (!username) {
          username = await fetchUsernameByUid(remoteUser.uid);
        }
        
        updateVoiceUser(remoteUser.uid, { isMuted: true, username });
      });

      client.on('user-left', (remoteUser) => {
        console.log('👋 User left:', remoteUser.uid);
        removeVoiceUser(remoteUser.uid);
      });

      client.on('volume-indicator', (volumes) => {
        const speaking = new Set();
        volumes.forEach(v => {
          if (v.level > 5) speaking.add(v.uid);
        });
        setSpeakingUsers(speaking);
      });

      // Join channel
      const uid = await client.join(tokenData.appId, channelName, tokenData.token, tokenData.uid);
      console.log('✅ Joined, UID:', uid);

      // Create audio track
      audioTrackRef.current = await AgoraRTC.createMicrophoneAudioTrack({
        encoderConfig: 'speech_standard',
        AEC: true, 
        ANS: true, 
        AGC: true
      });
      
      await client.publish([audioTrackRef.current]);
      client.enableAudioVolumeIndicator();
      console.log('✅ Audio published');

      // Build participant list
      const participants = [];
      
      // Add self
      const myUsername = tokenData.username || user.displayName || user.email.split('@')[0];
      userCacheRef.current[uid] = myUsername;
      participants.push({ uid, username: myUsername, isMuted: false, isLocal: true });

      // Add existing users from backend
      if (tokenData.channelUsers) {
        for (const existingUser of tokenData.channelUsers) {
          if (existingUser.uid === uid) continue;
          
          const username = existingUser.username || userCacheRef.current[existingUser.uid] || `User ${existingUser.uid}`;
          participants.push({ uid: existingUser.uid, username, isMuted: true, isLocal: false });
        }
      }

      // Wait and check for remote users
      await new Promise(resolve => setTimeout(resolve, 500));
      
      for (const remoteUser of client.remoteUsers) {
        if (participants.find(p => p.uid === remoteUser.uid)) continue;
        
        let username = userCacheRef.current[remoteUser.uid];
        if (!username) {
          username = await fetchUsernameByUid(remoteUser.uid);
        }
        
        participants.push({ uid: remoteUser.uid, username, isMuted: !remoteUser.hasAudio, isLocal: false });
        
        if (remoteUser.hasAudio && remoteUser.audioTrack) {
          try {
            await client.subscribe(remoteUser, 'audio');
            remoteUser.audioTrack.play();
          } catch (e) { /* ignore */ }
        }
      }

      console.log(`🎉 Total participants: ${participants.length}`);
      setVoiceUsers(participants);
      setInVoiceCall(true);
      setConnectionState('CONNECTED');

    } catch (error) {
      console.error('❌ Voice call error:', error);
      alert('Sesli sohbete bağlanılamadı.');
      setConnectionState('DISCONNECTED');
      leaveVoiceCall();
    }
  }, [connectionState, activeChannel, user, fetchUsernameByUid]);

  const leaveVoiceCall = useCallback(async () => {
    try {
      if (audioTrackRef.current) {
        audioTrackRef.current.close();
        audioTrackRef.current = null;
      }
      
      if (rtcClientRef.current) {
        rtcClientRef.current.removeAllListeners();
        await rtcClientRef.current.leave();
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
  }, []);

  const updateVoiceUser = useCallback((uid, data = {}) => {
    setVoiceUsers(prev => {
      const existing = prev.find(u => u.uid === uid);
      const username = data.username || existing?.username || userCacheRef.current[uid] || `Misafir ${uid}`;

      if (existing) {
        return prev.map(u => u.uid === uid ? { ...u, ...data, username } : u);
      } else {
        return [...prev, { uid, username, isMuted: false, ...data }];
      }
    });
  }, []);
  
  const removeVoiceUser = useCallback((uid) => {
    setVoiceUsers(prev => prev.filter(u => u.uid !== uid));
    setSpeakingUsers(prev => {
      const next = new Set(prev);
      next.delete(uid);
      return next;
    });
  }, []);

  const toggleMute = useCallback(async () => {
    if (audioTrackRef.current) {
      await audioTrackRef.current.setMuted(!isMuted);
      setIsMuted(!isMuted);
    }
  }, [isMuted]);

  const toggleDeafen = useCallback(() => {
    const newState = !isDeafened;
    setIsDeafened(newState);
    
    if (rtcClientRef.current) {
      rtcClientRef.current.remoteUsers.forEach(user => {
        if (user.audioTrack) {
          user.audioTrack.setVolume(newState ? 0 : 100);
        }
      });
    }
  }, [isDeafened]);

  const groupedChannels = useMemo(() => {
    return channels.reduce((acc, channel) => {
      if (!acc[channel.category]) acc[channel.category] = [];
      acc[channel.category].push(channel);
      return acc;
    }, {});
  }, [channels]);

  return (
    <div className="h-screen flex bg-gray-900 overflow-hidden">
      
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* SIDEBAR */}
      <div className={`fixed lg:relative inset-y-0 left-0 z-50 w-72 bg-gray-800 flex flex-col border-r border-gray-700 transform transition-transform ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-gray-700">
          <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            Destek Topluluğu
          </h1>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {Object.entries(groupedChannels).map(([category, categoryChannels]) => (
            <div key={category} className="mb-6">
              <h3 className="text-xs font-bold text-gray-500 uppercase mb-2 px-2">{category}</h3>
              <div className="space-y-0.5">
                {categoryChannels.map((channel) => {
                  const isActive = (activeChannel?.id || activeChannel?._id) === (channel.id || channel._id);
                  return (
                    <button
                      key={channel.id || channel._id}
                      onClick={() => setActiveChannel(channel)}
                      className={`w-full flex items-center px-3 py-2 rounded-lg transition ${
                        isActive ? 'bg-indigo-600/10 text-white border border-indigo-600/20' : 'text-gray-400 hover:bg-gray-700/50'
                      }`}
                    >
                      <Hash size={18} className={`mr-2.5 ${isActive ? 'text-indigo-400' : 'text-gray-500'}`} />
                      <span className="text-sm font-medium truncate">{channel.name}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {inVoiceCall && (
          <div className="hidden lg:block bg-gray-900/50 border-t border-gray-700">
            <div className="p-3 border-b border-gray-700/50 flex items-center justify-between">
              <div className="flex items-center gap-2 text-green-400">
                 <Signal size={16} className="animate-pulse"/>
                 <span className="text-xs font-bold uppercase">Ses Bağlantısı</span>
              </div>
              <span className="text-xs text-gray-500">{activeChannel?.name}</span>
            </div>
            
            <div className="p-2 max-h-48 overflow-y-auto space-y-1">
               {voiceUsers.map((voiceUser) => (
                 <VoiceUserCard
                   key={voiceUser.uid}
                   username={voiceUser.username}
                   isSpeaking={speakingUsers.has(voiceUser.uid)}
                   isMuted={voiceUser.isMuted}
                 />
               ))}
            </div>

            <div className="p-3 grid grid-cols-3 gap-2">
              <button onClick={toggleMute} className={`p-2 rounded-lg flex justify-center items-center ${isMuted ? 'bg-red-600' : 'bg-gray-700'}`}>
                 {isMuted ? <MicOff size={18} /> : <Mic size={18} />}
              </button>
              <button onClick={toggleDeafen} className={`p-2 rounded-lg flex justify-center items-center ${isDeafened ? 'bg-red-600' : 'bg-gray-700'}`}>
                 {isDeafened ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>
              <button onClick={leaveVoiceCall} className="p-2 rounded-lg bg-red-600/20 hover:bg-red-600/40 text-red-500 flex justify-center items-center">
                 <PhoneOff size={18} />
              </button>
            </div>
          </div>
        )}

        <div className="p-4 border-t border-gray-700">
          <div className="flex items-center gap-3">
            <div className="relative cursor-pointer" onClick={() => setShowProfile(true)}>
               <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold shadow-lg">
                  {user.displayName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase()}
               </div>
               <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-gray-800 rounded-full" />
            </div>
            <div className="flex-1 min-w-0">
               <p className="text-sm font-bold text-white truncate">{user.displayName || user.email.split('@')[0]}</p>
               <p className="text-xs text-gray-400">#{String(user.id).slice(-4)}</p>
            </div>
            <div className="flex flex-col gap-1">
              <button onClick={() => setShowProfile(true)} className="p-1.5 hover:bg-gray-700 rounded text-gray-400">
                <Settings size={16} />
              </button>
              <button onClick={onLogout} className="p-1.5 hover:bg-red-900/30 rounded text-gray-400">
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN CHAT AREA */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Header */}
        <div className="h-16 border-b border-gray-700 flex items-center justify-between px-4 sm:px-6 bg-gray-800 shadow-sm z-10">
          <div className="flex items-center min-w-0 flex-1">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden mr-3 text-gray-400">
              <Menu size={24} />
            </button>
            <Hash size={24} className="text-gray-500 mr-3" />
            <div className="min-w-0 flex-1">
              <h2 className="text-white font-bold text-base sm:text-lg truncate">
                {activeChannel?.name || 'Kanal'}
              </h2>
              {activeChannel?.description && (
                <p className="hidden sm:block text-xs text-gray-400 truncate">{activeChannel.description}</p>
              )}
            </div>
          </div>

          {!inVoiceCall ? (
             <button
               onClick={joinVoiceCall}
               disabled={connectionState === 'CONNECTING'}
               className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition disabled:opacity-50"
             >
               <Mic size={18} />
               <span className="hidden sm:inline text-sm">
                 {connectionState === 'CONNECTING' ? 'Bağlanıyor...' : 'Sesli Sohbet'}
               </span>
             </button>
          ) : (
            <div className="hidden lg:flex items-center gap-2 px-3 py-2 bg-green-900/30 border border-green-500/30 text-green-400 rounded-lg">
               <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
               <span className="text-sm">Bağlı ({voiceUsers.length})</span>
            </div>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center opacity-50">
               <Hash size={32} className="text-gray-600 mb-4" />
               <p className="text-gray-400">İlk mesajı sen gönder!</p>
            </div>
          ) : (
            messages.map((msg, i) => {
               const isSameUser = i > 0 && messages[i-1].userId === msg.userId;

               return (
                <div key={msg._id || i} className={`flex gap-3 ${isSameUser ? 'mt-1' : 'mt-4'}`}>
                  {!isSameUser ? (
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-xs sm:text-sm">
                      {msg.username?.[0]?.toUpperCase() || '?'}
                    </div>
                  ) : (
                    <div className="w-8 sm:w-10" />
                  )}
                  
                  <div className="flex-1">
                    {!isSameUser && (
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="text-white font-bold text-sm">
                          {msg.isAnonymous ? 'Anonim' : msg.username}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(msg.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    )}
                    <p className="text-gray-300 text-sm sm:text-base break-words">{msg.text}</p>
                  </div>
                </div>
               );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Mobile Voice Bar */}
        <MobileVoiceBar 
          isOpen={inVoiceCall}
          activeChannel={activeChannel}
          voiceUsers={voiceUsers}
          isMuted={isMuted}
          isDeafened={isDeafened}
          toggleMute={toggleMute}
          toggleDeafen={toggleDeafen}
          leaveVoiceCall={leaveVoiceCall}
        />

        {/* Input */}
        <div className="p-3 sm:p-4 bg-gray-800 border-t border-gray-700">
          <div className="flex items-center bg-gray-700/50 rounded-xl border border-gray-600/50">
             <input
               type="text"
               value={messageInput}
               onChange={(e) => setMessageInput(e.target.value)}
               onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
               placeholder={`#${activeChannel?.name || 'kanal'} kanalına mesaj gönder`}
               className="flex-1 bg-transparent text-white px-3 sm:px-4 py-3 outline-none placeholder-gray-500 text-sm sm:text-base"
               disabled={!activeChannel}
             />
             <button
               onClick={handleSendMessage}
               disabled={!messageInput.trim()}
               className="p-2 sm:p-2.5 m-2 bg-indigo-600 rounded-lg text-white hover:bg-indigo-700 disabled:opacity-50 disabled:bg-gray-600"
             >
               <Send size={16} />
             </button>
          </div>
        </div>
      </div>

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