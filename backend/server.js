// server.js - FINAL VERSION - All Issues Fixed + Ratings System
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const { RtcTokenBuilder, RtcRole } = require('agora-access-token');
const { RtmTokenBuilder, RtmRole } = require('agora-access-token');

dotenv.config();

// Content Filter
const contentFilter = require('./contentFilter');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/support-platform', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

console.log('🔑 AGORA_APP_ID:', process.env.AGORA_APP_ID);
console.log('🔐 AGORA_APP_CERTIFICATE:', process.env.AGORA_APP_CERTIFICATE ? 'Configured' : 'Missing');

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
  gender: String,
  age: Number,
  education: String,
  school: String,
  assignedChannels: [String],
  isAdmin: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const AssessmentResultSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  answers: Object,
  score: Number,
  gender: String,
  age: Number,
  education: String,
  submittedAt: { type: Date, default: Date.now }
});

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

// 🌟 NEW: Rating Schema
const RatingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, maxlength: 500 },
  isAnonymous: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', UserSchema);
const Channel = mongoose.model('Channel', ChannelSchema);
const Message = mongoose.model('Message', MessageSchema);
const Assessment = mongoose.model('Assessment', AssessmentSchema);
const AssessmentResult = mongoose.model('AssessmentResult', AssessmentResultSchema);
const Rating = mongoose.model('Rating', RatingSchema);

// 🎯 CRITICAL FIX: Better voice users tracking with userId mapping
const activeVoiceUsers = new Map(); // channelName -> Map(uid -> {username, userId, joinedAt})
const uidToUserIdMap = new Map(); // uid -> userId (for reverse lookup)

// Middleware to verify JWT token
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) throw new Error();

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    // Allow admin-only tokens (no userId) to pass through
    if (decoded.adminAccess || decoded.isAdmin) {
      req.user = { isAdmin: true, adminAccess: true };
      req.token = token;
      req.decoded = decoded;
      return next();
    }

    // For regular users, require userId
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

    if (!decoded.adminAccess && !decoded.isAdmin) {
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

// Authentication function for Agora endpoints
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
}

// Helper function: String to hash
function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

// 🔥 NEW: Get username by UID (for realtime lookup)
async function getUsernameByUid(uid) {
  try {
    // Check if we have userId mapping
    const userId = uidToUserIdMap.get(uid);
    if (userId) {
      const user = await User.findById(userId);
      if (user) {
        return user.displayName || user.email.split('@')[0];
      }
    }

    // Check in active voice users
    for (const [channel, users] of activeVoiceUsers.entries()) {
      const userData = users.get(uid);
      if (userData && userData.username) {
        return userData.username;
      }
    }

    return `Misafir ${String(uid).slice(-4)}`;
  } catch (error) {
    console.error('getUsernameByUid error:', error);
    return `Misafir ${String(uid).slice(-4)}`;
  }
}

// ========================================
// ROUTES (keeping existing routes same)
// ========================================

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// 🌟 NEW: Rating Routes

// Submit a rating (authenticated users)
app.post('/api/ratings', authMiddleware, async (req, res) => {
  try {
    const { rating, comment, isAnonymous } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Geçerli bir puan seçiniz (1-5)' });
    }

    // Check if user already rated
    const existingRating = await Rating.findOne({ userId: req.user._id });

    if (existingRating) {
      // Update existing rating
      existingRating.rating = rating;
      existingRating.comment = comment || '';
      existingRating.isAnonymous = isAnonymous !== undefined ? isAnonymous : true;
      existingRating.createdAt = new Date();
      await existingRating.save();

      return res.json({
        success: true,
        message: 'Değerlendirmeniz güncellendi',
        rating: existingRating
      });
    }

    // Create new rating
    const newRating = new Rating({
      userId: req.user._id,
      rating,
      comment: comment || '',
      isAnonymous: isAnonymous !== undefined ? isAnonymous : true
    });

    await newRating.save();

    res.status(201).json({
      success: true,
      message: 'Değerlendirmeniz kaydedildi',
      rating: newRating
    });
  } catch (error) {
    console.error('Rating submission error:', error);
    res.status(500).json({ error: 'Değerlendirme gönderilemedi' });
  }
});

// Get user's own rating
app.get('/api/ratings/mine', authMiddleware, async (req, res) => {
  try {
    const rating = await Rating.findOne({ userId: req.user._id });
    res.json(rating || null);
  } catch (error) {
    console.error('Get user rating error:', error);
    res.status(500).json({ error: 'Değerlendirme getirilemedi' });
  }
});

// Admin: Get all ratings
app.get('/api/ratings', adminMiddleware, async (req, res) => {
  try {
    const ratings = await Rating.find()
      .sort({ createdAt: -1 })
      .populate('userId', 'email displayName');

    const formattedRatings = ratings.map(r => ({
      id: r._id,
      rating: r.rating,
      comment: r.comment,
      isAnonymous: r.isAnonymous,
      username: r.isAnonymous ? 'Anonim Kullanıcı' : (r.userId?.displayName || r.userId?.email || 'Kullanıcı'),
      createdAt: r.createdAt
    }));

    res.json(formattedRatings);
  } catch (error) {
    console.error('Get ratings error:', error);
    res.status(500).json({ error: 'Değerlendirmeler getirilemedi' });
  }
});

// Admin: Get rating statistics
app.get('/api/ratings/stats', adminMiddleware, async (req, res) => {
  try {
    const ratings = await Rating.find();

    const totalRatings = ratings.length;
    const avgRating = totalRatings > 0
      ? (ratings.reduce((sum, r) => sum + r.rating, 0) / totalRatings).toFixed(2)
      : 0;

    const ratingDistribution = {
      5: ratings.filter(r => r.rating === 5).length,
      4: ratings.filter(r => r.rating === 4).length,
      3: ratings.filter(r => r.rating === 3).length,
      2: ratings.filter(r => r.rating === 2).length,
      1: ratings.filter(r => r.rating === 1).length
    };

    const withComments = ratings.filter(r => r.comment && r.comment.trim().length > 0).length;

    res.json({
      totalRatings,
      avgRating,
      ratingDistribution,
      withComments
    });
  } catch (error) {
    console.error('Get rating stats error:', error);
    res.status(500).json({ error: 'İstatistikler getirilemedi' });
  }
});

// Admin: Delete a rating
app.delete('/api/ratings/:id', adminMiddleware, async (req, res) => {
  try {
    await Rating.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Değerlendirme silindi' });
  } catch (error) {
    console.error('Delete rating error:', error);
    res.status(500).json({ error: 'Değerlendirme silinemedi' });
  }
});

app.get('/api/assessment/results', adminMiddleware, async (req, res) => {
  try {
    const results = await AssessmentResult.find()
      .select('gender age education score submittedAt answers')
      .sort({ submittedAt: -1 });

    const formattedResults = results.map((result) => ({
      id: result._id,
      gender: result.gender,
      age: result.age,
      education: result.education,
      score: result.score,
      percentage: Math.round((result.score / 16) * 100),
      submittedAt: result.submittedAt,
      answers: result.answers || {}
    }));

    res.json(formattedResults);
  } catch (error) {
    console.error('Fetch results error:', error);
    res.status(500).json({ error: 'Sonuçlar getirilemedi' });
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

    const genderDistribution = results.reduce((acc, r) => {
      acc[r.gender] = (acc[r.gender] || 0) + 1;
      return acc;
    }, {});

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

app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, gender, age, education, school } = req.body;

    if (!email || !password || !gender || !age || !education) {
      return res.status(400).json({ error: 'Tüm alanlar gereklidir' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Bu e-mail zaten kayıtlı' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      email,
      password: hashedPassword,
      gender,
      age: parseInt(age),
      education,
      school: school || null
    });

    await user.save();

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

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Yanlış Kullanıcı adı veya şifre' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Yanlış Kullanıcı adı veya şifre' });
    }

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
    res.status(500).json({ error: 'Giriş başarısız oldu' });
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

    const isValid = await bcrypt.compare(password, ADMIN_PASSWORD_HASH);

    if (!isValid) {
      return res.status(401).json({ error: 'Geçersiz şifre' });
    }

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

app.get('/api/assessment', authMiddleware, async (req, res) => {
  try {
    let assessment = await Assessment.findOne().sort({ createdAt: -1 });

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

    const score = Object.values(answers).filter(answer => answer === 'yes').length;

    const assessmentResult = new AssessmentResult({
      userId: req.user._id,
      answers,
      score,
      gender: req.user.gender,
      age: req.user.age,
      education: req.user.education
    });

    await assessmentResult.save();

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          assessmentAnswers: answers,
          assessmentScore: score,
          hasCompletedAssessment: true,
          assignedChannels: ['general', 'support']
        }
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    }

    res.json({
      success: true,
      score,
      totalQuestions: 16,
      percentage: Math.round((score / 16) * 100),
      assignedChannels: updatedUser.assignedChannels
    });
  } catch (error) {
    console.error('Assessment submission error:', error);
    res.status(500).json({ error: 'Anket gönderilemedi', details: error.message });
  }
});

app.get('/api/channels', authMiddleware, async (req, res) => {
  try {
    // Admin sees all channels
    // Regular users see: public channels OR channels in their assignedChannels
    const query = req.user.isAdmin
      ? {}
      : {
        $or: [
          { isPublic: true },
          { name: { $in: req.user.assignedChannels || [] } }
        ]
      };

    const channels = await Channel.find(query);
    res.json(channels);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch channels' });
  }
});

app.get('/api/channels/all', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

        if (decoded.adminAccess || decoded.isAdmin) {
          const channels = await Channel.find({});
          return res.json(channels);
        }
        const channels = await Channel.find({ isPublic: true });
        return res.json(channels);
      } catch (err) {
        const channels = await Channel.find({ isPublic: true });
        return res.json(channels);
      }
    }

    const channels = await Channel.find({ isPublic: true });
    res.json(channels);
  } catch (error) {
    console.error('❌ Channels fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch channels' });
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

    // Content filter check
    const filterResult = contentFilter.checkMessage(text);
    if (!filterResult.isClean) {
      return res.status(400).json({
        error: 'filtered',
        message: contentFilter.getWarningMessage(filterResult.category),
        category: contentFilter.getCategoryDisplayName(filterResult.category)
      });
    }

    const message = new Message({
      channelId: req.params.channelId,
      userId: req.user._id,
      username: req.user.displayName || req.user.email.split('@')[0],
      text,
      isAnonymous: req.user.isAnonymous
    });

    await message.save();

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

app.delete('/api/channels/:channelId/messages/:messageId', authMiddleware, async (req, res) => {
  try {
    const { channelId, messageId } = req.params;

    const message = await Message.findOne({
      _id: messageId,
      channelId: channelId
    });

    if (!message) {
      return res.status(404).json({ error: 'Mesaj bulunamadı' });
    }

    if (message.userId !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({ error: 'Bu mesajı silme yetkiniz yok' });
    }

    await Message.findByIdAndDelete(messageId);

    res.json({ success: true, message: 'Mesaj silindi' });
  } catch (error) {
    console.error('Mesaj silme hatası:', error);
    res.status(500).json({ error: 'Mesaj silinemedi' });
  }
});

app.delete('/api/channels/:channelId/messages', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { channelId } = req.params;

    const result = await Message.deleteMany({ channelId: channelId });

    res.json({
      success: true,
      message: `${result.deletedCount} mesaj silindi`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Kanal mesajları silme hatası:', error);
    res.status(500).json({ error: 'Mesajlar silinemedi' });
  }
});

app.get('/api/profile', authMiddleware, async (req, res) => {
  try {
    const assessmentAnswers = req.user.assessmentAnswers || {};
    const totalQuestions = Object.keys(assessmentAnswers).length;
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

// ========================================
// 🔥 AGORA ROUTES - COMPLETELY FIXED
// ========================================

app.get('/api/agora/token', authenticateToken, async (req, res) => {
  try {
    const AGORA_APP_ID = process.env.AGORA_APP_ID;
    const AGORA_APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE;

    if (!AGORA_APP_ID || !AGORA_APP_CERTIFICATE) {
      return res.status(500).json({ error: 'Agora credentials not configured' });
    }

    const userId = req.user.userId.toString();

    const currentTimestamp = Math.floor(Date.now() / 1000);
    const expirationTimeInSeconds = 3600 * 24;
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

    const token = RtmTokenBuilder.buildToken(
      AGORA_APP_ID,
      AGORA_APP_CERTIFICATE,
      userId,
      RtmRole.Rtm_User,
      privilegeExpiredTs
    );

    console.log('✅ RTM Token generated for user:', userId);

    res.json({
      appId: AGORA_APP_ID,
      token: token,
      userId: userId,
      expiresAt: privilegeExpiredTs
    });

  } catch (error) {
    console.error('❌ RTM Token error:', error);
    res.status(500).json({
      error: 'Failed to generate RTM token',
      details: error.message
    });
  }
});

// 🔥 CRITICAL FIX: RTC Token with REALTIME user tracking
app.get('/api/agora/rtc-token', authenticateToken, async (req, res) => {
  try {
    const { channelName } = req.query;

    if (!channelName) {
      return res.status(400).json({ error: 'Channel name is required' });
    }

    const AGORA_APP_ID = process.env.AGORA_APP_ID;
    const AGORA_APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE;

    if (!AGORA_APP_ID || !AGORA_APP_CERTIFICATE) {
      return res.status(500).json({ error: 'Agora credentials not configured' });
    }

    const expirationTimeInSeconds = 86400;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

    // Generate UID - MongoDB ObjectId must use hashCode
    // Note: parseInt("679abc...") incorrectly returns 679, not NaN
    let uid = 0;
    const userIdStr = req.user.userId.toString();

    // Only use parseInt if userId is purely numeric (e.g., "12345")
    if (/^\d+$/.test(userIdStr)) {
      uid = parseInt(userIdStr, 10);
      // Ensure UID fits in 32-bit integer for Agora
      if (uid > 0xFFFFFFFF) {
        uid = uid % 0xFFFFFFFF;
      }
    } else {
      // MongoDB ObjectId or other non-numeric ID - use hash
      uid = hashCode(userIdStr);
    }

    // Get username from database
    let username = 'Kullanıcı';
    try {
      const user = await User.findById(req.user.userId);
      username = user?.displayName || user?.email?.split('@')[0] || `User${uid}`;
    } catch (error) {
      console.log('User info fetch failed, using default');
      username = `User${uid}`;
    }

    // Build RTC token
    const token = RtcTokenBuilder.buildTokenWithUid(
      AGORA_APP_ID,
      AGORA_APP_CERTIFICATE,
      channelName,
      uid,
      RtcRole.PUBLISHER,
      privilegeExpiredTs
    );

    // 🎯 CRITICAL: Store user mapping (userIdStr already declared above)
    uidToUserIdMap.set(uid, userIdStr);

    // Track active user in channel
    if (!activeVoiceUsers.has(channelName)) {
      activeVoiceUsers.set(channelName, new Map());
    }

    // 🔥 UPDATE: Always update/overwrite user data to keep it fresh
    activeVoiceUsers.get(channelName).set(uid, {
      username,
      userId: userIdStr,
      joinedAt: Date.now()
    });

    // Clean up old users (older than 2 hours) AND empty channels
    const twoHoursAgo = Date.now() - (2 * 60 * 60 * 1000);

    for (const [ch, users] of activeVoiceUsers.entries()) {
      for (const [u, data] of users.entries()) {
        if (data.joinedAt < twoHoursAgo) {
          users.delete(u);
          uidToUserIdMap.delete(u);
        }
      }
      if (users.size === 0) {
        activeVoiceUsers.delete(ch);
      }
    }

    // 🎯 CRITICAL FIX: Get ALL current channel users (not just cached)
    const channelUsers = [];
    if (activeVoiceUsers.has(channelName)) {
      for (const [u, data] of activeVoiceUsers.get(channelName).entries()) {
        // Don't include self in the list if you want, but usually it helps to know everyone
        channelUsers.push({
          uid: u,
          username: data.username,
          userId: data.userId
        });
      }
    }

    console.log(`✅ RTC Token generated for ${username} (UID: ${uid}) in channel ${channelName}`);
    console.log(`👥 Active users in ${channelName}:`, channelUsers.length, channelUsers.map(u => u.username));

    res.json({
      appId: AGORA_APP_ID,
      channelName: channelName,
      token: token,
      uid: uid,
      username: username,
      channelUsers: channelUsers, // ALL current users
      expiresAt: privilegeExpiredTs
    });

  } catch (error) {
    console.error('❌ RTC Token error:', error);
    res.status(500).json({ error: 'Failed to generate RTC token' });
  }
});

// 🔥 NEW ENDPOINT: Get username by UID (for realtime lookup)
app.get('/api/agora/user/:uid', authenticateToken, async (req, res) => {
  try {
    const uid = parseInt(req.params.uid);
    const username = await getUsernameByUid(uid);

    res.json({ uid, username });
  } catch (error) {
    console.error('Get username error:', error);
    res.status(500).json({ error: 'Failed to get username' });
  }
});

// Get voice channel user count (no auth required - for Discord-style preview)
app.get('/api/agora/voice-users/:channelName', async (req, res) => {
  try {
    const { channelName } = req.params;
    const channelUsers = activeVoiceUsers.get(channelName);

    if (!channelUsers || channelUsers.size === 0) {
      return res.json({ count: 0, users: [] });
    }

    const users = [];
    for (const [uid, data] of channelUsers.entries()) {
      users.push({
        uid,
        username: data.username
      });
    }

    res.json({
      count: users.length,
      users: users
    });
  } catch (error) {
    console.error('Get voice users error:', error);
    res.status(500).json({ error: 'Failed to get voice users', count: 0 });
  }
});

// ========================================
// INITIALIZE DEFAULT DATA
// ========================================

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
    console.log('✅ Default channels created');
  }
}

// ========================================
// START SERVER
// ========================================

const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📡 API: http://localhost:${PORT}/api`);
  console.log(`🔐 Agora: ${process.env.AGORA_APP_ID ? 'Configured' : 'Missing'}`);
  await initializeDefaultChannels();
});
