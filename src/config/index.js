/**
 * Centralized Configuration Management
 */

const config = {
  // HubSpot
  hubspot: {
    apiKey: process.env.HUBSPOT_API_KEY || '',
    accountId: process.env.HUBSPOT_ACCOUNT_ID || '',
    baseUrl: 'https://api.hubapi.com',
    apiVersion: 'v3',
  },

  // Zohal Identity Service
  zohal: {
    baseUrl: process.env.ZOHAL_API_URL || 'https://service.zohal.io/api/v0',
    token: process.env.ZOHAL_API_TOKEN || '',
    endpoint: '/services/inquiry/national_identity_inquiry',
  },

  // SMS Provider
  sms: {
    provider: process.env.SMS_PROVIDER || 'kavenegar',
    kavenegar: {
      apiKey: process.env.KAVENEGAR_API_KEY || '',
      sender: process.env.KAVENEGAR_SENDER || 'BaleBot',
      baseUrl: 'https://api.kavenegar.com/v1',
    },
    twilio: {
      accountSid: process.env.TWILIO_ACCOUNT_SID || '',
      authToken: process.env.TWILIO_AUTH_TOKEN || '',
      phoneNumber: process.env.TWILIO_PHONE_NUMBER || '',
    },
  },

  // OTP Configuration
  otp: {
    expiryMinutes: parseInt(process.env.OTP_EXPIRY_MINUTES || '5'),
    length: parseInt(process.env.OTP_LENGTH || '6'),
    maxAttempts: 3,
  },

  // Session Configuration
  session: {
    expiryMinutes: parseInt(process.env.SESSION_EXPIRY_MINUTES || '30'),
  },

  // General
  environment: process.env.ENVIRONMENT || 'development',
  logLevel: process.env.LOG_LEVEL || 'info',
};

module.exports = config;
