/**
 * SMS/OTP Service
 * Handles OTP generation, sending, and verification
 */

const axios = require('axios');
const Logger = require('../utils/logger');
const config = require('../config');

const logger = new Logger('SMS Service', config.logLevel);

class SMSService {
  constructor() {
    this.provider = config.sms.provider;
    
    if (this.provider === 'kavenegar') {
      this.kavanegar = axios.create({
        baseURL: config.sms.kavenegar.baseUrl,
        timeout: 10000,
      });
    } else if (this.provider === 'twilio') {
      this.twilio = require('twilio')(
        config.sms.twilio.accountSid,
        config.sms.twilio.authToken
      );
    }
  }

  /**
   * Generate OTP code
   * @returns {string} Generated OTP
   */
  generateOTP() {
    const length = config.otp.length;
    return Math.floor(Math.random() * Math.pow(10, length))
      .toString()
      .padStart(length, '0');
  }

  /**
   * Send OTP via SMS
   * @param {string} phoneNumber - Phone number (with country code)
   * @param {Object} otpData - OTP data
   * @returns {Promise<Object>} Send result
   */
  async sendOTP(phoneNumber, otpData) {
    try {
      logger.info('Sending OTP', { phoneNumber: this.maskPhoneNumber(phoneNumber) });

      if (this.provider === 'kavenegar') {
        return await this.sendViaKavenegar(phoneNumber, otpData);
      } else if (this.provider === 'twilio') {
        return await this.sendViaTwilio(phoneNumber, otpData);
      } else {
        throw new Error(`Unsupported SMS provider: ${this.provider}`);
      }
    } catch (error) {
      logger.error('Error sending OTP', {
        phoneNumber: this.maskPhoneNumber(phoneNumber),
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Send OTP via Kavenegar
   * @private
   */
  async sendViaKavenegar(phoneNumber, otpData) {
    const message = `کد تأیید: ${otpData.code}\nاین کد ${config.otp.expiryMinutes} دقیقه معتبر است`;

    try {
      const response = await this.kavanegar.get(`/${config.sms.kavenegar.apiKey}/sms/send.json`, {
        params: {
          receptor: this.normalizePhoneNumber(phoneNumber),
          sender: config.sms.kavenegar.sender,
          message: message,
        },
      });

      if (response.data.result === 200) {
        logger.info('OTP sent successfully via Kavenegar', {
          messageId: response.data.entries?.[0]?.messageid,
        });
        return {
          success: true,
          provider: 'kavenegar',
          messageId: response.data.entries?.[0]?.messageid,
        };
      } else {
        throw new Error(`Kavenegar error: ${response.data.result}`);
      }
    } catch (error) {
      logger.error('Kavenegar send error', { error: error.message });
      throw error;
    }
  }

  /**
   * Send OTP via Twilio
   * @private
   */
  async sendViaTwilio(phoneNumber, otpData) {
    const message = `Verification code: ${otpData.code}\nValid for ${config.otp.expiryMinutes} minutes`;

    try {
      const result = await this.twilio.messages.create({
        body: message,
        from: config.sms.twilio.phoneNumber,
        to: this.normalizePhoneNumber(phoneNumber),
      });

      logger.info('OTP sent successfully via Twilio', {
        messageId: result.sid,
      });

      return {
        success: true,
        provider: 'twilio',
        messageId: result.sid,
      };
    } catch (error) {
      logger.error('Twilio send error', { error: error.message });
      throw error;
    }
  }

  /**
   * Normalize phone number format
   * Converts +98xxxxxxx or 09xxxxxxx to 98xxxxxxx
   * @private
   */
  normalizePhoneNumber(phoneNumber) {
    let normalized = phoneNumber.replace(/\D/g, '');
    
    if (normalized.startsWith('0')) {
      normalized = '98' + normalized.substring(1);
    } else if (!normalized.startsWith('98')) {
      normalized = '98' + normalized;
    }

    return normalized;
  }

  /**
   * Mask phone number for logging
   * @private
   */
  maskPhoneNumber(phoneNumber) {
    const normalized = this.normalizePhoneNumber(phoneNumber);
    return normalized.substring(0, 4) + '****' + normalized.substring(8);
  }
}

module.exports = new SMSService();
