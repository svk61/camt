import React, { useState, useEffect } from 'react';
import { Trash2, Plus, X, MessageSquare, Users, Settings, BarChart3, Eye } from 'lucide-react';

const API_URL = 'https://api.camtavanapp.com.tr/api';



export default function AdminPanel() {
  const [token, setToken] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState('channels');
  
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
  
  const [stats, setStats] = useState(null);
  const [assessmentResults, setAssessmentResults] = useState([]);
  
  const [confirmDialog, setConfirmDialog] = useState({
    show: false,
    title: '',
    message: '',
    onConfirm: null
  });

  const handleLogin = async () => {
    try {
      const response = await fetch(`${API_URL}/api/auth/admin-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setToken(data.token);
        setIsAuthenticated(true);
        localStorage.setItem('adminToken', data.token);
        loadChannels(data.token);
        loadStats(data.token);
      } else {
        alert(data.error || 'Giriş başarısız');
      }
    } catch (error) {
      alert('Bağlantı hatası');
    }
  };

  const loadChannels = async (authToken) => {
    try {
      const response = await fetch(`${API_URL}/api/channels/all`, {
        headers: { 'Authorization': `Bearer ${authToken || token}` }
      });
      const data = await response.json();
      setChannels(data);
    } catch (error) {
      console.error('Kanallar yüklenemedi:', error);
    }
  };

  const handleAddChannel = async () => {
    try {
      const response = await fetch(`${API_URL}/api/channels`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newChannel)
      });
      
      if (response.ok) {
        setShowAddChannel(false);
        setNewChannel({ name: '', category: 'Support', description: '', isPublic: true });
        loadChannels();
        alert('Kanal başarıyla eklendi');
      }
    } catch (error) {
      alert('Kanal eklenemedi');
    }
  };

  const handleDeleteChannel = async (channelId) => {
    setConfirmDialog({
      show: true,
      title: 'Kanalı Sil',
      message: 'Bu kanalı silmek istediğinize emin misiniz?',
      onConfirm: async () => {
        try {
          const response = await fetch(`${API_URL}/api/channels/${channelId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          if (response.ok) {
            loadChannels();
            alert('Kanal silindi');
          }
        } catch (error) {
          alert('Kanal silinemedi');
        }
        setConfirmDialog({ show: false, title: '', message: '', onConfirm: null });
      }
    });
  };

  const loadMessages = async (channelId) => {
    try {
      const response = await fetch(`${API_URL}/api/channels/${channelId}/messages`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setMessages(data);
      setSelectedChannel(channels.find(c => c._id === channelId));
    } catch (error) {
      console.error('Mesajlar yüklenemedi:', error);
    }
  };

  const handleDeleteMessage = async (channelId, messageId) => {
    try {
      const response = await fetch(`${API_URL}/api/channels/${channelId}/messages/${messageId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        loadMessages(channelId);
      }
    } catch (error) {
      alert('Mesaj silinemedi');
    }
  };

  const handleClearChannel = async (channelId) => {
    setConfirmDialog({
      show: true,
      title: 'Tüm Mesajları Sil',
      message: 'Bu kanaldaki TÜM mesajları silmek istediğinize emin misiniz? Bu işlem geri alınamaz.',
      onConfirm: async () => {
        try {
          const response = await fetch(`${API_URL}/api/channels/${channelId}/messages`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          if (response.ok) {
            loadMessages(channelId);
            alert('Tüm mesajlar silindi');
          }
        } catch (error) {
          alert('Mesajlar silinemedi');
        }
        setConfirmDialog({ show: false, title: '', message: '', onConfirm: null });
      }
    });
  };

  const loadStats = async (authToken) => {
    try {
      const response = await fetch(`${API_URL}/api/assessment/results/stats`, {
        headers: { 'Authorization': `Bearer ${authToken || token}` }
      });
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('İstatistikler yüklenemedi:', error);
    }
  };

  const loadAssessmentResults = async () => {
    try {
      const response = await fetch(`${API_URL}/api/assessment/results`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setAssessmentResults(data);
    } catch (error) {
      console.error('Sonuçlar yüklenemedi:', error);
    }
  };

  useEffect(() => {
    const savedToken = localStorage.getItem('adminToken');
    if (savedToken) {
      setToken(savedToken);
      setIsAuthenticated(true);
      loadChannels(savedToken);
      loadStats(savedToken);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'results' && isAuthenticated) {
      loadAssessmentResults();
    }
  }, [activeTab, isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Settings className="w-8 h-8 text-purple-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Admin Panel</h1>
            <p className="text-gray-600">Yönetici girişi yapın</p>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Admin Şifresi
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Şifrenizi girin"
              />
            </div>
            
            <button
              onClick={handleLogin}
              className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition"
            >
              Giriş Yap
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Settings className="w-8 h-8 text-purple-600" />
            <h1 className="text-2xl font-bold text-gray-800">Admin Panel</h1>
          </div>
          <button
            onClick={() => {
              setIsAuthenticated(false);
              setToken('');
              localStorage.removeItem('adminToken');
            }}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
          >
            Çıkış Yap
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('channels')}
              className={`flex items-center space-x-2 px-6 py-4 font-medium transition ${
                activeTab === 'channels'
                  ? 'border-b-2 border-purple-600 text-purple-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <MessageSquare className="w-5 h-5" />
              <span>Kanallar</span>
            </button>
            <button
              onClick={() => setActiveTab('messages')}
              className={`flex items-center space-x-2 px-6 py-4 font-medium transition ${
                activeTab === 'messages'
                  ? 'border-b-2 border-purple-600 text-purple-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Eye className="w-5 h-5" />
              <span>Mesajlar</span>
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`flex items-center space-x-2 px-6 py-4 font-medium transition ${
                activeTab === 'stats'
                  ? 'border-b-2 border-purple-600 text-purple-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <BarChart3 className="w-5 h-5" />
              <span>İstatistikler</span>
            </button>
            <button
              onClick={() => setActiveTab('results')}
              className={`flex items-center space-x-2 px-6 py-4 font-medium transition ${
                activeTab === 'results'
                  ? 'border-b-2 border-purple-600 text-purple-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Users className="w-5 h-5" />
              <span>Anket Sonuçları</span>
            </button>
          </div>
        </div>

        {activeTab === 'channels' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800">Kanal Yönetimi</h2>
              <button
                onClick={() => setShowAddChannel(true)}
                className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition"
              >
                <Plus className="w-5 h-5" />
                <span>Yeni Kanal</span>
              </button>
            </div>

            <div className="space-y-4">
              {channels.map((channel) => (
                <div key={channel._id} className="border border-gray-200 rounded-lg p-4 hover:border-purple-300 transition">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-semibold text-gray-800">{channel.name}</h3>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          channel.isPublic ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {channel.isPublic ? 'Genel' : 'Özel'}
                        </span>
                        <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">
                          {channel.category}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm mt-1">{channel.description}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteChannel(channel._id)}
                      className="ml-4 p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'messages' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Mesaj Yönetimi</h2>
            
            {!selectedChannel ? (
              <div className="space-y-3">
                <p className="text-gray-600 mb-4">Mesajlarını görmek istediğiniz kanalı seçin:</p>
                {channels.map((channel) => (
                  <button
                    key={channel._id}
                    onClick={() => loadMessages(channel._id)}
                    className="w-full text-left border border-gray-200 rounded-lg p-4 hover:border-purple-300 hover:bg-purple-50 transition"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-800">{channel.name}</h3>
                        <p className="text-sm text-gray-600">{channel.description}</p>
                      </div>
                      <MessageSquare className="w-5 h-5 text-gray-400" />
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => {
                        setSelectedChannel(null);
                        setMessages([]);
                      }}
                      className="text-gray-600 hover:text-gray-800"
                    >
                      ← Geri
                    </button>
                    <h3 className="text-lg font-semibold text-gray-800">
                      {selectedChannel.name} - Mesajlar ({messages.length})
                    </h3>
                  </div>
                  {messages.length > 0 && (
                    <button
                      onClick={() => handleClearChannel(selectedChannel._id)}
                      className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Tüm Mesajları Sil</span>
                    </button>
                  )}
                </div>

                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {messages.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">Bu kanalda henüz mesaj yok</p>
                  ) : (
                    messages.map((msg) => (
                      <div key={msg._id} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="font-semibold text-gray-800">
                                {msg.isAnonymous ? 'Anonim Kullanıcı' : msg.username}
                              </span>
                              <span className="text-xs text-gray-500">
                                {new Date(msg.createdAt).toLocaleString('tr-TR')}
                              </span>
                            </div>
                            <p className="text-gray-700">{msg.text}</p>
                          </div>
                          <button
                            onClick={() => handleDeleteMessage(selectedChannel._id, msg._id)}
                            className="ml-4 p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'stats' && stats && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="text-sm text-gray-600 mb-1">Toplam Katılımcı</div>
                <div className="text-3xl font-bold text-purple-600">{stats.totalResults || 0}</div>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="text-sm text-gray-600 mb-1">Ortalama Skor</div>
                <div className="text-3xl font-bold text-blue-600">{stats.avgScore || 0}/16</div>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="text-sm text-gray-600 mb-1">En Yüksek Skor</div>
                <div className="text-3xl font-bold text-green-600">{stats.highestScore || 0}</div>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="text-sm text-gray-600 mb-1">Ortalama Yaş</div>
                <div className="text-3xl font-bold text-orange-600">{stats.avgAge || 0}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Cinsiyet Dağılımı</h3>
                <div className="space-y-3">
                  {stats.genderDistribution && Object.keys(stats.genderDistribution).length > 0 ? (
                    Object.entries(stats.genderDistribution).map(([gender, count]) => (
                      <div key={gender} className="flex items-center justify-between">
                        <span className="text-gray-700 capitalize">{gender}</span>
                        <span className="font-semibold text-gray-800">{count}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm">Henüz veri yok</p>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Eğitim Durumu</h3>
                <div className="space-y-3">
                  {stats.educationDistribution && Object.keys(stats.educationDistribution).length > 0 ? (
                    Object.entries(stats.educationDistribution).map(([edu, count]) => (
                      <div key={edu} className="flex items-center justify-between">
                        <span className="text-gray-700">{edu}</span>
                        <span className="font-semibold text-gray-800">{count}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm">Henüz veri yok</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'results' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Anket Sonuçları ({assessmentResults.length})</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Tarih</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Cinsiyet</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Yaş</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Eğitim</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Skor</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Yüzde</th>
                  </tr>
                </thead>
                <tbody>
                  {assessmentResults.map((result) => (
                    <tr key={result.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm text-gray-700">
                        {new Date(result.submittedAt).toLocaleDateString('tr-TR')}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-700 capitalize">{result.gender}</td>
                      <td className="py-3 px-4 text-sm text-gray-700">{result.age}</td>
                      <td className="py-3 px-4 text-sm text-gray-700">{result.education}</td>
                      <td className="py-3 px-4 text-sm text-gray-700">{result.score}/16</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          result.percentage >= 75 ? 'bg-red-100 text-red-700' :
                          result.percentage >= 50 ? 'bg-orange-100 text-orange-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {result.percentage}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {showAddChannel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800">Yeni Kanal Ekle</h3>
              <button onClick={() => setShowAddChannel(false)}>
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Kanal Adı</label>
                <input
                  type="text"
                  value={newChannel.name}
                  onChange={(e) => setNewChannel({...newChannel, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Kategori</label>
                <select
                  value={newChannel.category}
                  onChange={(e) => setNewChannel({...newChannel, category: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  <option value="Support">Support</option>
                  <option value="General">General</option>
                  <option value="Community">Community</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Açıklama</label>
                <textarea
                  value={newChannel.description}
                  onChange={(e) => setNewChannel({...newChannel, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  rows="3"
                />
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={newChannel.isPublic}
                  onChange={(e) => setNewChannel({...newChannel, isPublic: e.target.checked})}
                  className="mr-2"
                />
                <label className="text-sm text-gray-700">Genel Kanal</label>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={handleAddChannel}
                  className="flex-1 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition"
                >
                  Ekle
                </button>
                <button
                  onClick={() => setShowAddChannel(false)}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-gray-800 mb-4">{confirmDialog.title}</h3>
            <p className="text-gray-600 mb-6">{confirmDialog.message}</p>
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  if (confirmDialog.onConfirm) confirmDialog.onConfirm();
                }}
                className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition"
              >
                Evet, Sil
              </button>
              <button
                onClick={() => setConfirmDialog({ show: false, title: '', message: '', onConfirm: null })}
                className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition"
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