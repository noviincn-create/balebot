/**
 * HubSpot Service - Contact Management
 */

const axios = require('axios');
const Logger = require('../utils/logger');
const config = require('../config');

const logger = new Logger('HubSpot Service', config.logLevel);

class HubSpotService {
  constructor() {
    this.client = axios.create({
      baseURL: `${config.hubspot.baseUrl}/crm/${config.hubspot.apiVersion}`,
      headers: {
        'Authorization': `Bearer ${config.hubspot.apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });
  }

  /**
   * Search contact by national code
   * @param {string} nationalCode - Iranian national code
   * @returns {Promise<Object|null>} Contact object or null
   */
  async searchContactByNationalCode(nationalCode) {
    try {
      logger.info('Searching contact by national code', { nationalCode });

      const response = await this.client.post('/objects/contacts/search', {
        filterGroups: [
          {
            filters: [
              {
                propertyName: 'national_code',
                operator: 'EQ',
                value: nationalCode,
              },
            ],
          },
        ],
        limit: 1,
      });

      if (response.data.results && response.data.results.length > 0) {
        const contact = response.data.results[0];
        logger.info('Contact found', { contactId: contact.id });
        return this.formatContactResponse(contact);
      }

      logger.info('No contact found', { nationalCode });
      return null;
    } catch (error) {
      logger.error('Error searching contact', {
        nationalCode,
        error: error.message,
        status: error.response?.status,
      });
      throw error;
    }
  }

  /**
   * Create new contact in HubSpot
   * @param {Object} contactData - Contact data
   * @returns {Promise<Object>} Created contact
   */
  async createContact(contactData) {
    try {
      logger.info('Creating contact', {
        firstName: contactData.firstName,
        nationalCode: contactData.nationalCode,
      });

      const response = await this.client.post('/objects/contacts', {
        properties: {
          firstname: contactData.firstName,
          lastname: contactData.lastName,
          phone: contactData.phone,
          national_code: contactData.nationalCode,
          father_name: contactData.fatherName,
          date_of_birth: contactData.dateOfBirth,
          email: contactData.email,
          // Custom properties from Zohal verification
          identity_verified: 'true',
          identity_verification_date: new Date().toISOString(),
          person_status: contactData.isAlive ? 'alive' : 'deceased',
        },
      });

      logger.info('Contact created successfully', {
        contactId: response.data.id,
      });

      return this.formatContactResponse(response.data);
    } catch (error) {
      logger.error('Error creating contact', {
        firstName: contactData.firstName,
        error: error.message,
        status: error.response?.status,
      });
      throw error;
    }
  }

  /**
   * Update existing contact
   * @param {string} contactId - HubSpot contact ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated contact
   */
  async updateContact(contactId, updateData) {
    try {
      logger.info('Updating contact', { contactId });

      const properties = {};
      if (updateData.firstName) properties.firstname = updateData.firstName;
      if (updateData.lastName) properties.lastname = updateData.lastName;
      if (updateData.phone) properties.phone = updateData.phone;
      if (updateData.email) properties.email = updateData.email;

      const response = await this.client.patch(
        `/objects/contacts/${contactId}`,
        { properties }
      );

      logger.info('Contact updated successfully', { contactId });
      return this.formatContactResponse(response.data);
    } catch (error) {
      logger.error('Error updating contact', {
        contactId,
        error: error.message,
        status: error.response?.status,
      });
      throw error;
    }
  }

  /**
   * Get contact by ID with all properties
   * @param {string} contactId - HubSpot contact ID
   * @returns {Promise<Object>} Contact object
   */
  async getContact(contactId) {
    try {
      logger.info('Fetching contact', { contactId });

      const response = await this.client.get(`/objects/contacts/${contactId}`, {
        params: {
          limit: 100,
        },
      });

      return this.formatContactResponse(response.data);
    } catch (error) {
      logger.error('Error fetching contact', {
        contactId,
        error: error.message,
        status: error.response?.status,
      });
      throw error;
    }
  }

  /**
   * Get HubSpot contact URL
   * @param {string} contactId - HubSpot contact ID
   * @returns {string} Contact profile URL
   */
  getContactUrl(contactId) {
    return `https://app.hubspot.com/contacts/${config.hubspot.accountId}/contact/${contactId}`;
  }

  /**
   * Format contact response
   * @private
   */
  formatContactResponse(contact) {
    const properties = contact.properties || {};
    return {
      id: contact.id,
      firstName: properties.firstname,
      lastName: properties.lastname,
      email: properties.email,
      phone: properties.phone,
      nationalCode: properties.national_code,
      fatherName: properties.father_name,
      dateOfBirth: properties.date_of_birth,
      isAlive: properties.person_status === 'alive',
      identityVerified: properties.identity_verified === 'true',
      url: this.getContactUrl(contact.id),
      createdAt: contact.createdAt,
      updatedAt: contact.updatedAt,
    };
  }
}

module.exports = new HubSpotService();
