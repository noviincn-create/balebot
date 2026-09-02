/**
 * Zohal Identity Verification Service
 * Verifies Iranian national identity information
 */

const axios = require('axios');
const Logger = require('../utils/logger');
const config = require('../config');

const logger = new Logger('Zohal Service', config.logLevel);

class ZohalService {
  constructor() {
    this.client = axios.create({
      baseURL: config.zohal.baseUrl,
      headers: {
        'Authorization': `Bearer ${config.zohal.token}`,
        'Content-Type': 'application/json',
      },
      timeout: 15000,
    });
  }

  /**
   * Verify national identity
   * @param {string} nationalCode - Iranian national code
   * @param {string} birthDate - Birth date in Persian calendar (13xx/0x/3x)
   * @returns {Promise<Object>} Verification result with identity data
   */
  async verifyNationalIdentity(nationalCode, birthDate) {
    try {
      logger.info('Verifying national identity', {
        nationalCode: this.maskNationalCode(nationalCode),
      });

      // Validate inputs
      this.validateNationalCode(nationalCode);
      this.validateBirthDate(birthDate);

      const response = await this.client.post(
        config.zohal.endpoint,
        {
          national_code: nationalCode,
          birth_date: birthDate,
        }
      );

      const data = response.data;

      if (data.result !== 1) {
        logger.warn('Verification failed', {
          result: data.result,
          message: data.message,
        });
        return {
          success: false,
          message: data.message,
          errorCode: data.error_code,
        };
      }

      const identityData = data.response_body?.data || {};

      if (!identityData.matched) {
        logger.warn('Identity data not matched', {
          nationalCode: this.maskNationalCode(nationalCode),
        });
        return {
          success: false,
          message: 'کد ملی و تاریخ تولد با هم مطابقت ندارند',
          matched: false,
        };
      }

      logger.info('Identity verified successfully', {
        nationalCode: this.maskNationalCode(nationalCode),
        firstName: identityData.first_name,
      });

      return {
        success: true,
        matched: identityData.matched,
        data: {
          nationalCode: identityData.national_code,
          firstName: identityData.first_name,
          lastName: identityData.last_name,
          fatherName: identityData.father_name,
          isAlive: identityData.alive,
          isDead: identityData.is_dead,
        },
      };
    } catch (error) {
      if (error.response?.status === 400) {
        logger.error('Invalid input data', {
          error: error.response.data,
        });
        return {
          success: false,
          message: error.response.data.message || 'داده های ورودی نامعتبر هستند',
          errorCode: error.response.data.error_code,
        };
      }

      logger.error('Error verifying identity', {
        error: error.message,
        status: error.response?.status,
      });
      throw error;
    }
  }

  /**
   * Validate Iranian national code format
   * @private
   */
  validateNationalCode(nationalCode) {
    const pattern = /^\d{10}$/;
    if (!pattern.test(nationalCode)) {
      throw new Error('کد ملی باید 10 رقم باشد');
    }
  }

  /**
   * Validate Persian/Jalali calendar birth date format
   * @private
   */
  validateBirthDate(birthDate) {
    const pattern = /^\d{4}\/\d{2}\/\d{2}$/;
    if (!pattern.test(birthDate)) {
      throw new Error('تاریخ تولد باید به صورت YYYY/MM/DD (تقویم جلالی) باشد');
    }

    const [year, month, day] = birthDate.split('/').map(Number);

    if (year < 1280 || year > 1430) {
      throw new Error('سال باید بین 1280 تا 1430 باشد');
    }

    if (month < 1 || month > 12) {
      throw new Error('ماه باید بین 1 تا 12 باشد');
    }

    if (day < 1 || day > 31) {
      throw new Error('روز باید بین 1 تا 31 باشد');
    }
  }

  /**
   * Mask national code for logging (shows only first 3 and last 2 digits)
   * @private
   */
  maskNationalCode(nationalCode) {
    return nationalCode.substring(0, 3) + '***' + nationalCode.substring(8);
  }
}

module.exports = new ZohalService();
