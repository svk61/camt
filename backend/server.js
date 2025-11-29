// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const agoraService = require('./agoraService');
app.use(cors());

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/support-platform', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));
console.log('AGORA_APP_ID:', process.env.AGORA_APP_ID);
console.log('AGORA_APP_CERTIFICATE:', process.env.AGORA_APP_CERTIFICATE);

// Models
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  displayName: String,
  bio: String,
  isAnonymous: { type: Boolean, default: false },
  hasCompletedAssessment: { type: Boolean, default: false },
  assessmentAnswers: Object,
  assessmentScore: { type: Number, default: 0 },
  // YENİ ALANLAR EKLE:
  gender: String,        // 'Erkek', 'Kadın', 'Diğer'
  age: Number,
  education: String,     // 'İlkokul', 'Ortaokul', 'Lise', 'Üniversite', 'Okuyorum', 'Mezun'
  school: String,
  // SON:
  assignedChannels: [String],
  isAdmin: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const AssessmentResultSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  answers: {
    type: Object,
    required: true
  },
  score: {
    type: Number,
    required: true
  },
  gender: String,
  age: Number,
  education: String,
  submittedAt: { type: Date, default: Date.now }
});
const AssessmentResult = mongoose.model('AssessmentResult', AssessmentResultSchema);
const ChannelSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  category: { type: String, required: true },
  description: String,
  isPublic: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

const MessageSchema = new mongoose.Schema({
  channelId: { type: String, required: true },
  userId: { type: String, required: true },
  username: String,
  text: { type: String, required: true },
  isAnonymous: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const AssessmentSchema = new mongoose.Schema({
  questions: [{
    id: String,
    question: String,
    type: String,
    options: [String]
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', UserSchema);
const Channel = mongoose.model('Channel', ChannelSchema);
const Message = mongoose.model('Message', MessageSchema);
const Assessment = mongoose.model('Assessment', AssessmentSchema);
console.log(this.appId, this.appCertificate)
// Middleware to verify JWT token
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) throw new Error();
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = await User.findById(decoded.userId);
    
    if (!user) throw new Error();
    
    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Please authenticate' });
  }
};

// Admin middleware
const adminMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Token gereklidir' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Admin token kontrolü
    if (!decoded.adminAccess && !decoded.isAdmin) {
      // User token varsa admin kontrolü yap
      if (decoded.userId) {
        const user = await User.findById(decoded.userId);
        if (!user || !user.isAdmin) {
          return res.status(403).json({ error: 'Yönetici erişimi gereklidir' });
        }
      } else {
        return res.status(403).json({ error: 'Yönetici erişimi gereklidir' });
      }
    }
    
    req.decoded = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token doğrulaması başarısız' });
  }
};

// Routes

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});
app.get('/api/assessment/results', adminMiddleware, async (req, res) => {
  try {
    const results = await AssessmentResult.find()
      .select('gender age education score submittedAt')
      .sort({ submittedAt: -1 });
    
    // Format results for frontend
    const formattedResults = results.map((result, index) => ({
      id: result._id,
      gender: result.gender,
      age: result.age,
      education: result.education,
      score: result.score,
      percentage: Math.round((result.score / 16) * 100),
      submittedAt: result.submittedAt
    }));
    
    res.json(formattedResults);
  } catch (error) {
    console.error('Fetch results error:', error);
    res.status(500).json({ error: 'Sonuçlar getirilemedi' });
  }
});
// Auth Routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, gender, age, education, school } = req.body;
    
    // Validate required fields
    if (!email || !password || !gender || !age || !education) {
      return res.status(400).json({ error: 'Tüm alanlar gereklidir' });
    }
    
    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Bu e-mail zaten kayıtlı' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user with additional fields
    const user = new User({
      email,
      password: hashedPassword,
      gender,
      age: parseInt(age),
      education,
      school: school || null
    });
    
    await user.save();
    
    // Generate token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );
    
    res.status(201).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        displayName: user.displayName,
        gender: user.gender,
        age: user.age,
        education: user.education,
        hasCompletedAssessment: user.hasCompletedAssessment,
        isAdmin: user.isAdmin
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Kayıt başarısız' });
  }
});
app.get('/api/assessment/results/stats', adminMiddleware, async (req, res) => {
  try {
    const results = await AssessmentResult.find();
    
    const totalResults = results.length;
    const avgScore = results.length > 0 
      ? (results.reduce((sum, r) => sum + r.score, 0) / results.length).toFixed(2)
      : 0;
    
    const scores = results.map(r => r.score);
    const highestScore = scores.length > 0 ? Math.max(...scores) : 0;
    const lowestScore = scores.length > 0 ? Math.min(...scores) : 0;
    
    const ages = results.map(r => r.age || 0).filter(a => a > 0);
    const avgAge = ages.length > 0 
      ? (ages.reduce((sum, a) => sum + a, 0) / ages.length).toFixed(1)
      : 0;
    
    // Gender distribution
    const genderDistribution = results.reduce((acc, r) => {
      acc[r.gender] = (acc[r.gender] || 0) + 1;
      return acc;
    }, {});
    
    // Education distribution
    const educationDistribution = results.reduce((acc, r) => {
      acc[r.education] = (acc[r.education] || 0) + 1;
      return acc;
    }, {});
    
    res.json({
      totalResults,
      avgScore,
      highestScore,
      lowestScore,
      avgAge,
      genderDistribution,
      educationDistribution
    });
  } catch (error) {
    console.error('Fetch stats error:', error);
    res.status(500).json({ error: 'İstatistikler getirilemedi' });
  }
});
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Generate token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );
    
    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        displayName: user.displayName,
        bio: user.bio,
        isAnonymous: user.isAnonymous,
        hasCompletedAssessment: user.hasCompletedAssessment,
        isAdmin: user.isAdmin,
        assignedChannels: user.assignedChannels
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// Assessment Routes
app.get('/api/assessment', authMiddleware, async (req, res) => {
  try {
    let assessment = await Assessment.findOne().sort({ createdAt: -1 });
    
    // Create default assessment if none exists
    if (!assessment) {
      assessment = new Assessment({
        questions: [
          {
            id: 'q1',
            question: 'How would you describe your current career situation?',
            type: 'multiple',
            options: ['Stuck in current position', 'Seeking advancement', 'Facing discrimination', 'Other']
          },
          {
            id: 'q2',
            question: 'What type of support are you looking for?',
            type: 'multiple',
            options: ['Career advice', 'Mentorship', 'Networking', 'Emotional support']
          },
          {
            id: 'q3',
            question: 'How long have you been experiencing these challenges?',
            type: 'multiple',
            options: ['Less than 6 months', '6-12 months', '1-2 years', 'More than 2 years']
          }
        ]
      });
      await assessment.save();
    }
    
    res.json(assessment);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch assessment' });
  }
});

app.post('/api/assessment/submit', authMiddleware, async (req, res) => {
  try {
    const { answers } = req.body;
    
    // Calculate score (count 'yes' answers)
    const score = Object.values(answers).filter(answer => answer === 'yes').length;
    
    // Save assessment result
    const assessmentResult = new AssessmentResult({
      userId: req.user._id,
      answers,
      score,
      gender: req.user.gender,
      age: req.user.age,
      education: req.user.education
    });
    
    await assessmentResult.save();
    
    // Update user
    req.user.assessmentAnswers = answers;
    req.user.assessmentScore = score;
    req.user.hasCompletedAssessment = true;
    // Assign default channels
    req.user.assignedChannels = ['general', 'support'];
    await req.user.save();
    
    res.json({ 
      success: true,
      score,
      totalQuestions: 16,
      percentage: Math.round((score / 16) * 100),
      assignedChannels: req.user.assignedChannels
    });
  } catch (error) {
    console.error('Assessment submission error:', error);
    res.status(500).json({ error: 'Anket gönderilemedi' });
  }
});
// Channel Routes
app.get('/api/channels', authMiddleware, async (req, res) => {
  try {
    // Get all channels (or filter by user's assigned channels)
    const query = req.user.isAdmin 
      ? {} 
      : { name: { $in: req.user.assignedChannels || [] } };
    
    const channels = await Channel.find(query);
    res.json(channels);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch channels' });
  }
});
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || 
  bcrypt.hashSync('admin123', 10);

app.post('/api/auth/admin-login', async (req, res) => {
  try {
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({ error: 'Şifre gereklidir' });
    }
    
    // Compare password with hash
    const isValid = await bcrypt.compare(password, ADMIN_PASSWORD_HASH);
    
    if (!isValid) {
      return res.status(401).json({ error: 'Geçersiz şifre' });
    }
    
    // Generate admin token (valid for 24 hours)
    const token = jwt.sign(
      { isAdmin: true, adminAccess: true },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );
    
    res.json({
      token,
      isAdmin: true,
      message: 'Yönetici paneline hoş geldiniz'
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'Giriş başarısız' });
  }
});
app.get('/api/channels/all', authMiddleware, async (req, res) => {
  try {
    // Get all public channels for browsing
    const channels = await Channel.find({ isPublic: true });
    res.json(channels);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch channels' });
  }
});

app.get('/api/channels/search', authMiddleware, async (req, res) => {
  try {
    const { query } = req.query;
    const channels = await Channel.find({
      isPublic: true,
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } }
      ]
    });
    res.json(channels);
  } catch (error) {
    res.status(500).json({ error: 'Failed to search channels' });
  }
});

app.post('/api/channels/:channelId/join', authMiddleware, async (req, res) => {
  try {
    const channel = await Channel.findById(req.params.channelId);
    
    if (!channel) {
      return res.status(404).json({ error: 'Channel not found' });
    }
    
    if (!channel.isPublic) {
      return res.status(403).json({ error: 'Channel is private' });
    }
    
    // Add channel to user's assigned channels
    if (!req.user.assignedChannels.includes(channel.name)) {
      req.user.assignedChannels.push(channel.name);
      await req.user.save();
    }
    
    res.json({ success: true, channel });
  } catch (error) {
    res.status(500).json({ error: 'Failed to join channel' });
  }
});

app.post('/api/channels', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { name, category, description, isPublic } = req.body;
    
    const channel = new Channel({ name, category, description, isPublic });
    await channel.save();
    
    res.status(201).json(channel);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create channel' });
  }
});

app.put('/api/channels/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { name, category, description } = req.body;
    
    const channel = await Channel.findByIdAndUpdate(
      req.params.id,
      { name, category, description },
      { new: true }
    );
    
    res.json(channel);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update channel' });
  }
});

app.delete('/api/channels/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await Channel.findByIdAndDelete(req.params.id);
    res.json({ message: 'Channel deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete channel' });
  }
});

// Message Routes
app.get('/api/channels/:channelId/messages', authMiddleware, async (req, res) => {
  try {
    const messages = await Message.find({ channelId: req.params.channelId })
      .sort({ createdAt: 1 })
      .limit(100);
    
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

app.post('/api/channels/:channelId/messages', authMiddleware, async (req, res) => {
  try {
    const { text } = req.body;
    
    const message = new Message({
      channelId: req.params.channelId,
      userId: req.user._id,
      username: req.user.displayName || req.user.email.split('@')[0],
      text,
      isAnonymous: req.user.isAnonymous
    });
    
    await message.save();
    
    // Return the saved message with all fields
    res.status(201).json({
      _id: message._id,
      channelId: message.channelId,
      userId: message.userId,
      username: message.username,
      text: message.text,
      isAnonymous: message.isAnonymous,
      createdAt: message.createdAt
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Profile Routes
app.get('/api/profile', authMiddleware, async (req, res) => {
  try {
    const assessmentAnswers = req.user.assessmentAnswers || {};

    // Toplam soru sayısı
    const totalQuestions = Object.keys(assessmentAnswers).length;

    // Toplam "yes" sayısı
    const totalScore = Object.values(assessmentAnswers).reduce(
      (acc, val) => acc + (val.toLowerCase() === "yes" ? 1 : 0),
      0
    );

    const percentage = totalQuestions > 0 ? Math.round((totalScore / totalQuestions) * 100) : 0;

    res.json({
      id: req.user._id,
      email: req.user.email,
      displayName: req.user.displayName,
      bio: req.user.bio,
      isAnonymous: req.user.isAnonymous,
      hasCompletedAssessment: req.user.hasCompletedAssessment,
      isAdmin: req.user.isAdmin,
      assessmentScore: totalScore,
      assessmentPercentage: percentage,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});



app.put('/api/profile', authMiddleware, async (req, res) => {
  try {
    const { displayName, bio, isAnonymous } = req.body;
    
    req.user.displayName = displayName;
    req.user.bio = bio;
    req.user.isAnonymous = isAnonymous;
    await req.user.save();
    
    res.json({
      id: req.user._id,
      email: req.user.email,
      displayName: req.user.displayName,
      bio: req.user.bio,
      isAnonymous: req.user.isAnonymous
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Admin Routes
app.put('/api/admin/assessment', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { questions } = req.body;
    
    const assessment = new Assessment({ questions });
    await assessment.save();
    
    res.json(assessment);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update assessment' });
  }
});
 const a =  process.env.REACT_APP_AGORA_APP_ID;
// Agora Routes
app.get('/api/agora/token', authMiddleware, async (req, res) => {
  try {
    if (!agoraService.isConfigured()) {
      console.error('Agora service not configured');
      return res.status(503).json({ 
        error: 'Agora service not configured',
        details: 'Missing AGORA_APP_ID or AGORA_APP_CERTIFICATE'
      });
    }
    
    const tokenData = agoraService.generateRtmToken(req.user._id.toString());
    res.json(tokenData);
  } catch (error) {
    console.error('RTM token generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate Agora token',
      details: error.message 
    });
  }
});

app.get('/api/agora/rtc-token', authMiddleware, async (req, res) => {
  try {
    const { channelName } = req.query;

    if (!channelName) {
      return res.status(400).json({ 
        error: 'Channel name is required' 
      });
    }

    console.log('Request RTC token for channel:', channelName, 'user:', req.user._id);

    if (!agoraService.isConfigured()) {
      console.error('Agora service not configured');
      return res.status(503).json({ 
        error: 'Agora service not configured',
        details: 'Missing AGORA_APP_ID or AGORA_APP_CERTIFICATE'
      });
    }

    const tokenData = agoraService.generateRtcToken(
      channelName,
      req.user._id.toString()
    );
    
    console.log('RTC token generated successfully');
    res.json(tokenData);
  } catch (error) {
    console.error('RTC token generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate RTC token', 
      details: error.message 
    });
  }
});


// Initialize default channels
async function initializeDefaultChannels() {
  const channelCount = await Channel.countDocuments();
  
  if (channelCount === 0) {
    const defaultChannels = [
      { name: 'general', category: 'General', description: 'General discussion', isPublic: true },
      { name: 'career-advice', category: 'Support', description: 'Career guidance and advice', isPublic: true },
      { name: 'mentorship', category: 'Support', description: 'Mentorship opportunities', isPublic: false },
      { name: 'networking', category: 'Community', description: 'Professional networking', isPublic: true },
      { name: 'support', category: 'Support', description: 'Emotional support and encouragement', isPublic: true },
      { name: 'wellness', category: 'Support', description: 'Mental health and wellness', isPublic: true }
    ];
    
    await Channel.insertMany(defaultChannels);
    console.log('Default channels created');
  }
}

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  await initializeDefaultChannels();
});