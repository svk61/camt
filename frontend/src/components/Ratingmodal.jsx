// RatingModal.jsx - Add this component to ChatView.jsx
import React, { useState, useEffect } from 'react';
import { Star, X, Send } from 'lucide-react';

function RatingModal({ isOpen, onClose, onSubmit, existingRating = null }) {
  const [rating, setRating] = useState(existingRating?.rating || 0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState(existingRating?.comment || '');
  const [isAnonymous, setIsAnonymous] = useState(existingRating?.isAnonymous ?? true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (existingRating) {
      setRating(existingRating.rating);
      setComment(existingRating.comment || '');
      setIsAnonymous(existingRating.isAnonymous ?? true);
    }
  }, [existingRating]);

  const handleSubmit = async () => {
    if (rating === 0) {
      alert('Lütfen bir puan seçin');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(rating, comment, isAnonymous);
      onClose();
    } catch (error) {
      alert('Değerlendirme gönderilemedi: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[70] p-4 animate-fade-in">
      <div className="bg-gray-800 rounded-2xl w-full max-w-lg p-8 shadow-2xl border border-gray-700 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Sitemizi Değerlendirin</h2>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-gray-700 rounded-full text-gray-400 hover:text-white transition"
          >
            <X size={24} />
          </button>
        </div>

        <div className="space-y-6">
          {/* Star Rating */}
          <div className="text-center">
            <p className="text-gray-300 mb-4 text-lg">Deneyiminizi nasıl buldunuz?</p>
            <div className="flex justify-center gap-2 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="transition-transform hover:scale-110 focus:outline-none"
                >
                  <Star
                    size={48}
                    className={`transition-all ${
                      star <= (hoveredRating || rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-600'
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="text-sm text-gray-400">
              {rating === 0 && 'Puan seçiniz'}
              {rating === 1 && '⭐ Çok Kötü'}
              {rating === 2 && '⭐⭐ Kötü'}
              {rating === 3 && '⭐⭐⭐ İdare Eder'}
              {rating === 4 && '⭐⭐⭐⭐ İyi'}
              {rating === 5 && '⭐⭐⭐⭐⭐ Mükemmel'}
            </p>
          </div>

          {/* Comment */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Yorumunuz (İsteğe Bağlı)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-gray-900 text-white border border-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none transition"
              rows="4"
              maxLength="500"
              placeholder="Düşüncelerinizi bizimle paylaşın..."
            />
            <p className="text-xs text-gray-500 mt-1 text-right">
              {comment.length}/500 karakter
            </p>
          </div>

          {/* Anonymous Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-200">Anonim Değerlendirme</p>
              <p className="text-xs text-gray-400">İsminiz gizli kalacak</p>
            </div>
            <button
              onClick={() => setIsAnonymous(!isAnonymous)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${
                isAnonymous ? 'bg-indigo-600' : 'bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out ${
                  isAnonymous ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {existingRating && (
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
              <p className="text-blue-300 text-sm text-center">
                ℹ️ Daha önce değerlendirme yaptınız. Bu işlem mevcut değerlendirmenizi güncelleyecek.
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-8">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 rounded-lg bg-gray-700 text-white hover:bg-gray-600 transition font-medium"
            disabled={isSubmitting}
          >
            İptal
          </button>
          <button
            onClick={handleSubmit}
            disabled={rating === 0 || isSubmitting}
            className="flex-1 px-4 py-3 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Gönderiliyor...</span>
              </>
            ) : (
              <>
                <Send size={18} />
                <span>{existingRating ? 'Güncelle' : 'Gönder'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default RatingModal;
