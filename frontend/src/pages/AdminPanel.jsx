import React, { useState, useEffect } from 'react';
import { Trash2, Plus, X, MessageSquare, Users, Settings, BarChart3, Eye, Download, Filter, LogOut, Lock, Menu, Star } from 'lucide-react';

export default function UnifiedAdminPanel() {
  const [token, setToken] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState('channels');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [initializing, setInitializing] = useState(true);

  // Channel management
  const [channels, setChannels] = useState([]);
  const [showAddChannel, setShowAddChannel] = useState(false);
  const [newChannel, setNewChannel] = useState({
    name: '',
    category: 'Support',
    description: '',
    isPublic: true
  });

  const [selectedChannel, setSelectedChannel] = useState(null);
  const [messages, setMessages] = useState([]);

  // Assessment results
  const [stats, setStats] = useState(null);
  const [assessmentResults, setAssessmentResults] = useState([]);
  const [filteredResults, setFilteredResults] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    ageMin: '',
    ageMax: '',
    scoreMin: '',
    scoreMax: '',
    sortBy: 'score-desc',
    school: ''
  });

  // Ratings state
  const [ratingsStats, setRatingsStats] = useState(null);
  const [ratings, setRatings] = useState([]);

  const [confirmDialog, setConfirmDialog] = useState({
    show: false,
    title: '',
    message: '',
    onConfirm: null
  });

  const API_URL = import.meta.env.VITE_API_URL;

  const handleLogin = async () => {
    if (!password) {
      setError('Şifre gereklidir');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/api/auth/admin-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });

      const data = await response.json();

      console.log('Login response:', { ok: response.ok, status: response.status, hasToken: !!data.token });

      if (response.ok && data.token) {
        setToken(data.token);
        setIsAuthenticated(true);
        localStorage.setItem('adminToken', data.token);
        setPassword('');

        // Wait a bit for token to propagate
        await new Promise(resolve => setTimeout(resolve, 100));

        // Try to load data with the new token
        await loadChannels(data.token);
        await loadStats(data.token);
      } else {
        setError(data.error || 'Giriş başarısız');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Bağlantı hatası. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  const loadChannels = async (authToken = null) => {
    try {
      const tokenToUse = authToken || token;
      console.log('Loading channels with token:', tokenToUse ? 'Present' : 'Missing');

      const response = await fetch(`${API_URL}/api/channels/all`, {
        headers: {
          'Authorization': `Bearer ${tokenToUse}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Channels response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Channels error:', errorData);
        setChannels([]);
        return;
      }

      const data = await response.json();
      console.log('Channels loaded:', data.length);
      setChannels(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Kanallar yüklenemedi:', error.message);
      setChannels([]);
    }
  };

  const loadRatingsStats = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      console.log('Loading rating stats with token:', token ? 'Present' : 'Missing');

      const response = await fetch(`${API_URL}/api/ratings/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Rating stats response status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log('Rating stats loaded successfully');
      setRatingsStats(data);
    } catch (error) {
      console.error('Rating stats yüklenemedi:', error.message);
      setRatingsStats(null);
    }
  };

  const loadRatings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      console.log('Loading ratings with token:', token ? 'Present' : 'Missing');

      const response = await fetch(`${API_URL}/api/ratings`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Ratings response status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log('Ratings loaded:', data.length);
      setRatings(data);
    } catch (error) {
      console.error('Ratings yüklenemedi:', error);
      setError('Değerlendirmeler yüklenirken bir hata oluştu: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRating = async (ratingId) => {
    if (!confirm('Bu değerlendirmeyi silmek istediğinize emin misiniz?')) {
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/api/ratings/${ratingId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        await loadRatings();
        await loadRatingsStats();
        alert('Değerlendirme silindi');
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert('Değerlendirme silinemedi: ' + (errorData.error || 'Bilinmeyen hata'));
      }
    } catch (error) {
      console.error('Delete rating error:', error);
      alert('Değerlendirme silinemedi: ' + error.message);
    }
  };

  const handleAddChannel = async () => {
    try {
      console.log('Adding channel with token:', token ? 'Present' : 'Missing');

      const response = await fetch(`${API_URL}/api/channels`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newChannel)
      });

      console.log('Add channel response:', response.status);

      if (response.ok) {
        setShowAddChannel(false);
        setNewChannel({ name: '', category: 'Support', description: '', isPublic: true });
        await loadChannels();
        alert('Kanal başarıyla eklendi');
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Add channel error:', errorData);
        alert('Kanal eklenemedi: ' + (errorData.error || 'Bilinmeyen hata'));
      }
    } catch (error) {
      console.error('Add channel error:', error);
      alert('Kanal eklenemedi: ' + error.message);
    }
  };

  const handleDeleteChannel = async (channelId) => {
    setConfirmDialog({
      show: true,
      title: 'Kanalı Sil',
      message: 'Bu kanalı silmek istediğinize emin misiniz?',
      onConfirm: async () => {
        try {
          console.log('Deleting channel with token:', token ? 'Present' : 'Missing');

          const response = await fetch(`${API_URL}/api/channels/${channelId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          console.log('Delete channel response:', response.status);

          if (response.ok) {
            await loadChannels();
            alert('Kanal silindi');
          } else {
            const errorData = await response.json().catch(() => ({}));
            console.error('Delete channel error:', errorData);
            alert('Kanal silinemedi: ' + (errorData.error || 'Bilinmeyen hata'));
          }
        } catch (error) {
          console.error('Delete channel error:', error);
          alert('Kanal silinemedi: ' + error.message);
        }
        setConfirmDialog({ show: false, title: '', message: '', onConfirm: null });
      }
    });
  };

  const loadMessages = async (channelId) => {
    try {
      console.log('Loading messages with token:', token ? 'Present' : 'Missing');

      const response = await fetch(`${API_URL}/api/channels/${channelId}/messages`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Messages response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Messages error:', errorData);
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log('Messages loaded:', data.length);
      setMessages(Array.isArray(data) ? data : []);
      setSelectedChannel(channels.find(c => c._id === channelId));
    } catch (error) {
      console.error('Mesajlar yüklenemedi:', error);
      setMessages([]);
      setError('Mesajlar yüklenirken bir hata oluştu: ' + error.message);
    }
  };

  const handleDeleteMessage = async (channelId, messageId) => {
    try {
      console.log('Deleting message with token:', token ? 'Present' : 'Missing');

      const response = await fetch(`${API_URL}/api/channels/${channelId}/messages/${messageId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Delete message response:', response.status);

      if (response.ok) {
        await loadMessages(channelId);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Delete message error:', errorData);
        alert('Mesaj silinemedi: ' + (errorData.error || 'Bilinmeyen hata'));
      }
    } catch (error) {
      console.error('Delete message error:', error);
      alert('Mesaj silinemedi: ' + error.message);
    }
  };

  const handleClearChannel = async (channelId) => {
    setConfirmDialog({
      show: true,
      title: 'Tüm Mesajları Sil',
      message: 'Bu kanaldaki TÜM mesajları silmek istediğinize emin misiniz? Bu işlem geri alınamaz.',
      onConfirm: async () => {
        try {
          console.log('Clearing channel with token:', token ? 'Present' : 'Missing');

          const response = await fetch(`${API_URL}/api/channels/${channelId}/messages`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          console.log('Clear channel response:', response.status);

          if (response.ok) {
            await loadMessages(channelId);
            alert('Tüm mesajlar silindi');
          } else {
            const errorData = await response.json().catch(() => ({}));
            console.error('Clear channel error:', errorData);
            alert('Mesajlar silinemedi: ' + (errorData.error || 'Bilinmeyen hata'));
          }
        } catch (error) {
          console.error('Clear channel error:', error);
          alert('Mesajlar silinemedi: ' + error.message);
        }
        setConfirmDialog({ show: false, title: '', message: '', onConfirm: null });
      }
    });
  };

  const loadStats = async (authToken = null) => {
    try {
      const tokenToUse = authToken || token;
      console.log('Loading stats with token:', tokenToUse ? 'Present' : 'Missing');

      const response = await fetch(`${API_URL}/api/assessment/results/stats`, {
        headers: {
          'Authorization': `Bearer ${tokenToUse}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Stats response status:', response.status);

      if (response.status === 401) {
        throw new Error('Authentication expired');
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log('Stats loaded successfully');
      setStats(data);
    } catch (error) {
      console.error('İstatistikler yüklenemedi:', error.message);
      setStats(null);
    }
  };

  const loadAssessmentResults = async () => {
    try {
      setLoading(true);
      console.log('Loading assessment results with token:', token ? 'Present' : 'Missing');

      const response = await fetch(`${API_URL}/api/assessment/results`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Assessment results response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();

      const anonymized = data.map((result, index) => ({
        ...result,
        anonId: `K${index + 1}`
      }));

      console.log('Assessment results loaded:', anonymized.length);
      setAssessmentResults(anonymized);
      setError('');
    } catch (error) {
      console.error('Sonuçlar yüklenemedi:', error);
      setError('Sonuçlar yüklenirken bir hata oluştu: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Initial token validation
  useEffect(() => {
    const savedToken = localStorage.getItem('adminToken');
    if (savedToken) {
      const validateAndLoad = async () => {
        try {
          console.log('Validating saved token...');
          setToken(savedToken);
          setIsAuthenticated(true);

          await loadChannels(savedToken);
          await loadStats(savedToken);

        } catch (error) {
          console.log('Saved token is invalid, clearing session');
          localStorage.removeItem('adminToken');
          setIsAuthenticated(false);
          setToken('');
        } finally {
          setInitializing(false);
        }
      };

      validateAndLoad();
    } else {
      setInitializing(false);
    }
  }, []);

  // Tab changes
  useEffect(() => {
    if (!isAuthenticated) return;

    if (activeTab === 'results') {
      loadAssessmentResults();
    }
    if (activeTab === 'channels') {
      loadChannels().catch(err => console.log('Failed to load channels:', err.message));
    }
    if (activeTab === 'stats' && !stats) {
      loadStats().catch(err => console.log('Failed to load stats:', err.message));
    }
    if (activeTab === 'ratings') {
      loadRatings();
      loadRatingsStats();
    }
  }, [activeTab, isAuthenticated]);

  useEffect(() => {
    applyFilters();
  }, [assessmentResults, filters]);

  const applyFilters = () => {
    let filtered = [...assessmentResults];

    if (filters.ageMin) {
      filtered = filtered.filter(r => (r.age || 0) >= parseInt(filters.ageMin));
    }
    if (filters.ageMax) {
      filtered = filtered.filter(r => (r.age || 0) <= parseInt(filters.ageMax));
    }
    if (filters.school) {
      filtered = filtered.filter(r =>
        (r.education || '').toLowerCase() === filters.school.toLowerCase()
      );
    }
    if (filters.scoreMin) {
      filtered = filtered.filter(r => (r.score || 0) >= parseInt(filters.scoreMin));
    }
    if (filters.scoreMax) {
      filtered = filtered.filter(r => (r.score || 0) <= parseInt(filters.scoreMax));
    }

    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'score-desc':
          return (b.score || 0) - (a.score || 0);
        case 'score-asc':
          return (a.score || 0) - (b.score || 0);
        case 'age-desc':
          return (b.age || 0) - (a.age || 0);
        case 'age-asc':
          return (a.age || 0) - (b.age || 0);
        default:
          return 0;
      }
    });

    setFilteredResults(filtered);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const resetFilters = () => {
    setFilters({
      ageMin: '',
      ageMax: '',
      scoreMin: '',
      scoreMax: '',
      sortBy: 'score-desc',
      school: ''
    });
  };

  const exportToCSV = () => {
    const headers = ['ID', 'Yaş', 'Cinsiyet', 'Eğitim', 'Puan', 'Yüzde'];
    const csvContent = [
      headers.join(','),
      ...filteredResults.map(r => [
        r.anonId,
        r.age || '-',
        r.gender || '-',
        r.education || '-',
        r.score || 0,
        `${r.percentage || 0}%`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `anket-sonuclari-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToSPSS = async () => {
    try {
      setLoading(true);
      const adminToken = localStorage.getItem('adminToken');

      if (!adminToken) {
        setError('Oturum gereklidir');
        return;
      }

      const response = await fetch(`${API_URL}/api/assessment/results`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Veriler yüklenemedi');
      }

      const fullResults = await response.json();

      const schools = [...new Set(fullResults.map(r => r.education).filter(Boolean))].sort();
      const schoolMap = {};
      schools.forEach((school, index) => {
        schoolMap[school] = index + 1;
      });

      const totalQuestions = 16;

      const headers = ['ID', 'Okul', 'Yas', ...Array.from({ length: totalQuestions }, (_, i) => `Q${i + 1}`)];

      const csvRows = [headers.join(';')];

      fullResults.forEach((result, index) => {
        const row = [];

        row.push(index + 1);

        const schoolCode = result.education ? schoolMap[result.education] : 0;
        row.push(schoolCode);

        row.push(result.age || 0);

        const answers = result.answers || {};

        for (let i = 1; i <= totalQuestions; i++) {
          const questionKey = `q${i}`;
          const answer = answers[questionKey];

          let value = 0;
          if (answer) {
            const lowerAnswer = String(answer).toLowerCase().trim();
            if (lowerAnswer === 'yes' || lowerAnswer === 'evet' || lowerAnswer === '1' || lowerAnswer === 'true') {
              value = 1;
            }
          }

          row.push(value);
        }

        csvRows.push(row.join(';'));
      });

      const csvContent = csvRows.join('\n');

      let spssContent = '* SPSS Veri İçe Aktarma Komutu.\n';
      spssContent += '* Oluşturulma Tarihi: ' + new Date().toLocaleString('tr-TR') + '.\n';
      spssContent += '* Toplam Katılımcı: ' + fullResults.length + '.\n\n';

      spssContent += 'GET DATA\n';
      spssContent += '  /TYPE=TXT\n';
      spssContent += '  /FILE="spss-anket-' + new Date().toISOString().split('T')[0] + '.csv"\n';
      spssContent += '  /ENCODING=\'UTF8\'\n';
      spssContent += '  /DELCASE=LINE\n';
      spssContent += '  /DELIMITERS=";"\n';
      spssContent += '  /ARRANGEMENT=DELIMITED\n';
      spssContent += '  /FIRSTCASE=2\n';
      spssContent += '  /IMPORTCASE=ALL\n';
      spssContent += '  /VARIABLES=\n';
      spssContent += '  ID F8.0\n';
      spssContent += '  Okul F8.0\n';
      spssContent += '  Yas F8.0\n';
      for (let i = 1; i <= totalQuestions; i++) {
        spssContent += `  Q${i} F8.0\n`;
      }
      spssContent += '.\n\n';

      spssContent += 'EXECUTE.\n\n';

      spssContent += 'VARIABLE LABELS\n';
      spssContent += '  ID "Katılımcı ID"\n';
      spssContent += '  Okul "Okul Kodu"\n';
      spssContent += '  Yas "Yaş"\n';
      for (let i = 1; i <= totalQuestions; i++) {
        spssContent += `  Q${i} "Soru ${i}"\n`;
      }
      spssContent += '.\n\n';

      spssContent += 'VALUE LABELS\n';
      spssContent += '  Okul\n';
      schools.forEach((school, index) => {
        spssContent += `    ${index + 1} "${school}"\n`;
      });
      spssContent += '  /Q1 TO Q16\n';
      spssContent += '    0 "Hayır"\n';
      spssContent += '    1 "Evet"\n';
      spssContent += '.\n\n';

      spssContent += 'EXECUTE.\n\n';

      let codeBookContent = 'SPSS Veri Kodlama Klavuzu\n';
      codeBookContent += '=========================\n\n';
      codeBookContent += 'Tarih: ' + new Date().toLocaleDateString('tr-TR') + '\n';
      codeBookContent += 'Toplam Katılımcı: ' + fullResults.length + '\n\n';
      codeBookContent += 'SÜTUN AÇIKLAMALARI:\n';
      codeBookContent += '-------------------\n';
      codeBookContent += 'ID: Katılımcı numarası (1, 2, 3, ...)\n';
      codeBookContent += 'Okul: Okul kodu\n';
      codeBookContent += 'Yas: Katılımcının yaşı\n';
      codeBookContent += 'Q1-Q16: Soru cevapları (1=Evet, 0=Hayır)\n\n';
      codeBookContent += 'OKUL KODLARI:\n';
      codeBookContent += '-------------\n';
      schools.forEach((school, index) => {
        codeBookContent += `${index + 1} = ${school}\n`;
      });

      const BOM = '\uFEFF';
      const csvBlob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
      const csvLink = document.createElement('a');
      const csvUrl = URL.createObjectURL(csvBlob);

      csvLink.setAttribute('href', csvUrl);
      csvLink.setAttribute('download', `spss-anket-${new Date().toISOString().split('T')[0]}.csv`);
      csvLink.style.visibility = 'hidden';

      document.body.appendChild(csvLink);
      csvLink.click();
      document.body.removeChild(csvLink);

      setTimeout(() => {
        const spssBlob = new Blob([spssContent], { type: 'text/plain;charset=utf-8;' });
        const spssLink = document.createElement('a');
        const spssUrl = URL.createObjectURL(spssBlob);

        spssLink.setAttribute('href', spssUrl);
        spssLink.setAttribute('download', `spss-komutlar-${new Date().toISOString().split('T')[0]}.sps`);
        spssLink.style.visibility = 'hidden';

        document.body.appendChild(spssLink);
        spssLink.click();
        document.body.removeChild(spssLink);
      }, 500);

      setTimeout(() => {
        const codeBlob = new Blob([codeBookContent], { type: 'text/plain;charset=utf-8;' });
        const codeLink = document.createElement('a');
        const codeUrl = URL.createObjectURL(codeBlob);

        codeLink.setAttribute('href', codeUrl);
        codeLink.setAttribute('download', `spss-kodlama-klavuzu-${new Date().toISOString().split('T')[0]}.txt`);
        codeLink.style.visibility = 'hidden';

        document.body.appendChild(codeLink);
        codeLink.click();
        document.body.removeChild(codeLink);
      }, 1000);

      setError('');
      alert('3 dosya indirildi:\n1. CSV veri dosyası\n2. SPSS komut dosyası (.sps)\n3. Kodlama klavuzu\n\nSPSS\'te .sps dosyasını açın ve çalıştırın!');

    } catch (err) {
      console.error('SPSS export error:', err);
      setError('SPSS dosyası oluşturulamadı: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    setIsAuthenticated(false);
    setToken('');
    setChannels([]);
    setMessages([]);
    setAssessmentResults([]);
    setFilteredResults([]);
    setRatings([]);
    setRatingsStats(null);
    setError('');
  };

  const calculateStats = () => {
    if (filteredResults.length === 0) {
      return {
        avgScore: '0.0',
        highestScore: '0',
        avgAge: '0.0'
      };
    }

    const totalScore = filteredResults.reduce((sum, r) => sum + (r.score || 0), 0);
    const avgScore = (totalScore / filteredResults.length).toFixed(1);

    const highestScore = Math.max(...filteredResults.map(r => r.score || 0));

    const totalAge = filteredResults.reduce((sum, r) => sum + (r.age || 0), 0);
    const avgAge = (totalAge / filteredResults.length).toFixed(1);

    return {
      avgScore,
      highestScore: highestScore.toString(),
      avgAge
    };
  };

  if (initializing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-purple-300 text-lg">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-slate-900 to-slate-900" />

        <div className="relative bg-slate-800/50 backdrop-blur-xl rounded-3xl shadow-2xl border border-purple-500/20 p-10 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="bg-gradient-to-br from-purple-500 to-pink-500 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-purple-500/50">
              <Lock className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-3">
              Admin Panel
            </h1>
            <p className="text-purple-300/80 text-lg">Yönetim Sistemine Hoş Geldiniz</p>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-purple-300 mb-3">
                Yönetici Şifresi
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                className="w-full px-5 py-4 bg-slate-900/50 border border-purple-500/30 rounded-xl text-white placeholder-purple-300/40 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                placeholder="Şifrenizi girin"
                disabled={loading}
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-300 px-5 py-4 rounded-xl text-sm backdrop-blur-sm">
                {error}
              </div>
            )}

            <button
              onClick={handleLogin}
              disabled={loading || !password}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-xl font-bold text-lg hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg shadow-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Doğrulanıyor...' : 'Giriş Yap'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const resultsStats = calculateStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="bg-slate-800/50 backdrop-blur-xl border-b border-purple-500/20 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="bg-gradient-to-br from-purple-500 to-pink-500 w-12 h-12 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/50">
              <Settings className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                Admin Panel
              </h1>
              <p className="text-purple-300/60 text-sm">Merkezi Yönetim Sistemi</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 hover:bg-red-500/20 transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-semibold">Çıkış</span>
          </button>
        </div>
      </header>

      {error && (
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="bg-red-500/10 border border-red-500/30 text-red-300 px-6 py-4 rounded-xl backdrop-blur-sm">
            {error}
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Navigation Tabs */}
        <div className="bg-slate-800/30 backdrop-blur-xl rounded-2xl border border-purple-500/20 mb-8 overflow-hidden">
          <div className="flex overflow-x-auto">
            <button
              onClick={() => setActiveTab('channels')}
              className={`flex items-center space-x-3 px-8 py-5 font-semibold transition-all whitespace-nowrap ${activeTab === 'channels'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                  : 'text-purple-300 hover:bg-purple-500/10'
                }`}
            >
              <MessageSquare className="w-5 h-5" />
              <span>Kanallar</span>
            </button>
            <button
              onClick={() => setActiveTab('messages')}
              className={`flex items-center space-x-3 px-8 py-5 font-semibold transition-all whitespace-nowrap ${activeTab === 'messages'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                  : 'text-purple-300 hover:bg-purple-500/10'
                }`}
            >
              <Eye className="w-5 h-5" />
              <span>Mesajlar</span>
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`flex items-center space-x-3 px-8 py-5 font-semibold transition-all whitespace-nowrap ${activeTab === 'stats'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                  : 'text-purple-300 hover:bg-purple-500/10'
                }`}
            >
              <BarChart3 className="w-5 h-5" />
              <span>İstatistikler</span>
            </button>
            <button
              onClick={() => setActiveTab('results')}
              className={`flex items-center space-x-3 px-8 py-5 font-semibold transition-all whitespace-nowrap ${activeTab === 'results'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                  : 'text-purple-300 hover:bg-purple-500/10'
                }`}
            >
              <Users className="w-5 h-5" />
              <span>Anket Sonuçları</span>
            </button>
            <button
              onClick={() => setActiveTab('ratings')}
              className={`flex items-center space-x-3 px-8 py-5 font-semibold transition-all whitespace-nowrap ${activeTab === 'ratings'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                  : 'text-purple-300 hover:bg-purple-500/10'
                }`}
            >
              <Star className="w-5 h-5" />
              <span>Değerlendirmeler</span>
            </button>
          </div>
        </div>

        {/* Channels Tab */}
        {activeTab === 'channels' && (
          <div className="bg-slate-800/30 backdrop-blur-xl rounded-2xl border border-purple-500/20 p-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                Kanal Yönetimi
              </h2>
              <div className="flex gap-3">
                <button
                  onClick={() => loadChannels(token)}
                  className="flex items-center space-x-2 bg-slate-700/50 border border-purple-500/30 text-purple-300 px-4 py-3 rounded-xl hover:bg-slate-700 transition-all font-semibold"
                  disabled={loading}
                >
                  <Settings className="w-5 h-5" />
                  <span>Yenile</span>
                </button>
                <button
                  onClick={() => setShowAddChannel(true)}
                  className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg shadow-purple-500/30"
                >
                  <Plus className="w-5 h-5" />
                  <span>Yeni Kanal</span>
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {!channels || channels.length === 0 ? (
                <div className="text-center py-12 bg-slate-700/20 rounded-xl border border-purple-500/20">
                  <MessageSquare className="w-16 h-16 text-purple-400/50 mx-auto mb-4" />
                  <p className="text-purple-300/70 mb-2">Henüz kanal eklenmemiş</p>
                </div>
              ) : (
                channels.map((channel) => (
                  <div key={channel._id} className="bg-slate-700/30 backdrop-blur-sm border border-purple-500/20 rounded-xl p-6 hover:border-purple-500/40 transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-xl font-bold text-white">{channel.name}</h3>
                          <span className={`px-3 py-1 text-xs font-semibold rounded-full ${channel.isPublic ? 'bg-green-500/20 text-green-300 border border-green-500/30' : 'bg-red-500/20 text-red-300 border border-red-500/30'
                            }`}>
                            {channel.isPublic ? 'Genel' : 'Özel'}
                          </span>
                          <span className="px-3 py-1 text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-full">
                            {channel.category}
                          </span>
                        </div>
                        <p className="text-purple-300/70">{channel.description}</p>
                      </div>
                      <button
                        onClick={() => handleDeleteChannel(channel._id)}
                        className="ml-4 p-3 text-red-400 hover:bg-red-500/20 rounded-xl transition-all border border-transparent hover:border-red-500/30"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Messages Tab */}
        {activeTab === 'messages' && (
          <div className="bg-slate-800/30 backdrop-blur-xl rounded-2xl border border-purple-500/20 p-8">
            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-8">
              Mesaj Yönetimi
            </h2>

            {!selectedChannel ? (
              <div className="space-y-4">
                <p className="text-purple-300/70 mb-6">Mesajlarını görmek istediğiniz kanalı seçin:</p>
                {channels && channels.length > 0 ? (
                  channels.map((channel) => (
                    <button
                      key={channel._id}
                      onClick={() => loadMessages(channel._id)}
                      className="w-full text-left bg-slate-700/30 backdrop-blur-sm border border-purple-500/20 rounded-xl p-6 hover:border-purple-500/40 hover:bg-slate-700/50 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-bold text-white text-lg mb-1">{channel.name}</h3>
                          <p className="text-sm text-purple-300/70">{channel.description}</p>
                        </div>
                        <MessageSquare className="w-6 h-6 text-purple-400" />
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <p className="text-purple-300/50">Henüz kanal bulunmuyor</p>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => {
                        setSelectedChannel(null);
                        setMessages([]);
                      }}
                      className="text-purple-300 hover:text-purple-200 font-semibold"
                    >
                      ← Geri
                    </button>
                    <h3 className="text-xl font-bold text-white">
                      {selectedChannel.name} <span className="text-purple-400">({messages.length} mesaj)</span>
                    </h3>
                  </div>
                  {messages.length > 0 && (
                    <button
                      onClick={() => handleClearChannel(selectedChannel._id)}
                      className="flex items-center space-x-2 bg-red-500/20 border border-red-500/30 text-red-300 px-5 py-3 rounded-xl hover:bg-red-500/30 transition-all font-semibold"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Tüm Mesajları Sil</span>
                    </button>
                  )}
                </div>

                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {messages && messages.length === 0 ? (
                    <p className="text-center text-purple-300/50 py-12">Bu kanalda henüz mesaj yok</p>
                  ) : messages && messages.length > 0 ? (
                    messages.map((msg) => (
                      <div key={msg._id} className="bg-slate-700/30 backdrop-blur-sm border border-purple-500/20 rounded-xl p-5 hover:border-purple-500/40 transition-all">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-3">
                              <span className="font-bold text-white">
                                {msg.isAnonymous ? 'Anonim Kullanıcı' : msg.username}
                              </span>
                              <span className="text-xs text-purple-300/50">
                                {new Date(msg.createdAt).toLocaleString('tr-TR')}
                              </span>
                            </div>
                            <p className="text-purple-200">{msg.text}</p>
                          </div>
                          <button
                            onClick={() => handleDeleteMessage(selectedChannel._id, msg._id)}
                            className="ml-4 p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : null}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Ratings Tab */}
        {activeTab === 'ratings' && (
          <div className="space-y-8">
            {ratingsStats && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-yellow-600/20 to-orange-600/20 backdrop-blur-xl rounded-2xl border border-yellow-500/30 p-8">
                  <div className="text-sm text-yellow-300 mb-2">Toplam Değerlendirme</div>
                  <div className="text-4xl font-bold text-white">{ratingsStats.totalRatings || 0}</div>
                </div>
                <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 backdrop-blur-xl rounded-2xl border border-purple-500/30 p-8">
                  <div className="text-sm text-purple-300 mb-2">Ortalama Puan</div>
                  <div className="text-4xl font-bold text-white flex items-center gap-2">
                    {ratingsStats.avgRating || 0}
                    <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />
                  </div>
                </div>
                <div className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 backdrop-blur-xl rounded-2xl border border-blue-500/30 p-8">
                  <div className="text-sm text-blue-300 mb-2">Yorumlu</div>
                  <div className="text-4xl font-bold text-white">{ratingsStats.withComments || 0}</div>
                </div>
                <div className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 backdrop-blur-xl rounded-2xl border border-green-500/30 p-8">
                  <div className="text-sm text-green-300 mb-2">5 Yıldız</div>
                  <div className="text-4xl font-bold text-white">{ratingsStats.ratingDistribution?.[5] || 0}</div>
                </div>
              </div>
            )}

            {ratingsStats && (
              <div className="bg-slate-800/30 backdrop-blur-xl rounded-2xl border border-purple-500/20 p-8">
                <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-6">
                  Puan Dağılımı
                </h3>
                <div className="space-y-4">
                  {[5, 4, 3, 2, 1].map(star => {
                    const count = ratingsStats.ratingDistribution?.[star] || 0;
                    const percentage = ratingsStats.totalRatings > 0
                      ? Math.round((count / ratingsStats.totalRatings) * 100)
                      : 0;

                    return (
                      <div key={star} className="flex items-center gap-4">
                        <div className="flex items-center gap-1 w-20">
                          <span className="text-white font-semibold">{star}</span>
                          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                        </div>
                        <div className="flex-1 bg-gray-700 rounded-full h-6 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <div className="w-20 text-right">
                          <span className="text-white font-semibold">{count}</span>
                          <span className="text-gray-400 text-sm ml-2">({percentage}%)</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="bg-slate-800/30 backdrop-blur-xl rounded-2xl border border-purple-500/20 overflow-hidden">
              <div className="p-6 border-b border-purple-500/20">
                <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                  Tüm Değerlendirmeler
                </h2>
              </div>

              {loading ? (
                <div className="text-center py-16">
                  <div className="inline-block w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mb-4" />
                  <p className="text-purple-300">Yükleniyor...</p>
                </div>
              ) : ratings.length === 0 ? (
                <div className="text-center py-16">
                  <Star className="w-16 h-16 text-purple-400/50 mx-auto mb-4" />
                  <p className="text-purple-300/70 mb-2">Henüz değerlendirme yapılmamış</p>
                </div>
              ) : (
                <div className="divide-y divide-purple-500/10">
                  {ratings.map((rating) => (
                    <div key={rating.id} className="p-6 hover:bg-slate-700/30 transition-all">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map(star => (
                              <Star
                                key={star}
                                className={`w-5 h-5 ${star <= rating.rating
                                    ? 'text-yellow-400 fill-yellow-400'
                                    : 'text-gray-600'
                                  }`}
                              />
                            ))}
                          </div>
                          <span className="text-white font-semibold">
                            {rating.username}
                          </span>
                          {rating.isAnonymous && (
                            <span className="px-2 py-1 text-xs bg-gray-700 text-gray-300 rounded-full">
                              Anonim
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-gray-400">
                            {new Date(rating.createdAt).toLocaleString('tr-TR')}
                          </span>
                          <button
                            onClick={() => handleDeleteRating(rating.id)}
                            className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      {rating.comment && (
                        <p className="text-purple-200 bg-gray-900/50 rounded-lg p-4 mt-3">
                          "{rating.comment}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Stats Tab */}
        {activeTab === 'stats' && stats && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 backdrop-blur-xl rounded-2xl border border-purple-500/30 p-8">
                <div className="text-sm text-purple-300 mb-2">Toplam Katılımcı</div>
                <div className="text-4xl font-bold text-white">{stats.totalResults || 0}</div>
              </div>
              <div className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 backdrop-blur-xl rounded-2xl border border-blue-500/30 p-8">
                <div className="text-sm text-blue-300 mb-2">Ortalama Skor</div>
                <div className="text-4xl font-bold text-white">{stats.avgScore || 0}/16</div>
              </div>
              <div className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 backdrop-blur-xl rounded-2xl border border-green-500/30 p-8">
                <div className="text-sm text-green-300 mb-2">En Yüksek Skor</div>
                <div className="text-4xl font-bold text-white">{stats.highestScore || 0}</div>
              </div>
              <div className="bg-gradient-to-br from-orange-600/20 to-red-600/20 backdrop-blur-xl rounded-2xl border border-orange-500/30 p-8">
                <div className="text-sm text-orange-300 mb-2">Ortalama Yaş</div>
                <div className="text-4xl font-bold text-white">{stats.avgAge || 0}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-800/30 backdrop-blur-xl rounded-2xl border border-purple-500/20 p-8">
                <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-6">
                  Cinsiyet Dağılımı
                </h3>
                <div className="space-y-4">
                  {stats.genderDistribution && Object.keys(stats.genderDistribution).length > 0 ? (
                    Object.entries(stats.genderDistribution).map(([gender, count]) => (
                      <div key={gender} className="flex items-center justify-between bg-slate-700/30 p-4 rounded-xl border border-purple-500/20">
                        <span className="text-purple-200 capitalize font-semibold">{gender}</span>
                        <span className="font-bold text-white text-xl">{count}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-purple-300/50 text-center py-4">Henüz veri yok</p>
                  )}
                </div>
              </div>

              <div className="bg-slate-800/30 backdrop-blur-xl rounded-2xl border border-purple-500/20 p-8">
                <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-6">
                  Eğitim Durumu
                </h3>
                <div className="space-y-4">
                  {stats.educationDistribution && Object.keys(stats.educationDistribution).length > 0 ? (
                    Object.entries(stats.educationDistribution).map(([edu, count]) => (
                      <div key={edu} className="flex items-center justify-between bg-slate-700/30 p-4 rounded-xl border border-purple-500/20">
                        <span className="text-purple-200 font-semibold">{edu}</span>
                        <span className="font-bold text-white text-xl">{count}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-purple-300/50 text-center py-4">Henüz veri yok</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Results Tab */}
        {activeTab === 'results' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 backdrop-blur-xl rounded-2xl border border-purple-500/30 p-8">
                <div className="text-sm text-purple-300 mb-2">Gösterilen Sonuçlar</div>
                <div className="text-4xl font-bold text-white">{filteredResults.length}</div>
              </div>
              <div className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 backdrop-blur-xl rounded-2xl border border-blue-500/30 p-8">
                <div className="text-sm text-blue-300 mb-2">Ortalama Puan</div>
                <div className="text-4xl font-bold text-white">{resultsStats.avgScore}</div>
              </div>
              <div className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 backdrop-blur-xl rounded-2xl border border-green-500/30 p-8">
                <div className="text-sm text-green-300 mb-2">En Yüksek</div>
                <div className="text-4xl font-bold text-white">{resultsStats.highestScore}</div>
              </div>
              <div className="bg-gradient-to-br from-orange-600/20 to-red-600/20 backdrop-blur-xl rounded-2xl border border-orange-500/30 p-8">
                <div className="text-sm text-orange-300 mb-2">Ortalama Yaş</div>
                <div className="text-4xl font-bold text-white">{resultsStats.avgAge}</div>
              </div>
            </div>

            <div className="bg-slate-800/30 backdrop-blur-xl rounded-2xl border border-purple-500/20 p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 flex items-center gap-3">
                  <Filter className="w-6 h-6" />
                  Filtreler ve Dışa Aktarma
                </h2>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="text-purple-300 hover:text-purple-200 font-semibold"
                >
                  {showFilters ? 'Gizle' : 'Göster'}
                </button>
              </div>

              {showFilters && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-purple-300 mb-2">
                        Minimum Yaş
                      </label>
                      <input
                        type="number"
                        name="ageMin"
                        value={filters.ageMin}
                        onChange={handleFilterChange}
                        placeholder="Min yaş"
                        className="w-full px-4 py-3 rounded-xl bg-slate-700/50 text-white border border-purple-500/30 focus:ring-2 focus:ring-purple-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-purple-300 mb-2">
                        Maksimum Yaş
                      </label>
                      <input
                        type="number"
                        name="ageMax"
                        value={filters.ageMax}
                        onChange={handleFilterChange}
                        placeholder="Max yaş"
                        className="w-full px-4 py-3 rounded-xl bg-slate-700/50 text-white border border-purple-500/30 focus:ring-2 focus:ring-purple-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-purple-300 mb-2">
                        Minimum Puan
                      </label>
                      <input
                        type="number"
                        name="scoreMin"
                        value={filters.scoreMin}
                        onChange={handleFilterChange}
                        placeholder="Min puan"
                        min="0"
                        max="16"
                        className="w-full px-4 py-3 rounded-xl bg-slate-700/50 text-white border border-purple-500/30 focus:ring-2 focus:ring-purple-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-purple-300 mb-2">
                        Maksimum Puan
                      </label>
                      <input
                        type="number"
                        name="scoreMax"
                        value={filters.scoreMax}
                        onChange={handleFilterChange}
                        placeholder="Max puan"
                        min="0"
                        max="16"
                        className="w-full px-4 py-3 rounded-xl bg-slate-700/50 text-white border border-purple-500/30 focus:ring-2 focus:ring-purple-500 outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-purple-300 mb-2">
                        Okul
                      </label>
                      <select
                        name="school"
                        value={filters.school}
                        onChange={handleFilterChange}
                        className="w-full px-4 py-3 rounded-xl bg-slate-700/50 text-white border border-purple-500/30 focus:ring-2 focus:ring-purple-500 outline-none"
                      >
                        <option value="">Tümü</option>
                        {assessmentResults && assessmentResults.length > 0 &&
                          [...new Set(assessmentResults.map(r => r.education).filter(Boolean))].sort().map((school, idx) => (
                            <option key={idx} value={school}>{school}</option>
                          ))
                        }
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-purple-300 mb-2">
                        Sıralama
                      </label>
                      <select
                        name="sortBy"
                        value={filters.sortBy}
                        onChange={handleFilterChange}
                        className="w-full px-4 py-3 rounded-xl bg-slate-700/50 text-white border border-purple-500/30 focus:ring-2 focus:ring-purple-500 outline-none"
                      >
                        <option value="score-desc">Puan (Yüksekten Düşüğe)</option>
                        <option value="score-asc">Puan (Düşükten Yükseğe)</option>
                        <option value="age-desc">Yaş (Büyükten Küçüğe)</option>
                        <option value="age-asc">Yaş (Küçükten Büyüğe)</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 pt-4 border-t border-purple-500/20">
                    <button
                      onClick={resetFilters}
                      className="px-6 py-3 rounded-xl bg-slate-700/50 hover:bg-slate-700 text-white transition-all border border-purple-500/30"
                    >
                      Filtreleri Sıfırla
                    </button>
                    <button
                      onClick={exportToCSV}
                      className="px-6 py-3 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white transition-all flex items-center gap-2 shadow-lg"
                    >
                      <Download className="w-4 h-4" />
                      CSV İndir
                    </button>
                    <button
                      onClick={exportToSPSS}
                      className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white transition-all flex items-center gap-2 shadow-lg"
                    >
                      <Download className="w-4 h-4" />
                      SPSS İndir
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-slate-800/30 backdrop-blur-xl rounded-2xl border border-purple-500/20 overflow-hidden">
              {loading ? (
                <div className="text-center py-16">
                  <div className="inline-block w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mb-4" />
                  <p className="text-purple-300">Yükleniyor...</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-slate-700/50 border-b border-purple-500/20">
                          <th className="px-6 py-4 text-left text-sm font-bold text-purple-300">ID</th>
                          <th className="px-6 py-4 text-left text-sm font-bold text-purple-300">Yaş</th>
                          <th className="px-6 py-4 text-left text-sm font-bold text-purple-300">Cinsiyet</th>
                          <th className="px-6 py-4 text-left text-sm font-bold text-purple-300">Eğitim</th>
                          <th className="px-6 py-4 text-left text-sm font-bold text-purple-300">Puan</th>
                          <th className="px-6 py-4 text-left text-sm font-bold text-purple-300">Yüzde</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredResults.length === 0 ? (
                          <tr>
                            <td colSpan="6" className="px-6 py-12 text-center text-purple-300/50">
                              Filtre kriterleriyle eşleşen sonuç yok.
                            </td>
                          </tr>
                        ) : (
                          filteredResults.map((result, index) => {
                            const percentage = result.percentage || 0;
                            const scoreColor = percentage >= 75 ? 'text-red-400' : percentage >= 50 ? 'text-yellow-400' : 'text-green-400';

                            return (
                              <tr key={index} className="border-b border-purple-500/10 hover:bg-slate-700/30 transition-all">
                                <td className="px-6 py-4 text-sm font-bold text-purple-400">{result.anonId}</td>
                                <td className="px-6 py-4 text-sm text-purple-200">{result.age || '-'}</td>
                                <td className="px-6 py-4 text-sm text-purple-200">{result.gender || '-'}</td>
                                <td className="px-6 py-4 text-sm text-purple-200">{result.education || '-'}</td>
                                <td className="px-6 py-4 text-sm font-bold text-white">
                                  {result.score || 0}/16
                                </td>
                                <td className={`px-6 py-4 text-sm font-bold ${scoreColor}`}>
                                  {percentage}%
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                  <div className="px-6 py-4 bg-slate-700/30 text-sm text-purple-300 border-t border-purple-500/20">
                    Gösterilen: <span className="font-bold">{filteredResults.length}</span> / <span className="font-bold">{assessmentResults.length}</span> sonuç
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add Channel Modal */}
      {showAddChannel && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 rounded-2xl border border-purple-500/30 shadow-2xl p-8 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                Yeni Kanal Ekle
              </h3>
              <button onClick={() => setShowAddChannel(false)} className="text-purple-300 hover:text-purple-200">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-purple-300 mb-2">Kanal Adı</label>
                <input
                  type="text"
                  value={newChannel.name}
                  onChange={(e) => setNewChannel({ ...newChannel, name: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-purple-500/30 rounded-xl text-white focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-purple-300 mb-2">Kategori</label>
                <select
                  value={newChannel.category}
                  onChange={(e) => setNewChannel({ ...newChannel, category: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-purple-500/30 rounded-xl text-white focus:ring-2 focus:ring-purple-500 outline-none"
                >
                  <option value="Support">Support</option>
                  <option value="General">General</option>
                  <option value="Community">Community</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-purple-300 mb-2">Açıklama</label>
                <textarea
                  value={newChannel.description}
                  onChange={(e) => setNewChannel({ ...newChannel, description: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-purple-500/30 rounded-xl text-white focus:ring-2 focus:ring-purple-500 outline-none"
                  rows="3"
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={newChannel.isPublic}
                  onChange={(e) => setNewChannel({ ...newChannel, isPublic: e.target.checked })}
                  className="w-5 h-5 rounded border-purple-500/30"
                />
                <label className="text-sm text-purple-300 font-semibold">Genel Kanal</label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleAddChannel}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl font-bold hover:from-purple-700 hover:to-pink-700 transition-all"
                >
                  Ekle
                </button>
                <button
                  onClick={() => setShowAddChannel(false)}
                  className="flex-1 bg-slate-700/50 text-purple-300 py-3 rounded-xl font-bold hover:bg-slate-700 transition-all"
                >
                  İptal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      {confirmDialog.show && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 rounded-2xl border border-red-500/30 shadow-2xl p-8 w-full max-w-md">
            <h3 className="text-2xl font-bold text-red-400 mb-4">{confirmDialog.title}</h3>
            <p className="text-purple-300 mb-8">{confirmDialog.message}</p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  if (confirmDialog.onConfirm) confirmDialog.onConfirm();
                }}
                className="flex-1 bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700 transition-all"
              >
                Evet, Sil
              </button>
              <button
                onClick={() => setConfirmDialog({ show: false, title: '', message: '', onConfirm: null })}
                className="flex-1 bg-slate-700/50 text-purple-300 py-3 rounded-xl font-bold hover:bg-slate-700 transition-all"
              >
                İptal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}