// agoraService.js
const { RtmTokenBuilder, RtmRole } = require('agora-access-token');
const { RtcTokenBuilder, RtcRole } = require('agora-access-token');

class AgoraService {
  get appId() {
    return process.env.AGORA_APP_ID;
  }

  get appCertificate() {
    return process.env.AGORA_APP_CERTIFICATE;
  }

  isConfigured() {
    const configured = !!(this.appId && this.appCertificate);
    if (!configured) {
      console.error('Agora not configured:', {
        hasAppId: !!this.appId,
        hasCertificate: !!this.appCertificate
      });
    }
    return configured;
  }

  generateRtmToken(userId, expirationTime = 86400) {
    if (!this.isConfigured()) {
      throw new Error('Agora credentials not configured');
    }

    try {
      const currentTimestamp = Math.floor(Date.now() / 1000);
      const privilegeExpiredTs = currentTimestamp + expirationTime;

      const token = RtmTokenBuilder.buildToken(
        this.appId,
        this.appCertificate,
        userId,
        RtmRole.Rtm_User,
        privilegeExpiredTs
      );

      return { 
        token, 
        appId: this.appId, 
        userId, 
        expiresAt: privilegeExpiredTs 
      };
    } catch (error) {
      console.error('RTM Token generation error:', error);
      throw error;
    }
  }

  generateRtcToken(channelName, userId, expirationTime = 86400) {
    if (!this.isConfigured()) {
      throw new Error('Agora credentials not configured');
    }

    try {
      const currentTimestamp = Math.floor(Date.now() / 1000);
      const privilegeExpiredTs = currentTimestamp + expirationTime;

      // Convert userId to number (Agora RTC requires numeric UID)
      // Use hash if userId is not numeric
      let uid = 0;
      if (/^\d+$/.test(userId)) {
        uid = parseInt(userId, 10);
      } else {
        // Create a simple hash from userId string
        uid = userId.split('').reduce((acc, char) => {
          return ((acc << 5) - acc) + char.charCodeAt(0);
        }, 0) >>> 0; // Convert to positive 32-bit integer
      }

      console.log('Generating RTC token:', {
        channelName,
        userId,
        uid,
        appId: this.appId.substring(0, 8) + '...'
      });

      const token = RtcTokenBuilder.buildTokenWithUid(
        this.appId,
        this.appCertificate,
        channelName,
        uid,
        RtcRole.PUBLISHER,
        privilegeExpiredTs
      );

      return { 
        token, 
        appId: this.appId, 
        channelName, 
        uid,
        userId, 
        expiresAt: privilegeExpiredTs 
      };
    } catch (error) {
      console.error('RTC Token generation error:', error);
      throw error;
    }
  }
}

module.exports = new AgoraService();