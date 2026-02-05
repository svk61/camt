import React, { useState, useEffect } from 'react';
import AgoraRTC from 'agora-rtc-sdk-ng';
import AgoraRTM from 'agora-rtm-sdk';
import LoginView from './pages/LoginView';
import RegisterView from './pages/RegisterView';
import AssessmentView from './pages/AssessmentView';
import ChatView from './pages/ChatView';
import AdminPanel from './pages/AdminPanel';

// API Service
const API = {
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  
  getToken() {
    return localStorage.getItem('token');
  },
  
  async request(endpoint, options = {}) {
    const token = this.getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...options,
        headers
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },
  
  async register(email, password, additionalData) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, ...additionalData })
    });
  },
  
  async login(email, password) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  },
  
  async getAssessment() {
    return this.request('/assessment');
  },
  
  async submitAssessment(answers) {
    return this.request('/assessment/submit', {
      method: 'POST',
      body: JSON.stringify({ answers })
    });
  },
  
  async getChannels() {
    return this.request('/channels');
  },
  
  async getAllChannels() {
    return this.request('/channels/all');
  },
  
  async searchChannels(query) {
    return this.request(`/channels/search?query=${encodeURIComponent(query)}`);
  },
  
  async joinChannel(channelId) {
    return this.request(`/channels/${channelId}/join`, {
      method: 'POST'
    });
  },
  
  async getMessages(channelId) {
    return this.request(`/channels/${channelId}/messages`);
  },
  
  async sendMessage(channelId, text) {
    return this.request(`/channels/${channelId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ text })
    });
  },
  
  async updateProfile(data) {
    return this.request('/profile', {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },
  
  async getAgoraToken() {
    return this.request('/agora/token');
  },
  
  async getAgoraRtcToken(channelName) {
    return this.request(`/agora/rtc-token?channelName=${encodeURIComponent(channelName)}`);
  },

  async getUsernameByUid(uid) {
    return this.request(`/agora/user/${uid}`);
  },

  async leaveVoiceChannel(channelName) {
    return this.request(`/agora/channel/${encodeURIComponent(channelName)}/leave`, {
      method: 'POST'
    });
  },

  async getAssessmentResults() {
    return this.request('/assessment/results');
  }
};

// RTC Wrapper
const AgoraRTCWrapper = {
  createClient: (config) => {
    return AgoraRTC.createClient(config);
  },
  
  createMicrophoneAudioTrack: async (config) => {
    return await AgoraRTC.createMicrophoneAudioTrack(config);
  }
};

// 🔥🔥🔥 COMPLETELY FIXED RTM Wrapper - Singleton pattern
const AgoraRTMWrapper = {
  client: null,
  channels: new Map(), // channelName -> channel object
  messageCallbacks: new Map(), // channelName -> callback
  isInitialized: false,
  currentUserId: null,
  currentAppId: null,
  
  async initialize(appId, userId, token) {
    try {
      // 🔥 CRITICAL: Eğer zaten aynı kullanıcı ile login ise skip et
      if (this.client && this.isInitialized && this.currentUserId === userId) {
        console.log('✅ RTM zaten aktif (UserId:', userId, ')');
        return true;
      }
      
      console.log('🔹 RTM Initialize:', userId);
      
      // Farklı kullanıcı ise önce logout yap
      if (this.client && this.isInitialized) {
        console.log('🔄 Önceki RTM session temizleniyor...');
        await this.logout();
      }
      
      this.client = AgoraRTM.createInstance(appId);
      this.currentUserId = userId;
      this.currentAppId = appId;
      
      await this.client.login({ 
        token: token, 
        uid: userId 
      });
      
      console.log('✅ RTM login:', userId);
      this.isInitialized = true;
      
      this.client.on('ConnectionStateChanged', (newState, reason) => {
        console.log('🔔 RTM State:', newState, reason);
      });
      
      return true;
    } catch (error) {
      console.error('❌ RTM init failed:', error.message);
      this.isInitialized = false;
      return false;
    }
  },
  
  async joinChannel(channelName) {
    if (!this.isInitialized || !this.client) {
      console.error('❌ RTM not initialized');
      throw new Error('RTM not initialized');
    }
    
    try {
      // 🔥 CRITICAL: Eğer aynı kanalda ise skip et
      if (this.channels.has(channelName)) {
        console.log('✅ Zaten kanaldayız:', channelName);
        return true;
      }
      
      console.log('🔹 RTM channel join:', channelName);
      
      const channel = this.client.createChannel(channelName);
      await channel.join();
      
      this.channels.set(channelName, channel);
      console.log('✅ RTM joined:', channelName);
      
      // Message listener
      channel.on('ChannelMessage', (message, memberId) => {
        const callback = this.messageCallbacks.get(channelName);
        if (callback) {
          callback({
            text: message.text,
            userId: memberId,
            timestamp: new Date().toISOString()
          });
        }
      });
      
      return true;
    } catch (error) {
      console.error('❌ RTM join failed:', error.message);
      throw error;
    }
  },
  
  async sendMessage(channelName, text) {
    const channel = this.channels.get(channelName);
    
    if (!channel) {
      console.error('❌ No active channel:', channelName);
      throw new Error('No active channel');
    }
    
    try {
      await channel.sendMessage({ text, messageType: 'TEXT' });
      return true;
    } catch (error) {
      console.error('❌ RTM send failed:', error.message);
      throw error;
    }
  },
  
  onMessage(channelName, callback) {
    this.messageCallbacks.set(channelName, callback);
  },
  
  async leaveChannel(channelName) {
    const channel = this.channels.get(channelName);
    
    if (channel) {
      try {
        await channel.leave();
        this.channels.delete(channelName);
        this.messageCallbacks.delete(channelName);
        console.log('✅ Left RTM channel:', channelName);
      } catch (error) {
        console.error('❌ Leave failed:', error.message);
      }
    }
  },
  
  async logout() {
    try {
      // Leave all channels
      for (const [channelName, channel] of this.channels.entries()) {
        try {
          await channel.leave();
        } catch (e) { /* ignore */ }
      }
      
      this.channels.clear();
      this.messageCallbacks.clear();
      
      if (this.client && this.isInitialized) {
        await this.client.logout();
        this.client = null;
      }
      
      this.isInitialized = false;
      this.currentUserId = null;
      console.log('✅ RTM logout complete');
    } catch (error) {
      console.error('❌ RTM logout error:', error.message);
    }
  }
};

export { API, AgoraRTCWrapper as AgoraRTC, AgoraRTMWrapper as AgoraRTM };

// App component
function App() {
  const [currentView, setCurrentView] = useState('login');
  const [user, setUser] = useState(null);
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);

  // Hash change handler
  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === '#register') {
        setCurrentView('register');
      } else if (window.location.hash === '#admin') {
        setCurrentView('admin');
      } else if (window.location.hash === '#login') {
        setCurrentView('login');
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // 🔥 FIXED: Proper initialization
  useEffect(() => {
    const initializeApp = async () => {
      const token = localStorage.getItem('token');
      
      if (!token || currentView === 'register') {
        setLoading(false);
        return;
      }

      try {
        console.log('🔄 Uygulama başlatılıyor...');
        
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        
        if (!storedUser.id) {
          throw new Error('No user data');
        }

        console.log('✅ Kullanıcı:', storedUser.email);
        setUser(storedUser);
        
        if (storedUser.hasCompletedAssessment) {
          console.log('📡 Kanallar yükleniyor...');
          const channelsData = await API.getChannels();
          console.log('✅ Kanallar yüklendi:', channelsData.length);
          
          setChannels(channelsData);
          setCurrentView('chat');
        } else {
          setCurrentView('assessment');
        }
        
      } catch (error) {
        console.error('❌ Init failed:', error);
        localStorage.clear();
        setCurrentView('login');
      } finally {
        setLoading(false);
      }
    };

    initializeApp();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (currentView === 'login') {
    return <LoginView onLogin={(userData) => {
      setUser(userData);
      setCurrentView(userData.hasCompletedAssessment ? 'chat' : 'assessment');
    }} />;
  }

  if (currentView === 'register') {
    return <RegisterView 
      onRegister={(userData) => {
        setUser(userData);
        window.location.hash = '';
        setCurrentView('assessment');
      }} 
      onBack={() => {
        window.location.hash = '';
        setCurrentView('login');
      }} 
    />;
  }

  if (currentView === 'assessment') {
    return <AssessmentView 
      user={user}
      onComplete={async (answers) => {
        try {
          await API.submitAssessment(answers);
          const channelsData = await API.getChannels();
          setChannels(channelsData);
          const updatedUser = { ...user, hasCompletedAssessment: true };
          setUser(updatedUser);
          localStorage.setItem('user', JSON.stringify(updatedUser));
          setCurrentView('chat');
        } catch (error) {
          console.error('Assessment submit failed:', error);
          alert('Anket gönderimi başarısız.');
        }
      }}
    />;
  }

  if (currentView === 'chat') {
    return <ChatView 
      user={user}
      channels={channels}
      onLogout={() => {
        localStorage.clear();
        setUser(null);
        setCurrentView('login');
      }}
      onProfileUpdate={(newData) => {
        const updatedUser = { ...user, ...newData };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }}
    />;
  }

  if (currentView === 'admin') {
    return <AdminPanel />;
  }

  return null;
}

export default App;