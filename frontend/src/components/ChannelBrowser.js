import React, { useState, useEffect } from 'react';
import { X, Search, Hash } from 'lucide-react';
import API from '../services/api';

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

export default ChannelBrowser;