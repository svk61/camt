import React, { useState, useEffect, useRef } from 'react';
import { Send, Hash, User, Settings, LogOut, Plus, Edit, Trash2, Save, X, Eye, EyeOff, Mic, MicOff, PhoneOff, Search } from 'lucide-react';


// Real API service
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
  
  async register(email, password) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password })
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
  }
};

// Agora RTC Mock (replace with real Agora SDK)
// Import Agora RTC SDK from CDN (add to index.html: <script src="https://download.agora.io/sdk/release/AgoraRTC_N-4.19.0.js"></script>)
// For now, we'll create a better mock that simulates audio
const AgoraRTC = window.AgoraRTC || {
  createClient: (config) => ({
    remoteUsers: [],
    _eventHandlers: {},
    
    async join(appId, channel, token, uid) {
      console.log(`Joined RTC channel: ${channel} with uid: ${uid}`);
      return uid;
    },
    
    async leave() {
      console.log('Left RTC channel');
      this.remoteUsers = [];
    },
    
    async publish(tracks) {
      console.log('Published audio tracks:', tracks);
    },
    
    async unpublish(tracks) {
      console.log('Unpublished audio tracks');
    },
    
    async subscribe(user, mediaType) {
      console.log(`Subscribed to user ${user.uid} for ${mediaType}`);
      // Play remote audio
      if (mediaType === 'audio' && user.audioTrack) {
        user.audioTrack.play();
      }
    },
    
    on(event, callback) {
      if (!this._eventHandlers[event]) {
        this._eventHandlers[event] = [];
      }
      this._eventHandlers[event].push(callback);
    },
    
    _emit(event, ...args) {
      if (this._eventHandlers[event]) {
        this._eventHandlers[event].forEach(cb => cb(...args));
      }
    }
  }),
  
  createMicrophoneAudioTrack: async (config) => {
    console.log('Creating microphone audio track...');
    try {
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      const audioTrack = stream.getAudioTracks()[0];
      
      return {
        _mediaStreamTrack: audioTrack,
        _enabled: true,
        
        getMediaStreamTrack() {
          return this._mediaStreamTrack;
        },
        
        setEnabled(enabled) {
          this._enabled = enabled;
          this._mediaStreamTrack.enabled = enabled;
          console.log(`Microphone ${enabled ? 'enabled' : 'disabled'}`);
        },
        
        close() {
          if (this._mediaStreamTrack) {
            this._mediaStreamTrack.stop();
          }
          console.log('Audio track closed');
        },
        
        play() {
          console.log('Playing audio track');
        }
      };
    } catch (error) {
      console.error('Failed to create microphone track:', error);
      throw error;
    }
  }
};
// Agora RTM Mock (replace with real Agora SDK)
const AgoraRTM = {
  client: null,
  channel: null,
  
  async initialize(appId, userId) {
    console.log('Agora RTM initialized');
    return true;
  },
  
  async joinChannel(channelName) {
    console.log(`Joined channel: ${channelName}`);
    return true;
  },
  
  async sendMessage(text) {
    console.log(`Sent message: ${text}`);
    return true;
  },
  
  onMessage(callback) {
    // Mock message listener
    this.messageCallback = callback;
  }
};

function App() {
  const [currentView, setCurrentView] = useState('login');
  const [user, setUser] = useState(null);
  const [channels, setChannels] = useState([]);
  const [assessmentQuestions, setAssessmentQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showVoiceChat, setShowVoiceChat] = useState(false);
const [voiceChannel, setVoiceChannel] = useState(null);


  // Handle hash navigation for register
  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === '#register') {
        setCurrentView('register');
      } else if (window.location.hash === '#login') {
        setCurrentView('login');
      }
    };

    handleHashChange(); // Check initial hash
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
        const assessment = await API.getAssessment();
        setAssessmentQuestions(assessment.questions || []);
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
          <p className="text-gray-600">Loading...</p>
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
      questions={assessmentQuestions}
      onComplete={async (answers) => {
        try {
          const result = await API.submitAssessment(answers);
          const channelsData = await API.getChannels();
          setChannels(channelsData);
          const updatedUser = { ...user, hasCompletedAssessment: true };
          setUser(updatedUser);
          localStorage.setItem('user', JSON.stringify(updatedUser));
          setCurrentView('chat');
        } catch (error) {
          console.error('Failed to submit assessment:', error);
          alert('Failed to submit assessment. Please try again.');
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
        setUser({ ...user, ...newData });
      }}
    />;
  }

  return null;
}

function LoginView({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!email || !password) return;
    
    setError('');
    setLoading(true);
    
    try {
      const result = await API.login(email, password);
      localStorage.setItem('token', result.token);
      localStorage.setItem('user', JSON.stringify(result.user));
      onLogin(result.user);
    } catch (err) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-indigo-600 rounded-full mx-auto mb-4 flex items-center justify-center">
            <Hash className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
          <p className="text-gray-600">Sign in to your support community</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleLogin(e)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                placeholder="••••••••"
              />
              <button
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={loading || !email || !password}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </div>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Don't have an account?{' '}
            <button
              onClick={() => window.location.hash = 'register'}
              className="text-indigo-600 font-semibold hover:text-indigo-700"
            >
              Register
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

function RegisterView({ onRegister, onBack }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!email || !password || !confirmPassword) return;
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      const result = await API.register(email, password);
      localStorage.setItem('token', result.token);
      localStorage.setItem('user', JSON.stringify(result.user));
      onRegister(result.user);
    } catch (err) {
      setError(err.message || 'Registration failed. Email may already be in use.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-indigo-600 rounded-full mx-auto mb-4 flex items-center justify-center">
            <Hash className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h1>
          <p className="text-gray-600">Join the support community</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleRegister(e)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                placeholder="••••••••"
              />
              <button
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleRegister(e)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleRegister}
            disabled={loading || !email || !password || !confirmPassword}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </div>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Already have an account?{' '}
            <button
              onClick={onBack}
              className="text-indigo-600 font-semibold hover:text-indigo-700"
            >
              Sign In
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

function AssessmentView({ questions, onComplete }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});

  const currentQuestion = questions[step];
  const isLastStep = step === questions.length - 1;

  const handleAnswer = (questionId, answer) => {
    setAnswers({ ...answers, [questionId]: answer });
  };

  const handleNext = () => {
    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      onComplete(answers);
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Initial Assessment</h1>
            <span className="text-sm text-gray-600">
              Step {step + 1} of {questions.length}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((step + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            {currentQuestion.question}
          </h2>

          <div className="space-y-3">
            {currentQuestion.options.map((option, idx) => (
              <button
                key={idx}
                onClick={() => handleAnswer(currentQuestion.id, option)}
                className={`w-full px-6 py-4 rounded-lg border-2 text-left transition ${
                  answers[currentQuestion.id] === option
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-900'
                    : 'border-gray-200 hover:border-indigo-300 text-gray-700'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-between">
          <button
            onClick={handleBack}
            disabled={step === 0}
            className="px-6 py-3 rounded-lg font-semibold text-gray-700 hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Back
          </button>
          <button
            onClick={handleNext}
            disabled={!answers[currentQuestion.id]}
            className="px-6 py-3 rounded-lg font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLastStep ? 'Complete' : 'Next'}
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
  const [showAdmin, setShowAdmin] = useState(false);
  const [showChannelBrowser, setShowChannelBrowser] = useState(false);
  const [userChannels, setUserChannels] = useState(channels);
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
      
      // Start polling for new messages
      startMessagePolling();
    }
    
    return () => {
      stopMessagePolling();
    };
  }, [activeChannel]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Cleanup voice call on unmount
  useEffect(() => {
    return () => {
      if (inVoiceCall) {
        leaveVoiceCall();
      }
    };
  }, [inVoiceCall]);

  const startMessagePolling = () => {
    stopMessagePolling();
    
    // Poll for new messages every 2 seconds
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
      const savedMessage = await API.sendMessage(activeChannel.id || activeChannel._id, currentInput);
      
      // Replace optimistic message with real one from server
      setMessages(prev => prev.map(m => 
        m._id === tempId ? savedMessage : m
      ));
      
      await AgoraRTM.sendMessage(currentInput);
    } catch (error) {
      console.error('Failed to send message:', error);
      setMessages(prev => prev.filter(m => m._id !== tempId));
      setMessageInput(currentInput);
      alert('Failed to send message. Please try again.');
    }
  };

  const joinVoiceCall = async () => {
    try {
      // Get RTC token from backend
      const tokenData = await API.getAgoraRtcToken(`voice-${activeChannel.name}`);
      
      // Create RTC client
      rtcClientRef.current = await AgoraRTC.createClient();
      
      // Join channel
      await rtcClientRef.current.join(
        tokenData.appId, 
        tokenData.channelName, 
        tokenData.token, 
        user.id
      );
      
      // Create and publish audio track
      audioTrackRef.current = await AgoraRTC.createMicrophoneAudioTrack();
      await rtcClientRef.current.publish([audioTrackRef.current]);
      
      setInVoiceCall(true);
      setVoiceUsers([user.id]);
      
      // Listen for other users
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
      console.error('Failed to join voice call:', error);
      console.log('Agora App ID:', process.env.REACT_APP_AGORA_APP_ID);
      // Check if it's a configuration error
      if (error.message?.includes('not configured')) {
        alert('Voice chat is not configured. Please add your Agora credentials to the backend .env file:\n\nAGORA_APP_ID=your_app_id\nAGORA_APP_CERTIFICATE=your_certificate');
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
        {/* Channel Header */}
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

        {/* Messages */}
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

        {/* Message Input */}
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

      {/* Profile Panel */}
      {showProfile && (
        <ProfilePanel
          user={user}
          onClose={() => setShowProfile(false)}
          onUpdate={onProfileUpdate}
        />
      )}
      
      {/* Channel Browser */}
      {showChannelBrowser && (
        <ChannelBrowser
          userChannels={userChannels}
          onClose={() => setShowChannelBrowser(false)}
          onJoinChannel={handleJoinChannel}
        />
      )}
    </div>
  );
}

function ProfilePanel({ user, onClose, onUpdate }) {
  const [displayName, setDisplayName] = useState(user.displayName || '');
  const [bio, setBio] = useState(user.bio || '');
  const [isAnonymous, setIsAnonymous] = useState(user.isAnonymous || false);

  const handleSave = async () => {
    try {
      const updates = { displayName, bio, isAnonymous };
      await API.updateProfile(updates);
      onUpdate(updates);
      onClose();
    } catch (error) {
      console.error('Failed to update profile:', error);
      alert('Failed to update profile. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Profile Settings</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-4 py-2 rounded bg-gray-700 text-white border border-gray-600 focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="Enter display name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full px-4 py-2 rounded bg-gray-700 text-white border border-gray-600 focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
              rows="3"
              placeholder="Tell us about yourself..."
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-300">Anonymous Mode</p>
              <p className="text-xs text-gray-400">Hide your identity in channels</p>
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
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded bg-gray-700 text-white hover:bg-gray-600 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700 transition"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

function ChannelBrowser({ userChannels, onClose, onJoinChannel }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [allChannels, setAllChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadChannels();
  }, []);

  const loadChannels = async () => {
    try {
      setLoading(true);
      const channels = await API.getAllChannels();
      setAllChannels(channels);
      setError('');
    } catch (error) {
      console.error('Failed to load channels:', error);
      setError('Failed to load channels. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filteredChannels = allChannels.filter(channel => {
    const matchesSearch = channel.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         channel.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const notJoined = !userChannels.some(uc => uc.id === channel.id || uc._id === channel._id);
    const isPublic = channel.isPublic !== false;
    return matchesSearch && notJoined && isPublic;
  });

  const handleJoinChannel = async (channel) => {
    try {
      await onJoinChannel(channel);
    } catch (error) {
      console.error('Failed to join channel:', error);
      alert('Failed to join channel. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg w-full max-w-2xl p-6 max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Browse Channels</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search channels..."
              className="w-full pl-10 pr-4 py-3 rounded bg-gray-700 text-white border border-gray-600 focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-400 mt-3">Loading channels...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-400 mb-3">{error}</p>
              <button
                onClick={loadChannels}
                className="px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-700 text-white text-sm"
              >
                Retry
              </button>
            </div>
          ) : filteredChannels.length === 0 ? (
            <div className="text-center py-8">
              <Hash className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">
                {searchQuery ? 'No channels found matching your search' : 'No new channels available'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredChannels.map((channel) => (
                <div
                  key={channel.id || channel._id}
                  className="bg-gray-700 rounded-lg p-4 hover:bg-gray-650 transition"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Hash className="w-5 h-5 text-gray-400" />
                        <h3 className="text-white font-semibold">{channel.name}</h3>
                        <span className="text-xs px-2 py-0.5 rounded bg-gray-600 text-gray-300">
                          {channel.category}
                        </span>
                      </div>
                      {channel.description && (
                        <p className="text-sm text-gray-400 ml-7">{channel.description}</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleJoinChannel(channel)}
                      className="ml-4 px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition"
                    >
                      Join
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;