// src/services/agoraService.js - Frontend Agora RTM Integration
import AgoraRTM from 'agora-rtm-sdk';

class AgoraRTMService {
  constructor() {
    this.client = null;
    this.channel = null;
    this.messageCallback = null;
    this.currentUserId = null;
  }

  /**
   * Initialize Agora RTM client
   * @param {string} appId - Agora App ID
   * @param {string} userId - User ID
   * @param {string} token - RTM token from backend
   */
  async initialize(appId, userId, token) {
    try {
      // Create RTM client
      this.client = AgoraRTM.createInstance(appId);
      this.currentUserId = userId;

      // Login to RTM
      await this.client.login({ uid: userId, token });
      
      console.log('Agora RTM: Logged in successfully');
      
      // Set up event listeners
      this.setupEventListeners();
      
      return true;
    } catch (error) {
      console.error('Agora RTM initialization failed:', error);
      throw error;
    }
  }

  /**
   * Join a channel
   * @param {string} channelName - Channel name to join
   */
  async joinChannel(channelName) {
    try {
      if (this.channel) {
        await this.channel.leave();
      }

      // Create and join channel
      this.channel = this.client.createChannel(channelName);
      await this.channel.join();

      console.log(`Agora RTM: Joined channel ${channelName}`);

      // Set up channel message listener
      this.channel.on('ChannelMessage', (message, memberId) => {
        if (this.messageCallback) {
          this.messageCallback({
            text: message.text,
            userId: memberId,
            timestamp: new Date().toISOString()
          });
        }
      });

      return true;
    } catch (error) {
      console.error('Failed to join channel:', error);
      throw error;
    }
  }

  /**
   * Send message to current channel
   * @param {string} text - Message text
   */
  async sendMessage(text) {
    try {
      if (!this.channel) {
        throw new Error('No active channel');
      }

      await this.channel.sendMessage({ text });
      return true;
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  }

  /**
   * Set callback for receiving messages
   * @param {Function} callback - Callback function
   */
  onMessage(callback) {
    this.messageCallback = callback;
  }

  /**
   * Leave current channel
   */
  async leaveChannel() {
    try {
      if (this.channel) {
        await this.channel.leave();
        this.channel = null;
      }
    } catch (error) {
      console.error('Failed to leave channel:', error);
    }
  }

  /**
   * Logout from RTM
   */
  async logout() {
    try {
      await this.leaveChannel();
      if (this.client) {
        await this.client.logout();
        this.client = null;
      }
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  }

  /**
   * Set up event listeners for connection state
   */
  setupEventListeners() {
    this.client.on('ConnectionStateChanged', (newState, reason) => {
      console.log('Agora RTM connection state:', newState, 'Reason:', reason);
    });

    this.client.on('MessageFromPeer', (message, peerId) => {
      console.log('Peer message from:', peerId, 'Message:', message.text);
    });
  }

  /**
   * Get online members in current channel
   */
  async getChannelMembers() {
    try {
      if (!this.channel) return [];
      const members = await this.channel.getMembers();
      return members;
    } catch (error) {
      console.error('Failed to get channel members:', error);
      return [];
    }
  }
}

export default new AgoraRTMService();