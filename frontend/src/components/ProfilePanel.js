import React, { useState } from 'react';
import { X, Award, TrendingUp, AlertCircle } from 'lucide-react';
import API from '../services/api';

// Helper to get level display info
const getSyndromeLevelInfo = (level, score) => {
  if (level === 'dusuk' || score <= 6) {
    return {
      label: 'Düşük Seviye',
      description: 'Cam tavan sendromu etkisi düşük düzeyde.',
      color: 'text-green-400',
      bgColor: 'bg-green-500/20',
      borderColor: 'border-green-500/30',
      icon: TrendingUp
    };
  } else if (level === 'orta' || score <= 13) {
    return {
      label: 'Orta Seviye',
      description: 'Cam tavan sendromu etkisi orta düzeyde.',
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/20',
      borderColor: 'border-yellow-500/30',
      icon: AlertCircle
    };
  } else {
    return {
      label: 'Yüksek Seviye',
      description: 'Cam tavan sendromu etkisi yüksek düzeyde. Destek önerilir.',
      color: 'text-red-400',
      bgColor: 'bg-red-500/20',
      borderColor: 'border-red-500/30',
      icon: AlertCircle
    };
  }
};

function ProfilePanel({ user, onClose, onUpdate }) {
  const [displayName, setDisplayName] = useState(user.displayName || '');
  const [bio, setBio] = useState(user.bio || '');
  const [isAnonymous, setIsAnonymous] = useState(user.isAnonymous || false);

  const levelInfo = getSyndromeLevelInfo(user.syndromeLevel, user.assessmentScore);
  const LevelIcon = levelInfo.icon;

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
      <div className="bg-gray-800 rounded-lg w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Profil Ayarları</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Assessment Results Section */}
        {user.hasCompletedAssessment && (
          <div className={`mb-6 p-4 rounded-xl ${levelInfo.bgColor} border ${levelInfo.borderColor}`}>
            <div className="flex items-center gap-3 mb-3">
              <div className={`p-2 rounded-lg ${levelInfo.bgColor}`}>
                <Award className={`w-5 h-5 ${levelInfo.color}`} />
              </div>
              <div>
                <h3 className="text-white font-semibold text-sm">Anket Sonuçlarınız</h3>
                <p className="text-gray-400 text-xs">Cam Tavan Sendromu Analizi</p>
              </div>
            </div>

            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <LevelIcon className={`w-4 h-4 ${levelInfo.color}`} />
                <span className={`font-bold ${levelInfo.color}`}>{levelInfo.label}</span>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-white">{user.assessmentScore || 0}</span>
                <span className="text-gray-400 text-sm">/16</span>
              </div>
            </div>

            <p className="text-gray-300 text-xs">{levelInfo.description}</p>

            {/* Progress bar */}
            <div className="mt-3 w-full bg-gray-700 rounded-full h-2 overflow-hidden">
              <div
                className={`h-2 rounded-full transition-all duration-500 ${(user.assessmentScore || 0) <= 6 ? 'bg-green-500' :
                    (user.assessmentScore || 0) <= 13 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                style={{ width: `${((user.assessmentScore || 0) / 16) * 100}%` }}
              />
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Görünen Ad</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-4 py-2 rounded bg-gray-700 text-white border border-gray-600 focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="Görünen adınızı girin"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Hakkında</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full px-4 py-2 rounded bg-gray-700 text-white border border-gray-600 focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
              rows="3"
              placeholder="Kendinizi tanıtın..."
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-300">Anonim Mod</p>
              <p className="text-xs text-gray-400">Kanallarda kimliğinizi gizleyin</p>
            </div>
            <button
              onClick={() => setIsAnonymous(!isAnonymous)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${isAnonymous ? 'bg-indigo-600' : 'bg-gray-600'
                }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${isAnonymous ? 'translate-x-6' : 'translate-x-1'
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
            İptal
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700 transition"
          >
            Kaydet
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProfilePanel;