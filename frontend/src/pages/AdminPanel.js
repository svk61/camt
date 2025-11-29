import React, { useState, useEffect } from 'react';
import { Download, Filter, LogOut, Lock } from 'lucide-react';

function AdminPanel() {
  const [view, setView] = useState('login'); // 'login' | 'results'
  const [adminPassword, setAdminPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Results view state
  const [results, setResults] = useState([]);
  const [filteredResults, setFilteredResults] = useState([]);
  const [error, setError] = useState('');
  
  // Filtreler
const [filters, setFilters] = useState({
  ageMin: '',
  ageMax: '',
  scoreMin: '',
  scoreMax: '',
  sortBy: 'score-desc',
  school: ''   // ← EKLENDİ
});
  
  const [showFilters, setShowFilters] = useState(false);

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    
    if (!adminPassword) {
      setPasswordError('Şifre gereklidir');
      return;
    }

    setLoading(true);
    setPasswordError('');

    try {
      const response = await fetch('https://camt.onrender.com/api/auth/admin-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password: adminPassword })
      });

      const data = await response.json();

      if (!response.ok) {
        setPasswordError(data.error || 'Giriş başarısız');
        return;
      }

      // Token'ı localStorage'a kaydet
      localStorage.setItem('adminToken', data.token);
      setAdminPassword('');
      setView('results');
      
      // Sonuçları yükle
      loadResults(data.token);
    } catch (err) {
      console.error('Admin login error:', err);
      setPasswordError('Bağlantı hatası. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  const loadResults = async (token = null) => {
    try {
      setLoading(true);
      const adminToken = token || localStorage.getItem('adminToken');
      
      if (!adminToken) {
        setError('Oturum gereklidir');
        return;
      }

      const response = await fetch('https://camt.onrender.com/api/assessment/results', {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Sonuçlar yüklenemedi');
      }

      const data = await response.json();
      
      // Anonim olarak etiketle (K1, K2, vb.)
      const anonymized = data.map((result, index) => ({
        ...result,
        anonId: `K${index + 1}`
      }));
      
      setResults(anonymized);
      setError('');
    } catch (err) {
      console.error('Sonuçlar yüklenemedi:', err);
      setError('Sonuçlar yüklenirken bir hata oluştu. Lütfen daha sonra deneyin.');
      setView('login');
      localStorage.removeItem('adminToken');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    applyFilters();
  }, [results, filters]);

  const applyFilters = () => {
    let filtered = [...results];

    // Yaş filtresi
    if (filters.ageMin) {
      filtered = filtered.filter(r => (r.age || 0) >= parseInt(filters.ageMin));
    }
    if (filters.ageMax) {
      filtered = filtered.filter(r => (r.age || 0) <= parseInt(filters.ageMax));
    }
// Okul filtresi
// Okul filtresi (education alanına göre)
if (filters.school) {
  filtered = filtered.filter(r =>
    (r.education || '').toLowerCase() === filters.school.toLowerCase()
  );
}


    // Puan filtresi
    if (filters.scoreMin) {
      filtered = filtered.filter(r => (r.score || 0) >= parseInt(filters.scoreMin));
    }
    if (filters.scoreMax) {
      filtered = filtered.filter(r => (r.score || 0) <= parseInt(filters.scoreMax));
    }

    // Sıralama
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
      sortBy: 'score-desc'
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

  const calculateStats = () => {
    if (filteredResults.length === 0) {
      return {
        avgScore: 0,
        highestScore: 0,
        lowestScore: 0,
        avgAge: 0
      };
    }

    const scores = filteredResults.map(r => r.score || 0);
    return {
      avgScore: (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2),
      highestScore: Math.max(...scores),
      lowestScore: Math.min(...scores),
      avgAge: (filteredResults.reduce((sum, r) => sum + (r.age || 0), 0) / filteredResults.length).toFixed(1)
    };
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    setView('login');
    setAdminPassword('');
    setResults([]);
    setFilteredResults([]);
  };

  // LOGIN VIEW
  if (view === 'login') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-indigo-600 rounded-full mx-auto mb-4 flex items-center justify-center">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Yönetici Paneli</h1>
            <p className="text-gray-600">Anket Sonuçlarını Görüntüle</p>
          </div>

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Yönetici Şifresi
              </label>
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                placeholder="Şifrenizi giriniz"
                disabled={loading}
              />
            </div>

            {passwordError && (
              <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
                {passwordError}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !adminPassword}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Doğrulanıyor...' : 'Giriş Yap'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => window.location.hash = '#login'}
              className="text-indigo-600 font-semibold hover:text-indigo-700"
            >
              ← Ana Sayfaya Dön
            </button>
          </div>

         
        </div>
      </div>
    );
  }

  // RESULTS VIEW
  const stats = calculateStats();

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Başlık */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Yönetici Paneli</h1>
            <p className="text-gray-400">Anket Sonuçları Analizi</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition"
          >
            <LogOut className="w-5 h-5" />
            Çıkış
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 px-6 py-4 rounded-lg mb-8">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-gray-400">Yükleniyor...</p>
          </div>
        ) : (
          <>
            {/* İstatistikler */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <p className="text-gray-400 text-sm mb-1">Toplam Katılımcı</p>
                <p className="text-3xl font-bold text-white">{results.length}</p>
              </div>
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <p className="text-gray-400 text-sm mb-1">Ortalama Puan</p>
                <p className="text-3xl font-bold text-indigo-400">{stats.avgScore}</p>
              </div>
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <p className="text-gray-400 text-sm mb-1">En Yüksek Puan</p>
                <p className="text-3xl font-bold text-green-400">{stats.highestScore}</p>
              </div>
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <p className="text-gray-400 text-sm mb-1">Ortalama Yaş</p>
                <p className="text-3xl font-bold text-purple-400">{stats.avgAge}</p>
              </div>
            </div>

            {/* Filtreler ve İşlemler */}
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Filter className="w-5 h-5" />
                  Filtreler ve Sıralama
                </h2>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="text-indigo-400 hover:text-indigo-300"
                >
                  {showFilters ? 'Gizle' : 'Göster'}
                </button>
                
              </div>

              {showFilters && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Minimum Yaş
                      </label>
                      <input
                        type="number"
                        name="ageMin"
                        value={filters.ageMin}
                        onChange={handleFilterChange}
                        placeholder="Min yaş"
                        className="w-full px-4 py-2 rounded bg-gray-700 text-white border border-gray-600 focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Maksimum Yaş
                      </label>
                      <input
                        type="number"
                        name="ageMax"
                        value={filters.ageMax}
                        onChange={handleFilterChange}
                        placeholder="Max yaş"
                        className="w-full px-4 py-2 rounded bg-gray-700 text-white border border-gray-600 focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
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
                        className="w-full px-4 py-2 rounded bg-gray-700 text-white border border-gray-600 focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
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
                        className="w-full px-4 py-2 rounded bg-gray-700 text-white border border-gray-600 focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                  </div>
                  <div>
  <label className="block text-sm font-medium text-gray-300 mb-2">
    Okul
  </label>
  <select
    name="school"
    value={filters.school}
    onChange={handleFilterChange}
    className="w-full px-4 py-2 rounded bg-gray-700 text-white border border-gray-600 focus:ring-2 focus:ring-indigo-500 outline-none"
  >
    <option value="">Tümü</option>
    {[...new Set(results.map(r => r.education).filter(Boolean))].sort().map((school, idx) => (
      <option key={idx} value={school}>{school}</option>
    ))}
  </select>
</div>


                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Sıralama
                    </label>
                    <select
                      name="sortBy"
                      value={filters.sortBy}
                      onChange={handleFilterChange}
                      className="w-full px-4 py-2 rounded bg-gray-700 text-white border border-gray-600 focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      <option value="score-desc">Puan (Yüksekten Düşüğe)</option>
                      <option value="score-asc">Puan (Düşükten Yükseğe)</option>
                      <option value="age-desc">Yaş (Büyükten Küçüğe)</option>
                      <option value="age-asc">Yaş (Küçükten Büyüğe)</option>
                    </select>
                  </div>

                  <div className="flex gap-3 pt-4 border-t border-gray-700">
                    <button
                      onClick={resetFilters}
                      className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 text-white transition"
                    >
                      Filtreleri Sıfırla
                    </button>
                    <button
                      onClick={exportToCSV}
                      className="px-4 py-2 rounded bg-green-600 hover:bg-green-700 text-white transition flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      CSV İndir
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Sonuçlar Tablosu */}
            <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-700 border-b border-gray-600">
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">ID</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Yaş</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Cinsiyet</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Eğitim</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Puan</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Yüzde</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredResults.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-8 text-center text-gray-400">
                          Filtre kriterleriyle eşleşen sonuç yok.
                        </td>
                      </tr>
                    ) : (
                      filteredResults.map((result, index) => {
                        const percentage = result.percentage || 0;
                        const scoreColor = percentage >= 75 ? 'text-green-400' : percentage >= 50 ? 'text-yellow-400' : 'text-red-400';
                        
                        return (
                          <tr key={index} className="border-b border-gray-700 hover:bg-gray-700/50 transition">
                            <td className="px-6 py-4 text-sm font-semibold text-indigo-400">{result.anonId}</td>
                            <td className="px-6 py-4 text-sm text-gray-300">{result.age || '-'}</td>
                            <td className="px-6 py-4 text-sm text-gray-300">{result.gender || '-'}</td>
                            <td className="px-6 py-4 text-sm text-gray-300">{result.education || '-'}</td>
                            <td className="px-6 py-4 text-sm font-semibold text-white">
                              {result.score || 0}/16
                            </td>
                            <td className={`px-6 py-4 text-sm font-semibold ${scoreColor}`}>
                              {percentage}%
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
              <div className="px-6 py-4 bg-gray-700 text-sm text-gray-400 border-t border-gray-600">
                Gösterilen: {filteredResults.length} / {results.length} sonuç
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default AdminPanel;