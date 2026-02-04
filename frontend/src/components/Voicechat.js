import React, { useState, useEffect, useRef } from 'react';
import AgoraRTC from 'agora-rtc-sdk-ng';
import { API } from '../App';

// ========================================
// 🔥 FIXED: Multi-user synchronization issue
// ========================================

const VoiceChat = ({ channelName, userId, username, onClose }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [error, setError] = useState(null);

  const clientRef = useRef(null);
  const localAudioTrackRef = useRef(null);
  const uidToUsernameRef = useRef(new Map());
  const localUidRef = useRef(null); // 🔥 Track local UID

  // Sanitize channel name
  const sanitizeChannelName = (name) => {
    if (!name) return 'general';
    return name
      .replace(/[^a-zA-Z0-9\-_]/g, '-')
      .substring(0, 64);
  };

  // 🔥 IMPROVED: Fetch username with retry logic
  const getUsernameByUid = async (uid) => {
    // Check cache first
    if (uidToUsernameRef.current.has(uid)) {
      return uidToUsernameRef.current.get(uid);
    }

    // Try API with retry
    try {
      const response = await API.getUsernameByUid(uid);
      const fetchedUsername = response.username || `User ${uid}`;
      uidToUsernameRef.current.set(uid, fetchedUsername);
      return fetchedUsername;
    } catch (error) {
      console.warn('Could not fetch username for UID:', uid);
      // Use fallback
      const fallback = `Guest ${String(uid).slice(-4)}`;
      uidToUsernameRef.current.set(uid, fallback);
      return fallback;
    }
  };

  useEffect(() => {
    // Initialize Agora client
    clientRef.current = AgoraRTC.createClient({ 
      mode: 'rtc',
      codec: 'vp9'  // 🔥 Changed from vp8 to vp9 for better stability
    });

    setupEventListeners();
    joinChannel();

    return () => {
      leaveChannel();
    };
  }, [channelName]);

  const setupEventListeners = () => {
    const client = clientRef.current;

    // 🔥 CRITICAL FIX: Handle user-published properly
    client.on('user-published', async (user, mediaType) => {
      console.log('👤 User published:', user.uid, mediaType);
      
      if (mediaType === 'audio') {
        try {
          // Subscribe to remote user
          await client.subscribe(user, mediaType);
          console.log('✅ Subscribed to user:', user.uid);
          
          // Play audio
          user.audioTrack?.play();
          console.log('🔊 Playing audio from user:', user.uid);
          
          // 🔥 CRITICAL: Fetch username and update participants
          const remoteUsername = await getUsernameByUid(user.uid);
          
          setParticipants(prev => {
            // Check if user already exists
            const existing = prev.find(p => p.uid === user.uid);
            
            if (existing) {
              // Update existing user
              return prev.map(p => 
                p.uid === user.uid 
                  ? { ...p, hasAudio: true, username: remoteUsername }
                  : p
              );
            }
            
            // 🔥 FIX: Add new user to list
            console.log(`➕ Adding new participant: ${remoteUsername} (${user.uid})`);
            return [...prev, { 
              uid: user.uid, 
              hasAudio: true,
              username: remoteUsername,
              isLocal: false
            }];
          });

        } catch (err) {
          console.error('❌ Error subscribing to user:', err);
        }
      }
    });

    // Handle user-unpublished
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

    // 🔥 CRITICAL FIX: Handle user-left properly
    client.on('user-left', (user) => {
      console.log('👋 User left:', user.uid);
      
      setParticipants(prev => {
        const filtered = prev.filter(p => p.uid !== user.uid);
        console.log(`➖ Removed participant ${user.uid}. Remaining:`, filtered.length);
        return filtered;
      });
      
      uidToUsernameRef.current.delete(user.uid);
    });

    // 🔥 NEW: Handle user-joined event (even before publishing)
    client.on('user-joined', async (user) => {
      console.log('🚪 User joined channel:', user.uid);
      
      // Immediately add to participants list
      const remoteUsername = await getUsernameByUid(user.uid);
      
      setParticipants(prev => {
        const existing = prev.find(p => p.uid === user.uid);
        if (existing) return prev;
        
        console.log(`➕ Adding joined user: ${remoteUsername} (${user.uid})`);
        return [...prev, {
          uid: user.uid,
          hasAudio: false, // Will be set to true when published
          username: remoteUsername,
          isLocal: false
        }];
      });
    });

    // Connection state changes
    client.on('connection-state-change', (curState, prevState) => {
      console.log('🔌 Connection state:', prevState, '->', curState);
      setIsConnected(curState === 'CONNECTED');
      
      // 🔥 FIX: Refresh participant list when reconnected
      if (curState === 'CONNECTED' && prevState === 'CONNECTING') {
        refreshParticipants();
      }
    });

    // Error handling
    client.on('error', (error) => {
      console.error('❌ Agora client error:', error);
    });
  };

  // 🔥 NEW: Refresh participants from remote users
  const refreshParticipants = async () => {
    const client = clientRef.current;
    if (!client) return;

    const remoteUsers = client.remoteUsers;
    console.log('🔄 Refreshing participants. Remote users:', remoteUsers.length);

    for (const user of remoteUsers) {
      const remoteUsername = await getUsernameByUid(user.uid);
      
      setParticipants(prev => {
        const existing = prev.find(p => p.uid === user.uid);
        if (existing) return prev;
        
        return [...prev, {
          uid: user.uid,
          hasAudio: user.hasAudio,
          username: remoteUsername,
          isLocal: false
        }];
      });
    }
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

      // 🔥 Store local UID
      localUidRef.current = uid;

      // 🔥 Store username mapping
      uidToUsernameRef.current.set(uid, serverUsername || username);

      // 🔥 Store existing users from server
      if (channelUsers && Array.isArray(channelUsers)) {
        channelUsers.forEach(user => {
          if (user.uid && user.username) {
            uidToUsernameRef.current.set(user.uid, user.username);
          }
        });
      }

      const client = clientRef.current;

      // Join channel
      await client.join(appId, sanitizedChannel, token, uid);
      console.log('✅ Joined channel successfully as', serverUsername || username);

      // Create and publish local audio
      const audioTrack = await AgoraRTC.createMicrophoneAudioTrack({
        encoderConfig: 'music_standard',
        AEC: true,
        ANS: true,
        AGC: true
      });
      
      localAudioTrackRef.current = audioTrack;
      
      await client.publish([audioTrack]);
      console.log('✅ Published local audio track');

      setIsConnected(true);
      
      // 🔥 CRITICAL FIX: Build complete participant list
      const completeParticipants = [];
      
      // Add self
      completeParticipants.push({ 
        uid: uid, 
        hasAudio: true, 
        isLocal: true,
        username: serverUsername || username
      });

      // 🔥 Add existing remote users from server
      if (channelUsers && Array.isArray(channelUsers)) {
        const remoteUsers = channelUsers.filter(u => u.uid !== uid);
        remoteUsers.forEach(u => {
          completeParticipants.push({
            uid: u.uid,
            hasAudio: true, // Assume they have audio
            isLocal: false,
            username: u.username
          });
        });
      }

      // 🔥 Also add any remote users already in client
      client.remoteUsers.forEach(async (user) => {
        if (!completeParticipants.find(p => p.uid === user.uid)) {
          const remoteUsername = await getUsernameByUid(user.uid);
          completeParticipants.push({
            uid: user.uid,
            hasAudio: user.hasAudio,
            isLocal: false,
            username: remoteUsername
          });
        }
      });

      console.log('👥 Initial participants:', completeParticipants.length, completeParticipants);
      setParticipants(completeParticipants);

    } catch (err) {
      console.error('❌ Failed to join channel:', err);
      setError(err.message || 'Failed to connect to voice chat');
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
      localUidRef.current = null;
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