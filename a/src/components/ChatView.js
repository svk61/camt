import React, { useState, useEffect, useRef } from 'react';
import { Send, Hash, User, Settings, LogOut, Mic, MicOff, PhoneOff } from 'lucide-react';
import API from '../services/api';
import { AgoraRTC, AgoraRTM } from '../services/agora';
import ProfilePanel from './ProfilePanel';
import ChannelBrowser from './ChannelBrowser';
import VoiceChat from './Voicechat';

function ChatView({ user, channels, onLogout, onProfileUpdate }) {
  const [activeChannel, setActiveChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [showProfile, setShowProfile] = useState(false);
  const [showChannelBrowser, setShowChannelBrowser] = useState(false);
  const [userChannels, setUserChannels] = useState(channels);
  const [inVoiceCall, setInVoiceCall] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [voiceUsers, setVoiceUsers] = useState([]);
  const [showVoiceChat, setShowVoiceChat] = useState(false);
  const [voiceChannel, setVoiceChannel] = useState(null);
  
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
      initializeAgoraRTM();
      startMessagePolling();
    }
    
    return () => {
      stopMessagePolling();
      // Safely leave Agora channel if connected
      if (AgoraRTM.channel) {
        AgoraRTM.leaveChannel().catch(err => 
          console.log('Error leaving Agora channel:', err.message)
        );
      }
    };
  }, [activeChannel]);

  const initializeAgoraRTM = async () => {
    try {
      // Get Agora token from backend
      const tokenData = await API.getAgoraToken();
      
      // Check if we have valid token data
      if (!tokenData || !tokenData.appId || !tokenData.token) {
        console.log('Agora RTM not configured, using polling for messages');
        return;
      }
      
      // Initialize if not already initialized
      if (!AgoraRTM.client) {
        await AgoraRTM.initialize(tokenData.appId, user.id.toString(), tokenData.token);
      }
      
      // Join the channel
      await AgoraRTM.joinChannel(activeChannel.name);
      
      // Set up message callback
      AgoraRTM.onMessage((message) => {
        // Add received message to messages array
        const newMessage = {
          _id: `rtm-${Date.now()}`,
          id: `rtm-${Date.now()}`,
          channelId: activeChannel.id || activeChannel._id,
          userId: message.userId,
          username: message.userId === user.id.toString() ? (user.displayName || user.email.split('@')[0]) : 'User',
          text: message.text,
          createdAt: message.timestamp,
          isAnonymous: false
        };
        setMessages(prev => [...prev, newMessage]);
      });
      
      console.log('Agora RTM initialized successfully');
    } catch (error) {
      console.log('Agora RTM initialization failed, using polling instead:', error.message);
      // Don't throw error, just continue with polling
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
  }, [inVoiceCall]);

  const startMessagePolling = () => {
    stopMessagePolling();
    messagePollingRef.current = setInterval(async () => {
      if (activeChannel) {
        try {
          const msgs = await API.getMessages(activeChannel.id || activeChannel._id);
          setMessages(msgs);
        } catch (error) {
          console.error('Failed to poll messages:', error);
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
      console.error('Failed to load messages:', error);
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
      // Send to backend API (primary source of truth)
      const savedMessage = await API.sendMessage(activeChannel.id || activeChannel._id, currentInput);
      setMessages(prev => prev.map(m => m._id === tempId ? savedMessage : m));
      
      // Try to send via Agora RTM if available (optional)
      try {
        if (AgoraRTM.channel) {
          await AgoraRTM.sendMessage(currentInput);
        }
      } catch (agoraError) {
        console.log('Agora RTM not available, using polling instead');
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      setMessages(prev => prev.filter(m => m._id !== tempId));
      setMessageInput(currentInput);
      alert('Failed to send message. Please try again.');
    }
  };

  const joinVoiceCall = async () => {
    try {
      const tokenData = await API.getAgoraRtcToken(`voice-${activeChannel.name}`);
      
      // Create RTC client using the real Agora SDK
      rtcClientRef.current = await AgoraRTC.createClient();
      
      await rtcClientRef.current.join(tokenData.appId, tokenData.channelName, tokenData.token, user.id);
      
      // Create and publish audio track
      audioTrackRef.current = await AgoraRTC.createMicrophoneAudioTrack();
      await rtcClientRef.current.publish([audioTrackRef.current]);
      
      setInVoiceCall(true);
      setVoiceUsers([user.id]);
      
      rtcClientRef.current.on('user-published', async (remoteUser, mediaType) => {
        if (mediaType === 'audio') {
          await rtcClientRef.current.subscribe(remoteUser, mediaType);
          remoteUser.audioTrack.play();
          setVoiceUsers(prev => [...prev, remoteUser.uid]);
        }
      });
      
      rtcClientRef.current.on('user-unpublished', (remoteUser) => {
        setVoiceUsers(prev => prev.filter(id => id !== remoteUser.uid));
      });
      
      rtcClientRef.current.on('user-left', (remoteUser) => {
        setVoiceUsers(prev => prev.filter(id => id !== remoteUser.uid));
      });
      
    } catch (error) {
      console.error('Failed to join voice call:', error);
      if (error.message?.includes('not configured')) {
        alert('Voice chat is not configured. Please add your Agora credentials to the backend .env file.');
      } else {
        alert('Failed to join voice call. Please check your microphone permissions and try again.');
      }
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
      console.error('Failed to leave voice call:', error);
    }
  };

  const toggleMute = () => {
    if (audioTrackRef.current) {
      audioTrackRef.current.setEnabled(isMuted);
      setIsMuted(!isMuted);
    }
  };

  const handleJoinChannel = async (channel) => {
    try {
      await API.joinChannel(channel.id || channel._id);
      setUserChannels([...userChannels, channel]);
      setActiveChannel(channel);
      setShowChannelBrowser(false);
    } catch (error) {
      console.error('Failed to join channel:', error);
      alert('Failed to join channel. Please try again.');
    }
  };

  const groupedChannels = userChannels.reduce((acc, channel) => {
    if (!acc[channel.category]) {
      acc[channel.category] = [];
    }
    acc[channel.category].push(channel);
    return acc;
  }, {});

  return (
    <div className="h-screen flex bg-gray-900">
      {/* Sidebar */}
      <div className="w-64 bg-gray-800 flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <h1 className="text-xl font-bold text-white">Support Community</h1>
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
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center mr-2">
                <User className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white truncate">
                  {user.displayName || user.email.split('@')[0]}
                </p>
                <p className="text-xs text-gray-400">
                  {user.isAnonymous ? 'Anonymous' : 'Visible'}
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

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
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
                <span className="text-sm">Join Voice</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <div className="px-3 py-2 rounded bg-green-600 text-white flex items-center gap-2">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  <span className="text-sm">{voiceUsers.length} in call</span>
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

        <div className="flex-1 overflow-y-auto p-4 bg-gray-900">
          {messages.length === 0 ? (
            <div className="text-center py-8">
              <Hash className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500">No messages yet. Start the conversation!</p>
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
                        {msg.isAnonymous ? 'Anonymous' : msg.username}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(msg.createdAt || msg.timestamp).toLocaleTimeString()}
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

        <div className="p-4 bg-gray-800">
          <div className="flex items-center bg-gray-700 rounded-lg px-4 py-3">
            <input
              type="text"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder={`Message #${activeChannel?.name}`}
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

      {showProfile && (
        <ProfilePanel
          user={user}
          onClose={() => setShowProfile(false)}
          onUpdate={onProfileUpdate}
        />
      )}
      
      {showChannelBrowser && (
        <ChannelBrowser
          userChannels={userChannels}
          onClose={() => setShowChannelBrowser(false)}
          onJoinChannel={handleJoinChannel}
        />
      )}

      {showVoiceChat && (
        <VoiceChat 
          channelName={voiceChannel}
          userId={user.id}
          onClose={() => setShowVoiceChat(false)}
        />
      )}
    </div>
  );
}

export default ChatView;