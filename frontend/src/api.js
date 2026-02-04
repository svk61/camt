// API helper functions
const API_BASE_URL = 'http://localhost:5000/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : ''
  };
};

export const API = {
  // Authentication
  login: async (email, password) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }
    return response.json();
  },

  register: async (userData) => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Registration failed');
    }
    return response.json();
  },

  // Channels
  getChannels: async () => {
    const response = await fetch(`${API_BASE_URL}/channels`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch channels');
    return response.json();
  },

  getAllChannels: async () => {
    const response = await fetch(`${API_BASE_URL}/channels/all`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch all channels');
    return response.json();
  },

  joinChannel: async (channelId) => {
    const response = await fetch(`${API_BASE_URL}/channels/${channelId}/join`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to join channel');
    return response.json();
  },

  // Messages
  getMessages: async (channelId) => {
    const response = await fetch(`${API_BASE_URL}/channels/${channelId}/messages`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch messages');
    return response.json();
  },

  sendMessage: async (channelId, text) => {
    const response = await fetch(`${API_BASE_URL}/channels/${channelId}/messages`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ text })
    });
    if (!response.ok) throw new Error('Failed to send message');
    return response.json();
  },

  // Profile
  getProfile: async () => {
    const response = await fetch(`${API_BASE_URL}/profile`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch profile');
    return response.json();
  },

  updateProfile: async (profileData) => {
    const response = await fetch(`${API_BASE_URL}/profile`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(profileData)
    });
    if (!response.ok) throw new Error('Failed to update profile');
    return response.json();
  },

  // Assessment
  getAssessment: async () => {
    const response = await fetch(`${API_BASE_URL}/assessment`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch assessment');
    return response.json();
  },

  submitAssessment: async (answers) => {
    const response = await fetch(`${API_BASE_URL}/assessment/submit`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ answers })
    });
    if (!response.ok) throw new Error('Failed to submit assessment');
    return response.json();
  },

  // 🔥 NEW: Agora voice chat helpers
  getUsernameByUid: async (uid) => {
    const response = await fetch(`${API_BASE_URL}/agora/user/${uid}`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      throw new Error('Failed to get username');
    }
    return response.json();
  },

  getChannelUsers: async (channelName) => {
    const response = await fetch(`${API_BASE_URL}/agora/channel/${encodeURIComponent(channelName)}/users`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      throw new Error('Failed to get channel users');
    }
    return response.json();
  },

  leaveVoiceChannel: async (channelName) => {
    const response = await fetch(`${API_BASE_URL}/agora/channel/${encodeURIComponent(channelName)}/leave`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      throw new Error('Failed to leave channel');
    }
    return response.json();
  }
};