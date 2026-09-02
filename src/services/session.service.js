/**
 * Session Management Service
 * Manages user sessions and state during contact creation flow
 */

const crypto = require('crypto');
const Logger = require('../utils/logger');
const config = require('../config');

const logger = new Logger('Session Service', config.logLevel);

class SessionService {
  constructor() {
    // In-memory storage (for development)
    // In production, use Redis or KV store
    this.sessions = new Map();
  }

  /**
   * Create new session
   * @returns {string} Session ID
   */
  createSession() {
    const sessionId = crypto.randomUUID();
    const session = {
      id: sessionId,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + config.session.expiryMinutes * 60 * 1000),
      state: 'initial',
      data: {},
    };

    this.sessions.set(sessionId, session);
    logger.info('Session created', { sessionId });

    return sessionId;
  }

  /**
   * Get session
   * @param {string} sessionId - Session ID
   * @returns {Object} Session data
   */
  getSession(sessionId) {
    const session = this.sessions.get(sessionId);

    if (!session) {
      logger.warn('Session not found', { sessionId });
      throw new Error('Session not found');
    }

    if (new Date() > session.expiresAt) {
      logger.warn('Session expired', { sessionId });
      this.sessions.delete(sessionId);
      throw new Error('Session expired');
    }

    return session;
  }

  /**
   * Update session state
   * @param {string} sessionId - Session ID
   * @param {string} state - New state
   * @param {Object} data - Data to merge
   */
  updateSession(sessionId, state, data = {}) {
    const session = this.getSession(sessionId);

    session.state = state;
    session.data = {
      ...session.data,
      ...data,
    };
    session.updatedAt = new Date();

    logger.info('Session updated', {
      sessionId,
      state,
      dataKeys: Object.keys(data),
    });
  }

  /**
   * Store OTP for session
   * @param {string} sessionId - Session ID
   * @param {string} otpCode - OTP code
   * @param {string} phoneNumber - Phone number
   */
  storeOTP(sessionId, otpCode, phoneNumber) {
    const session = this.getSession(sessionId);

    session.data.otp = {
      code: otpCode,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + config.otp.expiryMinutes * 60 * 1000),
      attempts: 0,
      phoneNumber: phoneNumber,
    };

    logger.info('OTP stored', {
      sessionId,
      phoneNumber: this.maskPhoneNumber(phoneNumber),
    });
  }

  /**
   * Verify OTP
   * @param {string} sessionId - Session ID
   * @param {string} otpCode - OTP code to verify
   * @returns {boolean} Is valid
   */
  verifyOTP(sessionId, otpCode) {
    const session = this.getSession(sessionId);
    const otp = session.data.otp;

    if (!otp) {
      logger.warn('No OTP found in session', { sessionId });
      throw new Error('OTP not found');
    }

    if (new Date() > otp.expiresAt) {
      logger.warn('OTP expired', { sessionId });
      throw new Error('OTP expired');
    }

    otp.attempts++;

    if (otp.attempts > config.otp.maxAttempts) {
      logger.warn('OTP max attempts exceeded', { sessionId });
      throw new Error('OTP max attempts exceeded');
    }

    if (otp.code !== otpCode) {
      logger.warn('OTP verification failed', {
        sessionId,
        attempt: otp.attempts,
      });
      return false;
    }

    logger.info('OTP verified', { sessionId });
    session.data.otpVerified = true;
    return true;
  }

  /**
   * Store identity data
   * @param {string} sessionId - Session ID
   * @param {Object} identityData - Verified identity data
   */
  storeIdentityData(sessionId, identityData) {
    const session = this.getSession(sessionId);

    session.data.identity = identityData;

    logger.info('Identity data stored', {
      sessionId,
      firstName: identityData.firstName,
    });
  }

  /**
   * Store HubSpot contact
   * @param {string} sessionId - Session ID
   * @param {Object} contactData - HubSpot contact data
   */
  storeContactData(sessionId, contactData) {
    const session = this.getSession(sessionId);

    session.data.contact = contactData;

    logger.info('Contact data stored', {
      sessionId,
      contactId: contactData.id,
    });
  }

  /**
   * Get full session data
   * @param {string} sessionId - Session ID
   * @returns {Object} Full session data
   */
  getSessionData(sessionId) {
    const session = this.getSession(sessionId);
    return {
      id: session.id,
      state: session.state,
      data: session.data,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      expiresAt: session.expiresAt,
    };
  }

  /**
   * Delete session
   * @param {string} sessionId - Session ID
   */
  deleteSession(sessionId) {
    this.sessions.delete(sessionId);
    logger.info('Session deleted', { sessionId });
  }

  /**
   * Mask phone number for logging
   * @private
   */
  maskPhoneNumber(phoneNumber) {
    return phoneNumber.substring(0, 4) + '****' + phoneNumber.substring(8);
  }
}

module.exports = new SessionService();
