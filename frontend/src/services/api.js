import React, { useState, useEffect } from 'react';
import LoginView from './pages/LoginView';
import RegisterView from './pages/RegisterView';
import AssessmentView from './pages/AssessmentView';
import ChatView from './pages/ChatView';
import AdminPanel from './pages/AdminPanel';

// ========================================
// 🔥 CRITICAL FIX: Real API service (no mock Agora)
// ========================================
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
  },

  // 🔥 NEW: Get username by UID
  async getUsernameByUid(uid) {
    return this.request(`/agora/user/${uid}`);
  },
  async getChannelUsers(channelName) {
  return this.request(`/agora/channel/${encodeURIComponent(channelName)}/users`);
},

async leaveVoiceChannel(channelName) {
  return this.request(`/agora/channel/${encodeURIComponent(channelName)}/leave`, {
    method: 'POST'
  });
}
};


// ========================================
// 🔥 REMOVED: All mock Agora code
// Real Agora SDK is imported directly in components
// ========================================

export { API };

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