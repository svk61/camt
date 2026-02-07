// ChatView.jsx - FINAL - Mobile Optimized + Fixed User Names
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { API, AgoraRTC, AgoraRTM } from '../App';
import { Send, Hash, Settings, LogOut, Mic, MicOff, PhoneOff, Volume2, VolumeX, Menu, X, ChevronUp, ChevronDown, Signal, Star } from 'lucide-react';
import RatingModal from '../components/Ratingmodal';
// --- Helper Components ---
// --- Helper Components ---

function ProfilePanel({ user, onClose, onUpdate }) {
  const [displayName, setDisplayName] = useState(user.displayName || '');
  const [bio, setBio] = useState(user.bio || '');
  const [isAnonymous, setIsAnonymous] = useState(user.isAnonymous || false);

  const [showRatingModal, setShowRatingModal] = useState(false);
  const [existingRating, setExistingRating] = useState(null);
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
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${isAnonymous ? 'bg-indigo-600' : 'bg-gray-600'
                }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out ${isAnonymous ? 'translate-x-6' : 'translate-x-1'
                  }`}
              />
            </button>
          </div>

          <div className="bg-gradient-to-r from-gray-800 to-gray-700 p-4 rounded-lg border border-gray-600">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-300 font-medium">Test Skoru</span>
              <span className={`text-sm font-bold px-2 py-0.5 rounded ${testPercentage >= 75 ? 'bg-green-500/20 text-green-400' :
                testPercentage >= 50 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'
                }`}>%{testPercentage}</span>
            </div>
            <div className="w-full bg-gray-900 rounded-full h-2.5">
              <div
                className={`h-2.5 rounded-full ${testPercentage >= 75 ? 'bg-green-500' :
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

const VoiceUserCard = React.memo(({ userId, username, isSpeaking, isMuted, isDeafened }) => {
  return (
    <div className={`flex items-center gap-3 p-2 rounded-lg transition-all ${isSpeaking ? 'bg-gray-700/80 border-l-2 border-green-500' : 'hover:bg-gray-700/50'}`}>
      <div className="relative">
        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shadow-sm transition-all ${isSpeaking ? 'bg-green-600 ring-2 ring-green-400 ring-opacity-50 scale-105' : 'bg-indigo-600'
          }`}>
          {username?.[0]?.toUpperCase() || '?'}
        </div>
        {/* Show mute or deafen icon */}
        {(isMuted || isDeafened) && (
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center ring-2 ring-gray-800">
            {isDeafened ? <VolumeX size={10} className="text-white" /> : <MicOff size={10} className="text-white" />}
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-medium truncate leading-tight">{username}</p>
        <div className="flex items-center gap-1">
          {isDeafened ? (
            <span className="text-red-400 text-xs">Sağır</span>
          ) : isSpeaking ? (
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
});

// 🔥 MOBILE OPTIMIZED Voice Bar
function MobileVoiceBar({ isOpen, activeChannel, voiceUsers, isMuted, isDeafened, toggleMute, toggleDeafen, leaveVoiceCall }) {
  const [expanded, setExpanded] = useState(false); // Default collapsed

  if (!isOpen) return null;

  return (
    <div
      className="lg:hidden fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 shadow-xl z-40 safe-area-bottom"
      style={{
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {/* Mini Bar - Always Visible - Larger tap target */}
      <div
        className="flex items-center justify-between px-4 py-4 cursor-pointer active:bg-gray-700/50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="bg-green-500/20 p-2 rounded-full flex-shrink-0">
            <Signal className="w-5 h-5 text-green-500 animate-pulse" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-white font-medium text-sm truncate">Sesli Sohbet</p>
            <p className="text-green-400 text-xs truncate">{voiceUsers.length} kişi • {activeChannel?.name}</p>
          </div>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
          className="text-gray-400 p-2 -mr-2 hover:bg-gray-700/50 rounded-lg transition-colors flex-shrink-0"
        >
          {expanded ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
        </button>
      </div>

      {/* Expanded Controls */}
      {expanded && (
        <div className="px-4 pb-4 animate-slide-down">
          {/* User List */}
          <div className="max-h-32 overflow-y-auto mb-4 bg-gray-900/50 rounded-lg p-2 space-y-1 scrollbar-thin scrollbar-thumb-gray-700">
            {voiceUsers.map(u => (
              <div key={u.uid} className="flex items-center gap-2 text-white text-sm p-2 rounded hover:bg-gray-700/50">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${u.isSpeaking ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`}></div>
                <span className="flex-1 truncate font-medium">{u.username}</span>
                {u.isMuted && <MicOff size={14} className="text-red-400 flex-shrink-0" />}
              </div>
            ))}
          </div>

          {/* Control Buttons - Larger for mobile */}
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={toggleMute}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-all active:scale-95 ${isMuted ? 'bg-red-600 text-white shadow-lg' : 'bg-gray-700 text-white hover:bg-gray-600'
                }`}
            >
              {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
              <span className="text-xs font-semibold">{isMuted ? 'Mikrofon Aç' : 'Sustur'}</span>
            </button>

            <button
              onClick={toggleDeafen}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-all active:scale-95 ${isDeafened ? 'bg-red-600 text-white shadow-lg' : 'bg-gray-700 text-white hover:bg-gray-600'
                }`}
            >
              {isDeafened ? <VolumeX size={24} /> : <Volume2 size={24} />}
              <span className="text-xs font-semibold">{isDeafened ? 'Duy' : 'Duyma'}</span>
            </button>

            <button
              onClick={leaveVoiceCall}
              className="flex flex-col items-center gap-2 p-4 rounded-xl bg-red-600 text-white hover:bg-red-700 transition-all active:scale-95 shadow-lg"
            >
              <PhoneOff size={24} />
              <span className="text-xs font-semibold">Ayrıl</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Main Component ---

function ChatView({ user, channels, onLogout, onProfileUpdate }) {
  const [activeChannel, setActiveChannel] = useState(() => {
    return channels && channels.length > 0 ? channels[0] : null;
  });

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
  const [voiceChannelUserCount, setVoiceChannelUserCount] = useState(0);

  // UI State
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [existingRating, setExistingRating] = useState(null);
  const [filterWarning, setFilterWarning] = useState(null);

  // Refs
  const messagesEndRef = useRef(null);
  const rtcClientRef = useRef(null);
  const audioTrackRef = useRef(null);
  const messagePollingRef = useRef(null);
  const userCacheRef = useRef({});
  const lastMessageCountRef = useRef(0);

  // Channels update
  useEffect(() => {
    if (channels && channels.length > 0 && !activeChannel) {
      setActiveChannel(channels[0]);
    }
  }, [channels]);
  useEffect(() => {
    loadExistingRating();
  }, []);

  // Fetch voice channel user count periodically (Discord-style preview)
  useEffect(() => {
    const fetchVoiceUserCount = async () => {
      if (!inVoiceCall) {
        try {
          const data = await API.getVoiceUsers('sesli-sohbet-1');
          setVoiceChannelUserCount(data.count || 0);
        } catch (error) {
          console.error('Failed to fetch voice users:', error);
        }
      }
    };

    fetchVoiceUserCount();
    const interval = setInterval(fetchVoiceUserCount, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, [inVoiceCall]);
  // Message Loading & Polling
  useEffect(() => {
    if (!activeChannel) return;

    const channelId = activeChannel.id || activeChannel._id;
    loadMessages(channelId);
    startMessagePolling(channelId);
    initializeRTM(activeChannel.name);
    setSidebarOpen(false);

    return () => {
      stopMessagePolling();
      cleanupRTM();
    };
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
  const loadExistingRating = async () => {
    try {
      const rating = await API.getMyRating();
      setExistingRating(rating);
    } catch (error) {
      console.log('No existing rating or error:', error);
    }
  };

  const handleSubmitRating = async (rating, comment, isAnonymous) => {
    try {
      await API.submitRating(rating, comment, isAnonymous);
      alert('Değerlendirmeniz kaydedildi! Teşekkür ederiz.');
      await loadExistingRating(); // Reload to get updated rating
    } catch (error) {
      throw error;
    }
  };
  const initializeRTM = useCallback(async (channelName) => {
    try {
      const tokenData = await API.getAgoraToken();
      await AgoraRTM.initialize(tokenData.appId, tokenData.userId, tokenData.token);
      await AgoraRTM.joinChannel(channelName);
    } catch (error) {
      console.warn('RTM Connection Warning:', error);
    }
  }, []);

  const cleanupRTM = useCallback(async () => {
    try {
      await AgoraRTM.leaveChannel();
    } catch (e) { /* ignore */ }
  }, []);

  const startMessagePolling = useCallback((channelId) => {
    stopMessagePolling();
    messagePollingRef.current = setInterval(async () => {
      try {
        const msgs = await API.getMessages(channelId);
        if (msgs.length !== lastMessageCountRef.current) {
          setMessages(msgs);
          lastMessageCountRef.current = msgs.length;
        }
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
      lastMessageCountRef.current = msgs.length;
    } catch (error) {
      console.error('Mesaj yükleme hatası:', error);
    }
  }, []);

  const handleSendMessage = useCallback(async () => {
    if (!messageInput.trim() || !activeChannel) return;

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
      // Handle content filter rejection
      if (error.message && error.message.includes('filtered')) {
        setFilterWarning(error.details?.message || 'Mesajınız uygunsuz içerik içeriyor. Lütfen topluluk kurallarına uyun.');
        setTimeout(() => setFilterWarning(null), 5000); // Clear after 5 seconds
      } else {
        alert('Mesaj gönderilemedi.');
      }
      setMessages(prev => prev.filter(m => m._id !== tempId));
      setMessageInput(currentInput);
    }
  }, [messageInput, activeChannel, user]);

  // 🔥 CRITICAL FIX: Fetch username from backend when unknown
  const fetchUsernameByUid = useCallback(async (uid) => {
    try {
      const response = await API.getUsernameByUid(uid);
      if (response && response.username) {
        userCacheRef.current[uid] = response.username;
        return response.username;
      }
    } catch (error) {
      console.error('Failed to fetch username for UID:', uid, error);
    }
    return `Misafir ${String(uid).slice(-4)}`;
  }, []);

  // 🔥 FIXED: Voice Call with realtime username lookup
  const joinVoiceCall = useCallback(async () => {
    if (connectionState === 'CONNECTING' || connectionState === 'CONNECTED') return;

    try {
      setConnectionState('CONNECTING');
      // Use a fixed voice channel name - separate from text channels
      const channelName = 'sesli-sohbet-1';

      const tokenData = await API.getAgoraRtcToken(channelName);

      // 🎯 Cache ALL users from backend
      if (tokenData.channelUsers && Array.isArray(tokenData.channelUsers)) {
        console.log('📥 Caching channel users:', tokenData.channelUsers);
        tokenData.channelUsers.forEach(u => {
          if (u.uid && u.username) {
            userCacheRef.current[u.uid] = u.username;
            console.log(`✅ Cached: UID ${u.uid} → ${u.username}`);
          }
        });
      }

      if (!rtcClientRef.current) {
        rtcClientRef.current = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
      }

      const client = rtcClientRef.current;
      client.removeAllListeners();

      // Event Listeners
      // Event Listeners
      client.on('user-published', async (remoteUser, mediaType) => {
        console.log('🎤 User published:', remoteUser.uid, mediaType);

        if (mediaType === 'audio') {
          try {
            await client.subscribe(remoteUser, mediaType);
            console.log('✅ Subscribed to user:', remoteUser.uid);

            remoteUser.audioTrack.play();

            // 🔥 FIX: Try to get username, fetch from backend if not cached
            let username = userCacheRef.current[remoteUser.uid];
            if (!username) {
              console.log('⚠️ Username not cached for UID:', remoteUser.uid, '- fetching from backend...');
              username = await fetchUsernameByUid(remoteUser.uid);
            }

            updateVoiceUser(remoteUser.uid, { isMuted: false, username, hasAudio: true });
          } catch (error) {
            console.error('Subscribe error:', error);
          }
        }
      });

      client.on('user-unpublished', (remoteUser, mediaType) => {
        console.log('🔇 User unpublished:', remoteUser.uid, mediaType);
        if (mediaType === 'audio') {
          updateVoiceUser(remoteUser.uid, { isMuted: true });
        }
      });

      client.on('user-joined', async (remoteUser) => {
        console.log('👋 User joined:', remoteUser.uid);

        // 🔥 FIX: Immediately fetch username from backend
        let username = userCacheRef.current[remoteUser.uid];
        if (!username) {
          console.log('⚠️ Username not cached for joined user:', remoteUser.uid, '- fetching...');
          username = await fetchUsernameByUid(remoteUser.uid);
        }

        // Don't mark as muted initially, wait for publish state or default to muted
        // But add to list so we see them
        addVoiceUser({
          uid: remoteUser.uid,
          username: username,
          isMuted: true, // Default to muted until they publish audio
          isLocal: false
        });
      });

      client.on('user-left', (remoteUser) => {
        console.log('👋 User left:', remoteUser.uid);
        removeVoiceUser(remoteUser.uid);
      });

      client.on('volume-indicator', (volumes) => {
        const speaking = new Set();
        volumes.forEach(v => {
          // Increase threshold to 15 to avoid false positives
          if (v.level > 15) speaking.add(v.uid);
        });
        setSpeakingUsers(speaking);
      });

      client.on('connection-state-change', (curState, prevState) => {
        console.log('Agora State:', prevState, '->', curState);
        setConnectionState(curState);
        if (curState === 'DISCONNECTED' && inVoiceCall) {
          leaveVoiceCall();
        }
      });

      // Join channel
      const uid = await client.join(tokenData.appId, channelName, tokenData.token, tokenData.uid);
      console.log('✅ Joined channel with UID:', uid);

      // Create and publish audio track
      audioTrackRef.current = await AgoraRTC.createMicrophoneAudioTrack({
        encoderConfig: 'speech_standard',
        AEC: true,
        ANS: true,
        AGC: true
      });

      await client.publish([audioTrackRef.current]);
      client.enableAudioVolumeIndicator();

      // Add self to list
      const myUsername = tokenData.username || user.displayName || user.email.split('@')[0];
      const myUid = tokenData.uid || uid; // Use the UID from token if available

      userCacheRef.current[myUid] = myUsername;

      // Clear existing list and rebuild to avoid duplicates
      const initialVoiceUsers = [];

      // Add self
      initialVoiceUsers.push({
        uid: myUid,
        username: myUsername,
        isMuted: false,
        isLocal: true
      });

      // 🔥 Process existing remote users from backend list FIRST
      if (tokenData.channelUsers && Array.isArray(tokenData.channelUsers)) {
        tokenData.channelUsers.forEach(u => {
          if (u.uid !== myUid && !initialVoiceUsers.find(Existing => Existing.uid === u.uid)) {
            initialVoiceUsers.push({
              uid: u.uid,
              username: u.username,
              isMuted: true, // Assume muted until proven otherwise via Agora event
              isLocal: false
            });
          }
        });
      }

      setVoiceUsers(initialVoiceUsers);

      // 🔥 Then process active Agora remote users to update status
      await new Promise(resolve => setTimeout(resolve, 500));

      console.log('👥 Processing existing remote users:', client.remoteUsers.length);
      for (const remoteUser of client.remoteUsers) {
        console.log('Processing:', remoteUser.uid);

        // Try to get username
        let username = userCacheRef.current[remoteUser.uid];
        if (!username) {
          console.log('⚠️ Fetching username for existing user:', remoteUser.uid);
          username = await fetchUsernameByUid(remoteUser.uid);
        }

        updateVoiceUser(remoteUser.uid, {
          isMuted: !remoteUser.hasAudio,
          username,
          hasAudio: remoteUser.hasAudio
        });

        if (remoteUser.hasAudio) {
          try {
            await client.subscribe(remoteUser, 'audio');
            if (remoteUser.audioTrack) {
              remoteUser.audioTrack.play();
              console.log('✅ Subscribed to existing user:', remoteUser.uid);
            }
            updateVoiceUser(remoteUser.uid, { isMuted: false, username, hasAudio: true });
          } catch (error) {
            console.error('Error subscribing to existing user:', remoteUser.uid, error);
          }
        }
      }

      setInVoiceCall(true);
      setConnectionState('CONNECTED');
      console.log('🎉 Voice call setup complete. Total users:', client.remoteUsers.length + 1);

    } catch (error) {
      console.error('Ses bağlantı hatası:', error);
      alert('Sesli sohbete bağlanılamadı. Lütfen mikrofon izinlerini kontrol edin.');
      setConnectionState('DISCONNECTED');
      leaveVoiceCall();
    }
  }, [connectionState, activeChannel, user, inVoiceCall, fetchUsernameByUid]);

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
      const existingIndex = prev.findIndex(u => u.uid === uid);

      // Use provided username or cached username
      let username = data.username || (existingIndex >= 0 ? prev[existingIndex].username : null) || userCacheRef.current[uid];

      if (!username && data.username === undefined) {
        // Only fallback if we don't have a username AND none was provided
        // If data.username is explicitly passed (even empty?), we might want to respect it, but usually it's correct.
      } else if (!username) {
        username = `Misafir ${String(uid).slice(-4)}`;
      }

      if (existingIndex >= 0) {
        const newUsers = [...prev];
        newUsers[existingIndex] = { ...newUsers[existingIndex], ...data, username: username || newUsers[existingIndex].username };
        return newUsers;
      } else {
        return [...prev, { uid, username: username || `Misafir ${String(uid).slice(-4)}`, isMuted: false, ...data }];
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

  const addVoiceUser = useCallback((userObj) => {
    setVoiceUsers(prev => {
      if (prev.find(u => u.uid === userObj.uid)) return prev;
      return [...prev, userObj];
    });
  }, []);

  const toggleMute = useCallback(async () => {
    if (audioTrackRef.current) {
      const newState = !isMuted;
      await audioTrackRef.current.setMuted(newState);
      setIsMuted(newState);
    }
  }, [isMuted]);

  const toggleDeafen = useCallback(() => {
    const newState = !isDeafened;
    setIsDeafened(newState);
    if (newState && !isMuted) toggleMute();

    if (rtcClientRef.current) {
      rtcClientRef.current.remoteUsers.forEach(user => {
        if (user.audioTrack) {
          user.audioTrack.setVolume(newState ? 0 : 100);
        }
      });
    }
  }, [isDeafened, isMuted, toggleMute]);

  const groupedChannels = useMemo(() => {
    return channels.reduce((acc, channel) => {
      if (!acc[channel.category]) acc[channel.category] = [];
      acc[channel.category].push(channel);
      return acc;
    }, {});
  }, [channels]);

  return (
    <div className="h-screen flex bg-gray-900 overflow-hidden font-sans">

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm transition-opacity" onClick={() => setSidebarOpen(false)} />
      )}

      {/* SIDEBAR */}
      <div className={`
        fixed lg:relative inset-y-0 left-0 z-50
        w-72 bg-gray-800 flex flex-col border-r border-gray-700
        transform transition-transform duration-300 ease-in-out shadow-2xl
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-gray-700 bg-gray-800 flex-shrink-0">
          <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            Destek Topluluğu
          </h1>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-400 hover:text-white p-2">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {/* Voice Channels Section */}
          <div className="mb-6">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 px-2 flex items-center gap-1">
              <Volume2 size={12} />
              Sesli Kanallar
            </h3>
            <div className="space-y-0.5">
              <button
                onClick={() => {
                  if (!inVoiceCall) {
                    joinVoiceCall();
                  }
                }}
                className={`w-full flex items-center px-3 py-2 rounded-lg transition-all duration-200 group ${inVoiceCall
                  ? 'bg-green-600/20 text-green-400 border border-green-600/30'
                  : 'text-gray-400 hover:bg-gray-700/50 hover:text-gray-200'
                  }`}
              >
                <Volume2 size={18} className={`mr-2.5 flex-shrink-0 ${inVoiceCall ? 'text-green-400' : 'text-gray-500 group-hover:text-gray-400'}`} />
                <span className="text-sm font-medium">sesli-sohbet-1</span>
                {/* Always show user count (Discord-style) */}
                <div className="ml-auto flex items-center gap-1">
                  {(inVoiceCall ? voiceUsers.length : voiceChannelUserCount) > 0 && (
                    <>
                      <div className={`w-2 h-2 rounded-full ${inVoiceCall ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`}></div>
                      <span className={`text-xs ${inVoiceCall ? 'text-green-400' : 'text-gray-500'}`}>
                        {inVoiceCall ? voiceUsers.length : voiceChannelUserCount}
                      </span>
                    </>
                  )}
                </div>
              </button>
            </div>
          </div>

          {/* Text Channels */}
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
                      className={`w-full flex items-center px-3 py-2 rounded-lg transition-all duration-200 group ${isActive
                        ? 'bg-indigo-600/10 text-white shadow-sm border border-indigo-600/20'
                        : 'text-gray-400 hover:bg-gray-700/50 hover:text-gray-200'
                        }`}
                    >
                      <Hash size={18} className={`mr-2.5 flex-shrink-0 ${isActive ? 'text-indigo-400' : 'text-gray-500 group-hover:text-gray-400'}`} />
                      <span className={`text-sm font-medium truncate ${isActive ? 'text-indigo-100' : ''}`}>{channel.name}</span>
                      {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.5)] flex-shrink-0"></div>}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {inVoiceCall && (
          <div className="hidden lg:block bg-gray-900/50 border-t border-gray-700 backdrop-blur-md flex-shrink-0">
            <div className="p-3 border-b border-gray-700/50 flex items-center justify-between">
              <div className="flex items-center gap-2 text-green-400">
                <Signal size={16} className="animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wide">Ses Bağlantısı</span>
              </div>
              <span className="text-xs text-gray-500 font-mono">sesli-sohbet-1</span>
            </div>

            <div className="p-2 max-h-48 overflow-y-auto space-y-1 custom-scrollbar">
              {voiceUsers.map((voiceUser) => (
                <VoiceUserCard
                  key={voiceUser.uid}
                  userId={voiceUser.uid}
                  username={voiceUser.username}
                  isSpeaking={speakingUsers.has(voiceUser.uid)}
                  isMuted={voiceUser.isMuted}
                  isDeafened={voiceUser.isLocal && isDeafened}
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

        <div className="bg-gray-850 p-4 border-t border-gray-700 flex-shrink-0">
          {/* Rating Button - Separate Section */}
          <div className="mb-3">
            <button
              onClick={() => setShowRatingModal(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white rounded-lg transition-all shadow-lg font-medium group"
            >
              <Star className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <span className="text-sm">Sitemizi Değerlendirin</span>
            </button>
          </div>

          {/* User Info Row */}
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

      <RatingModal
        isOpen={showRatingModal}
        onClose={() => setShowRatingModal(false)}
        onSubmit={handleSubmitRating}
        existingRating={existingRating}
      />

      {/* MAIN CHAT AREA */}
      <div className="flex-1 flex flex-col min-w-0 bg-gray-900 relative">

        {/* Header - Fixed height */}
        <div className="h-16 border-b border-gray-700 flex items-center justify-between px-4 sm:px-6 bg-gray-800 shadow-sm z-10 flex-shrink-0">
          <div className="flex items-center min-w-0 flex-1">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden mr-3 text-gray-400 hover:text-white p-2">
              <Menu size={24} />
            </button>
            <Hash size={24} className="text-gray-500 mr-3 flex-shrink-0" />
            <div className="min-w-0 flex-1">
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
              disabled={connectionState === 'CONNECTING'}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition shadow-lg hover:shadow-green-500/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
            >
              <Mic size={18} />
              <span className="hidden sm:inline font-medium text-sm">
                {connectionState === 'CONNECTING' ? 'Bağlanıyor...' : 'Sesli Sohbet'}
              </span>
            </button>
          ) : (
            <div className="hidden lg:flex items-center gap-2 px-3 py-2 bg-green-900/30 border border-green-500/30 text-green-400 rounded-lg flex-shrink-0">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="font-medium text-sm">Bağlı ({voiceUsers.length})</span>
            </div>
          )}
        </div>

        {/* 🔥 MOBILE OPTIMIZED Messages - Dynamic height */}
        <div
          className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 custom-scrollbar scroll-smooth"
          style={{
            // Dynamic height calculation
            height: inVoiceCall
              ? 'calc(100vh - 4rem - 5rem - 4rem)' // header - input - voice bar (collapsed)
              : 'calc(100vh - 4rem - 5rem)', // header - input
            willChange: 'scroll-position',
          }}
        >
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
              const isSameUser = i > 0 && messages[i - 1].userId === msg.userId;
              const isSystem = msg.type === 'system';

              if (isSystem) return (
                <div key={msg._id} className="flex items-center justify-center my-4">
                  <div className="bg-gray-800/50 px-3 py-1 rounded-full border border-gray-700/50">
                    <span className="text-xs text-gray-400">{msg.text}</span>
                  </div>
                </div>
              );

              return (
                <div key={msg._id || i} className={`flex gap-3 sm:gap-4 group ${isSameUser ? 'mt-1' : 'mt-4 sm:mt-6'}`}>
                  {!isSameUser ? (
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-indigo-600 flex-shrink-0 flex items-center justify-center text-white font-bold text-xs sm:text-sm shadow-sm mt-0.5">
                      {msg.username?.[0]?.toUpperCase() || '?'}
                    </div>
                  ) : (
                    <div className="w-8 sm:w-10 flex-shrink-0" />
                  )}

                  <div className="flex-1 min-w-0">
                    {!isSameUser && (
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="text-white font-bold text-sm hover:underline cursor-pointer">
                          {msg.isAnonymous ? 'Anonim' : msg.username}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(msg.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    )}
                    <p className={`text-gray-300 leading-relaxed break-words text-sm sm:text-base ${!isSameUser ? '' : 'text-gray-300/90'}`}>
                      {msg.text}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} className="h-4" />
        </div>

        {/* Mobile Voice Bar */}
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

        {/* 🔥 MOBILE OPTIMIZED Input - Fixed position with safe area */}
        <div
          className={`p-3 sm:p-4 bg-gray-800 border-t border-gray-700 flex-shrink-0 ${filterWarning ? 'animate-shake' : ''}`}
          style={{
            paddingBottom: inVoiceCall
              ? 'calc(env(safe-area-inset-bottom) + 0.75rem)'
              : 'calc(env(safe-area-inset-bottom) + 0.75rem)',
          }}
        >
          {/* Filter Warning */}
          {filterWarning && (
            <div className="mb-3 p-3 bg-red-500/20 border border-red-500/30 rounded-lg flex items-start gap-2 animate-slide-down">
              <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <p className="text-red-300 text-sm flex-1">{filterWarning}</p>
              <button
                onClick={() => setFilterWarning(null)}
                className="text-red-400 hover:text-red-300 p-1"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          )}
          <div className={`relative flex items-center bg-gray-700/50 rounded-xl border ${filterWarning ? 'border-red-500/50 ring-1 ring-red-500/50' : 'border-gray-600/50 focus-within:border-indigo-500/50 focus-within:ring-1 focus-within:ring-indigo-500/50'} transition shadow-inner`}>
            <input
              type="text"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder={`#${activeChannel?.name || 'kanal'} kanalına mesaj gönder`}
              className="flex-1 bg-transparent text-white px-3 sm:px-4 py-3 sm:py-3.5 outline-none placeholder-gray-500 text-sm sm:text-base"
              disabled={!activeChannel}
            />
            <div className="pr-2">
              <button
                onClick={handleSendMessage}
                disabled={!messageInput.trim()}
                className="p-2 sm:p-2.5 bg-indigo-600 rounded-lg text-white hover:bg-indigo-700 disabled:opacity-50 disabled:bg-gray-600 disabled:cursor-not-allowed transition shadow-lg active:scale-95"
              >
                <Send size={16} className="sm:w-[18px] sm:h-[18px]" />
              </button>
            </div>
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

      {showRatingModal && (
        <RatingModal
          isOpen={showRatingModal}
          onClose={() => setShowRatingModal(false)}
          onSubmit={handleSubmitRating}
          existingRating={existingRating}
        />
      )}
    </div>
  );
}

export default ChatView;
