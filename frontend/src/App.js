import React, { useState, useEffect } from 'react';
import AgoraRTC from 'agora-rtc-sdk-ng';
import AgoraRTM from 'agora-rtm-sdk';
import LoginView from './pages/LoginView';
import RegisterView from './pages/RegisterView';
import AssessmentView from './pages/AssessmentView';
import ChatView from './pages/ChatView';
import AdminPanel from './pages/AdminPanel';

// Real API service
// App.js - Fixed Agora RTM Integration
// ... (LoginView, RegisterView imports remain same)

// API Service (no changes)
const API = {
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  
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

  async getAssessmentResults() {
    return this.request('/assessment/results');
  }
};

// RTC Wrapper (no changes)
const AgoraRTCWrapper = {
  createClient: (config) => {
    console.log('Creating Agora RTC client with config:', config);
    return AgoraRTC.createClient(config);
  },
  
  createMicrophoneAudioTrack: async (config) => {
    console.log('Creating microphone audio track with config:', config);
    return await AgoraRTC.createMicrophoneAudioTrack(config);
  }
};

// ⚠️ FIXED RTM Wrapper
const AgoraRTMWrapper = {
  client: null,
  channel: null,
  messageCallback: null,
  isInitialized: false,
  isChannelJoined: false,
  currentUserId: null,
  
  async initialize(appId, userId, token) {
    try {
      console.log('🔹 RTM Initialize başlıyor...');
      console.log('📋 AppId:', appId);
      console.log('📋 UserId:', userId);
      console.log('📋 Token length:', token?.length);
      console.log('📋 Token preview:', token?.substring(0, 50) + '...');
      
      // Eğer zaten initialize edilmişse, önce logout yap
      if (this.client && this.isInitialized) {
        console.log('🔄 RTM zaten aktif, yeniden başlatılıyor...');
        await this.logout();
      }
      
      // ⚠️ CRITICAL: createInstance ile client oluştur
      this.client = AgoraRTM.createInstance(appId);
      this.currentUserId = userId;
      
      console.log('✅ RTM client oluşturuldu');
      
      // ⚠️ CRITICAL: Login için doğru format
      // Option 1: Object format (recommended)
      await this.client.login({ 
        token: token, 
        uid: userId 
      });
      
      console.log('✅ RTM login başarılı:', userId);
      
      this.isInitialized = true;
      
      // Connection state listener
      this.client.on('ConnectionStateChanged', (newState, reason) => {
        console.log('🔔 RTM Connection State:', newState, 'Reason:', reason);
      });
      
      return true;
    } catch (error) {
      console.error('❌ RTM initialization failed:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      this.isInitialized = false;
      return false;
    }
  },
  
  async joinChannel(channelName) {
    if (!this.isInitialized || !this.client) {
      console.error('❌ RTM not initialized! Call initialize() first.');
      throw new Error('RTM not initialized');
    }
    
    try {
      console.log('🔹 Joining RTM channel:', channelName);
      
      // Eğer başka bir kanalda ise önce ayrıl
      if (this.channel && this.isChannelJoined) {
        console.log('🔄 Mevcut kanaldan ayrılınıyor...');
        await this.channel.leave();
        this.isChannelJoined = false;
      }
      
      // Yeni kanal oluştur ve katıl
      this.channel = this.client.createChannel(channelName);
      await this.channel.join();
      this.isChannelJoined = true;
      
      console.log('✅ RTM kanala katıldı:', channelName);
      
      // Set up message listener
      this.channel.on('ChannelMessage', (message, memberId) => {
        console.log('📨 RTM mesajı alındı:', message.text, 'from:', memberId);
        if (this.messageCallback) {
          this.messageCallback({
            text: message.text,
            userId: memberId,
            timestamp: new Date().toISOString()
          });
        }
      });
      
      // Member joined/left listeners
      this.channel.on('MemberJoined', (memberId) => {
        console.log('👤 Member joined:', memberId);
      });
      
      this.channel.on('MemberLeft', (memberId) => {
        console.log('👋 Member left:', memberId);
      });
      
      return true;
    } catch (error) {
      console.error('❌ Failed to join RTM channel:', error);
      this.isChannelJoined = false;
      throw error;
    }
  },
  
  async sendMessage(text) {
    if (!this.isChannelJoined || !this.channel) {
      console.error('❌ No active RTM channel! Current state:', {
        isInitialized: this.isInitialized,
        isChannelJoined: this.isChannelJoined,
        hasClient: !!this.client,
        hasChannel: !!this.channel
      });
      throw new Error('No active RTM channel');
    }
    
    try {
      console.log('📤 Sending RTM message:', text);
      await this.channel.sendMessage({ text, messageType: 'TEXT' });
      console.log('✅ RTM mesaj gönderildi');
      return true;
    } catch (error) {
      console.error('❌ Failed to send RTM message:', error);
      throw error;
    }
  },
  
  onMessage(callback) {
    this.messageCallback = callback;
  },
  
  async leaveChannel() {
    try {
      if (this.channel && this.isChannelJoined) {
        await this.channel.leave();
        this.channel = null;
        this.isChannelJoined = false;
        console.log('✅ Left RTM channel');
      }
    } catch (error) {
      console.error('❌ Failed to leave RTM channel:', error);
    }
  },
  
  async logout() {
    try {
      await this.leaveChannel();
      if (this.client && this.isInitialized) {
        await this.client.logout();
        this.client = null;
        this.isInitialized = false;
        this.currentUserId = null;
        console.log('✅ Logged out from RTM');
      }
    } catch (error) {
      console.error('❌ Failed to logout from RTM:', error);
    }
  }
};

export { API, AgoraRTCWrapper as AgoraRTC, AgoraRTMWrapper as AgoraRTM };

// App component (no changes needed)
function App() {
  const [currentView, setCurrentView] = useState('login');
  const [user, setUser] = useState(null);
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token && currentView !== 'register') {
      loadUserData();
    } else {
      setLoading(false);
    }
  }, []);

  const loadUserData = async () => {
    try {
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      setUser(storedUser);
      
      if (storedUser.hasCompletedAssessment) {
        const channelsData = await API.getChannels();
        setChannels(channelsData);
        setCurrentView('chat');
      } else {
        setCurrentView('assessment');
      }
    } catch (error) {
      console.error('Failed to load user data:', error);
      localStorage.clear();
      setCurrentView('login');
    } finally {
      setLoading(false);
    }
  };

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
          console.error('Failed to submit assessment:', error);
          alert('Anket gönderimi başarısız. Lütfen tekrar deneyin.');
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