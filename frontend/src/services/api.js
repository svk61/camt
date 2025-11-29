// src/services/api.js - Frontend API Service
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  /**
   * Get authentication token from localStorage
   */
  getToken() {
    return localStorage.getItem('token');
  }

  /**
   * Make authenticated API request
   */
  async request(endpoint, options = {}) {
    const token = this.getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Request failed');
    }

    return response.json();
  }

  // Auth endpoints
  async register(email, password) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  }

  async login(email, password) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  }

  // Assessment endpoints
  async getAssessment() {
    return this.request('/assessment');
  }

  async submitAssessment(answers) {
    return this.request('/assessment/submit', {
      method: 'POST',
      body: JSON.stringify({ answers })
    });
  }

  // Channel endpoints
  async getChannels() {
    return this.request('/channels');
  }

  async createChannel(name, category, description) {
    return this.request('/channels', {
      method: 'POST',
      body: JSON.stringify({ name, category, description })
    });
  }

  async updateChannel(id, data) {
    return this.request(`/channels/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async deleteChannel(id) {
    return this.request(`/channels/${id}`, {
      method: 'DELETE'
    });
  }

  // Message endpoints
  async getMessages(channelId) {
    return this.request(`/channels/${channelId}/messages`);
  }

  async sendMessage(channelId, text) {
    return this.request(`/channels/${channelId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ text })
    });
  }

  // Profile endpoints
  async getProfile() {
    return this.request('/profile');
  }

  async updateProfile(data) {
    return this.request('/profile', {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  // Agora token endpoint
  async getAgoraToken() {
    return this.request('/agora/token');
  }

  // Admin endpoints
  async updateAssessmentQuestions(questions) {
    return this.request('/admin/assessment', {
      method: 'PUT',
      body: JSON.stringify({ questions })
    });
  }
}

export default new ApiService();