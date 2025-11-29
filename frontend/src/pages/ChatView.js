import React, { useState, useEffect, useRef } from 'react';
import { Send, Hash, User, Settings, LogOut, Mic, MicOff, PhoneOff, Search } from 'lucide-react';
import { API, AgoraRTC, AgoraRTM } from '../App';

function ProfilePanel({ user, onClose, onUpdate }) {
  const [displayName, setDisplayName] = useState(user.displayName || '');
  const [bio, setBio] = useState(user.bio || '');
  const [isAnonymous, setIsAnonymous] = useState(user.isAnonymous || false);

  // Yeni: test sonucu
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
      <div className="bg-gray-800 rounded-lg w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Profil Ayarları</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Görünen Ad</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-4 py-2 rounded bg-gray-700 text-white border border-gray-600 focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="Görünen adınız"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Biyografi</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full px-4 py-2 rounded bg-gray-700 text-white border border-gray-600 focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
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

          {/* ✅ Yeni: Test Sonucu */}
          <div className="bg-gray-700 p-4 rounded-lg border border-gray-600">
            <p className="text-sm text-gray-300 font-semibold mb-1">Test Sonucunuz</p>
            <p className="text-white text-lg font-bold mb-1">
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

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded bg-gray-700 text-white hover:bg-gray-600 transition"
          >
            İptal
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700 transition"
          >
            Kaydet
          </button>
        </div>
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
  const [voiceUsers, setVoiceUsers] = useState([]);
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
      AgoraRTM.joinChannel(activeChannel.name);
      startMessagePolling();
    }
    
    return () => stopMessagePolling();
  }, [activeChannel]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    return () => {
      if (inVoiceCall) {
        leaveVoiceCall();
      }
    };
  }, [inVoiceCall]);

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
      await AgoraRTM.sendMessage(currentInput);
    } catch (error) {
      console.error('Mesaj gönderilemedi:', error);
      setMessages(prev => prev.filter(m => m._id !== tempId));
      setMessageInput(currentInput);
      alert('Mesaj gönderilemedi. Lütfen tekrar deneyin.');
    }
  };

  const joinVoiceCall = async () => {
    try {
      const tokenData = await API.getAgoraRtcToken(`voice-${activeChannel.name}`);
      rtcClientRef.current = await AgoraRTC.createClient();
      
      await rtcClientRef.current.join(
        tokenData.appId, 
        tokenData.channelName, 
        tokenData.token, 
        user.id
      );
      
      audioTrackRef.current = await AgoraRTC.createMicrophoneAudioTrack();
      await rtcClientRef.current.publish([audioTrackRef.current]);
      
      setInVoiceCall(true);
      setVoiceUsers([user.id]);
      
      rtcClientRef.current.on('user-published', async (remoteUser, mediaType) => {
        if (mediaType === 'audio') {
          await rtcClientRef.current.subscribe(remoteUser, mediaType);
          setVoiceUsers(prev => [...prev, remoteUser.uid]);
        }
      });
      
      rtcClientRef.current.on('user-left', (remoteUser) => {
        setVoiceUsers(prev => prev.filter(id => id !== remoteUser.uid));
      });
    } catch (error) {
      console.error('Ses araması başarısız:', error);
      alert('Ses araması başarısız. Mikrofon izinlerini kontrol edin.');
    }
  };

  const leaveVoiceCall = async () => {
    try {
      if (audioTrackRef.current) {
        audioTrackRef.current.close();
      }
      if (rtcClientRef.current) {
        await rtcClientRef.current.leave();
      }
      setInVoiceCall(false);
      setVoiceUsers([]);
      setIsMuted(false);
    } catch (error) {
      console.error('Ses araması kapatılamadı:', error);
    }
  };

  const toggleMute = () => {
    if (audioTrackRef.current) {
      audioTrackRef.current.setEnabled(isMuted);
      setIsMuted(!isMuted);
    }
  };

  const groupedChannels = channels.reduce((acc, channel) => {
    if (!acc[channel.category]) {
      acc[channel.category] = [];
    }
    acc[channel.category].push(channel);
    return acc;
  }, {});

  return (
    <div className="h-screen flex bg-gray-900">
      {/* Kenar Çubuğu */}
      <div className="w-64 bg-gray-800 flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <h1 className="text-xl font-bold text-white">Destek Topluluğu</h1>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {Object.entries(groupedChannels).map(([category, categoryChannels]) => (
            <div key={category} className="mb-4">
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
                  <Hash className="w-5 h-5 mr-2" />
                  <span className="text-sm font-medium">{channel.name}</span>
                </button>
              ))}
            </div>
          ))}
        </div>

        <div className="p-3 border-t border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center mr-2">
                <User className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white truncate">
                  {user.displayName || user.email.split('@')[0]}
                </p>
                <p className="text-xs text-gray-400">
                  {user.isAnonymous ? 'Anonim' : 'Görünür'}
                </p>
              </div>
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => setShowProfile(true)}
                className="p-1.5 rounded hover:bg-gray-700 text-gray-400 hover:text-white"
              >
                <Settings className="w-4 h-4" />
              </button>
              <button
                onClick={onLogout}
                className="p-1.5 rounded hover:bg-gray-700 text-gray-400 hover:text-white"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Ana Sohbet Alanı */}
      <div className="flex-1 flex flex-col">
        {/* Kanal Başlığı */}
        <div className="h-14 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-4">
          <div className="flex items-center">
            <Hash className="w-5 h-5 text-gray-400 mr-2" />
            <h2 className="text-white font-semibold">{activeChannel?.name}</h2>
            {activeChannel?.description && (
              <span className="ml-3 text-sm text-gray-400">
                {activeChannel.description}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {!inVoiceCall ? (
              <button
                onClick={joinVoiceCall}
                className="px-4 py-2 rounded bg-green-600 hover:bg-green-700 text-white flex items-center gap-2 transition"
              >
                <Mic className="w-4 h-4" />
                <span className="text-sm">Ses Başlat</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <div className="px-3 py-2 rounded bg-green-600 text-white flex items-center gap-2">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  <span className="text-sm">{voiceUsers.length} aramada</span>
                </div>
                <button
                  onClick={toggleMute}
                  className={`p-2 rounded transition ${
                    isMuted ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                >
                  {isMuted ? <MicOff className="w-5 h-5 text-white" /> : <Mic className="w-5 h-5 text-white" />}
                </button>
                <button
                  onClick={leaveVoiceCall}
                  className="p-2 rounded bg-red-600 hover:bg-red-700 transition"
                >
                  <PhoneOff className="w-5 h-5 text-white" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mesajlar */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-900">
          {messages.length === 0 ? (
            <div className="text-center py-8">
              <Hash className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500">Henüz mesaj yok. Konuşmaya başla!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => (
                <div key={msg._id || msg.id} className="flex items-start">
                  <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center mr-3 flex-shrink-0">
                    <span className="text-white font-semibold text-sm">
                      {msg.username?.[0]?.toUpperCase() || '?'}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-white font-semibold text-sm">
                        {msg.isAnonymous ? 'Anonim' : msg.username}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(msg.createdAt || msg.timestamp).toLocaleTimeString('tr-TR')}
                      </span>
                    </div>
                    <p className="text-gray-300 text-sm">{msg.text}</p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Mesaj Giriş */}
        <div className="p-4 bg-gray-800">
          <div className="flex items-center bg-gray-700 rounded-lg px-4 py-3">
            <input
              type="text"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder={`#${activeChannel?.name} yazın`}
              className="flex-1 bg-transparent text-white placeholder-gray-400 outline-none"
            />
            <button
              onClick={handleSendMessage}
              disabled={!messageInput.trim()}
              className="ml-3 p-2 rounded bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <Send className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Profil Paneli */}
      {showProfile && (
        <ProfilePanel
  user={{
    ...user,
    testScore: user.testScore,          // backend’den veya state’den gelmeli
    testPercentage: user.testPercentage // backend’den veya state’den gelmeli
  }}
  onClose={() => setShowProfile(false)}
  onUpdate={onProfileUpdate}
/>

      )}
      
    </div>
  );
}

export default ChatView;