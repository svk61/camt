import React, { useState, useEffect, useRef } from 'react';
import AgoraRTC from 'agora-rtc-sdk-ng';
import { API } from '../App';

// ========================================
// 🔥 IMPROVED VoiceChat with username display
// ========================================

const VoiceChat = ({ channelName, userId, username, onClose }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [error, setError] = useState(null);

  const clientRef = useRef(null);
  const localAudioTrackRef = useRef(null);
  const uidToUsernameRef = useRef(new Map()); // 🔥 Track UID to username mapping

  // Sanitize channel name for Agora (max 64 chars, alphanumeric and some special chars)
  const sanitizeChannelName = (name) => {
    if (!name) return 'general';
    return name
      .replace(/[^a-zA-Z0-9\-_]/g, '-')
      .substring(0, 64);
  };

  // 🔥 Get username by UID (check local cache first, then API)
  const getUsernameByUid = async (uid) => {
    // Check cache first
    if (uidToUsernameRef.current.has(uid)) {
      return uidToUsernameRef.current.get(uid);
    }

    // Try to get from API
    try {
      const response = await API.getUsernameByUid(uid);
      const foundUsername = response.username || `User ${uid}`;
      uidToUsernameRef.current.set(uid, foundUsername);
      return foundUsername;
    } catch (error) {
      console.log('Could not fetch username for UID:', uid);
      return `User ${uid}`;
    }
  };

  useEffect(() => {
    // Initialize Agora client with CORRECT config
    clientRef.current = AgoraRTC.createClient({ 
      mode: 'rtc',  // 🔥 CRITICAL: rtc mode for voice chat
      codec: 'vp8'  // 🔥 CRITICAL: vp8 codec
    });

    // Setup event listeners
    setupEventListeners();

    // Join on mount
    joinChannel();

    // Cleanup on unmount
    return () => {
      leaveChannel();
    };
  }, [channelName]);

  const setupEventListeners = () => {
    const client = clientRef.current;

    // 🔥 CRITICAL: Handle user-published event
    client.on('user-published', async (user, mediaType) => {
      console.log('👤 User published:', user.uid, mediaType);
      
      if (mediaType === 'audio') {
        try {
          // Subscribe to the remote user
          await client.subscribe(user, mediaType);
          
          // Play the remote audio
          user.audioTrack?.play();
          
          // Get username and add to participants
          const remoteUsername = await getUsernameByUid(user.uid);
          
          setParticipants(prev => {
            // Check if user already exists
            const existing = prev.find(p => p.uid === user.uid);
            if (existing) {
              return prev.map(p => 
                p.uid === user.uid 
                  ? { ...p, hasAudio: true, username: remoteUsername }
                  : p
              );
            }
            // Add new user
            return [...prev, { 
              uid: user.uid, 
              hasAudio: true,
              username: remoteUsername
            }];
          });

          console.log('✅ Subscribed to user:', user.uid, remoteUsername);
        } catch (err) {
          console.error('❌ Error subscribing to user:', err);
        }
      }
    });

    // 🔥 Handle user-unpublished event
    client.on('user-unpublished', (user, mediaType) => {
      console.log('👤 User unpublished:', user.uid, mediaType);
      
      if (mediaType === 'audio') {
        setParticipants(prev => 
          prev.map(p => 
            p.uid === user.uid 
              ? { ...p, hasAudio: false }
              : p
          )
        );
      }
    });

    // 🔥 Handle user-left event
    client.on('user-left', (user) => {
      console.log('👋 User left:', user.uid);
      setParticipants(prev => prev.filter(p => p.uid !== user.uid));
      uidToUsernameRef.current.delete(user.uid);
    });

    // 🔥 Handle connection state changes
    client.on('connection-state-change', (curState, prevState) => {
      console.log('🔌 Connection state:', prevState, '->', curState);
      setIsConnected(curState === 'CONNECTED');
    });

    // 🔥 Handle errors
    client.on('error', (error) => {
      console.error('Agora client error:', error);
    });
  };

  const joinChannel = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const sanitizedChannel = sanitizeChannelName(channelName);
      console.log('📞 Joining voice channel:', sanitizedChannel);

      // Get token from backend
      const response = await fetch(
        `http://localhost:5000/api/agora/rtc-token?channelName=${encodeURIComponent(sanitizedChannel)}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || 'Failed to get token');
      }

      const tokenData = await response.json();
      const { token, appId, uid, username: serverUsername, channelUsers } = tokenData;
      
      console.log('🔑 Token received:', { 
        appId: appId?.substring(0, 8) + '...', 
        uid,
        username: serverUsername,
        existingUsers: channelUsers?.length || 0
      });

      // 🔥 CRITICAL: Store username mapping for this user
      uidToUsernameRef.current.set(uid, serverUsername || username);

      // 🔥 CRITICAL: Store existing users from server
      if (channelUsers && Array.isArray(channelUsers)) {
        channelUsers.forEach(user => {
          if (user.uid && user.username) {
            uidToUsernameRef.current.set(user.uid, user.username);
          }
        });
      }

      const client = clientRef.current;

      // 🔥 CRITICAL: Join with numeric UID from server
      await client.join(appId, sanitizedChannel, token, uid);
      console.log('✅ Joined channel successfully as', serverUsername || username);

      // Create and publish local audio track
      const audioTrack = await AgoraRTC.createMicrophoneAudioTrack({
        encoderConfig: 'music_standard',
        AEC: true,  // Echo cancellation
        ANS: true,  // Noise suppression
        AGC: true   // Auto gain control
      });
      
      localAudioTrackRef.current = audioTrack;
      
      await client.publish([audioTrack]);
      console.log('✅ Published local audio track');

      setIsConnected(true);
      
      // Add self to participants
      setParticipants([{ 
        uid: uid, 
        hasAudio: true, 
        isLocal: true,
        username: serverUsername || username
      }]);

      // 🔥 Add existing remote users to participants
      if (channelUsers && Array.isArray(channelUsers)) {
        const remoteUsers = channelUsers.filter(u => u.uid !== uid);
        if (remoteUsers.length > 0) {
          setParticipants(prev => [
            ...prev,
            ...remoteUsers.map(u => ({
              uid: u.uid,
              hasAudio: true,
              isLocal: false,
              username: u.username
            }))
          ]);
        }
      }

    } catch (err) {
      console.error('❌ Failed to join channel:', err);
      setError(err.message || 'Failed to connect to voice chat');
      
      // Try to cleanup on error
      await leaveChannel();
    } finally {
      setIsLoading(false);
    }
  };

  const leaveChannel = async () => {
    try {
      const client = clientRef.current;
      const audioTrack = localAudioTrackRef.current;

      if (audioTrack) {
        audioTrack.stop();
        audioTrack.close();
        localAudioTrackRef.current = null;
      }

      if (client && client.connectionState !== 'DISCONNECTED') {
        await client.leave();
        console.log('👋 Left channel successfully');
      }

      setIsConnected(false);
      setParticipants([]);
      uidToUsernameRef.current.clear();
    } catch (err) {
      console.error('Error leaving channel:', err);
    }
  };

  const toggleMute = async () => {
    const audioTrack = localAudioTrackRef.current;
    if (!audioTrack) return;

    try {
      if (isMuted) {
        await audioTrack.setEnabled(true);
        setIsMuted(false);
        console.log('🎤 Unmuted');
      } else {
        await audioTrack.setEnabled(false);
        setIsMuted(true);
        console.log('🔇 Muted');
      }
    } catch (err) {
      console.error('Error toggling mute:', err);
    }
  };

  const handleLeave = async () => {
    await leaveChannel();
    onClose?.();
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      width: '320px',
      backgroundColor: '#1e293b',
      borderRadius: '12px',
      padding: '20px',
      boxShadow: '0 8px 16px rgba(0,0,0,0.4)',
      color: 'white',
      zIndex: 1000
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '16px'
      }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>🎤 Voice Chat</h3>
          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
            {sanitizeChannelName(channelName)}
          </div>
        </div>
        <button 
          onClick={handleLeave}
          style={{
            background: 'none',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer',
            fontSize: '24px',
            padding: '0',
            width: '24px',
            height: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          ×
        </button>
      </div>

      {error && (
        <div style={{
          padding: '12px',
          backgroundColor: '#dc2626',
          borderRadius: '6px',
          marginBottom: '12px',
          fontSize: '13px',
          lineHeight: '1.4'
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {isLoading && (
        <div style={{ 
          textAlign: 'center', 
          padding: '30px',
          color: '#94a3b8'
        }}>
          <div style={{ marginBottom: '8px' }}>🔊</div>
          <div>Connecting to voice chat...</div>
        </div>
      )}

      {isConnected && (
        <>
          <div style={{ marginBottom: '16px' }}>
            <div style={{ 
              fontSize: '12px', 
              color: '#94a3b8',
              marginBottom: '10px',
              fontWeight: '500'
            }}>
              {participants.length} participant{participants.length !== 1 ? 's' : ''}
            </div>
            
            <div style={{ 
              maxHeight: '150px', 
              overflowY: 'auto',
              marginBottom: '12px'
            }}>
              {participants.map(participant => (
                <div key={participant.uid} style={{
                  padding: '10px 12px',
                  backgroundColor: '#334155',
                  borderRadius: '8px',
                  marginBottom: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <div style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    backgroundColor: participant.hasAudio ? '#22c55e' : '#ef4444',
                    flexShrink: 0
                  }} />
                  <span style={{ 
                    fontSize: '14px',
                    flex: 1,
                    fontWeight: participant.isLocal ? '600' : '400'
                  }}>
                    {/* 🔥 CRITICAL: Display actual username */}
                    {participant.username || `User ${participant.uid}`}
                  </span>
                  {participant.isLocal && (
                    <span style={{ 
                      fontSize: '11px',
                      color: '#94a3b8',
                      backgroundColor: '#1e293b',
                      padding: '2px 6px',
                      borderRadius: '4px'
                    }}>
                      YOU
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={toggleMute}
              style={{
                flex: 1,
                padding: '12px',
                backgroundColor: isMuted ? '#ef4444' : '#22c55e',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                transition: 'all 0.2s'
              }}
            >
              {isMuted ? '🔇 Unmute' : '🎤 Mute'}
            </button>
            
            <button
              onClick={handleLeave}
              style={{
                padding: '12px 16px',
                backgroundColor: '#dc2626',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                transition: 'all 0.2s'
              }}
            >
              Leave
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default VoiceChat;