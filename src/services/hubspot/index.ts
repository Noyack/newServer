// src/services/hubspot/index.ts

// Export all client functionality
export * from './client';

// Export all contact services
export * as contacts from './contacts';

// Export all deal services  
export * as deals from './deals';

// Export all marketing services
export * as marketing from './marketing';

// Export all activity services
export * as activities from './activities';

// Export all webhook services
export * as webhooks from './webhooks';

// Export all user sync services
export * as userSync from './userSync';

// Export all types
export * from './types';

// For backward compatibility, also export individual functions
export {
  // Contact functions
  createContact,
  updateContact,
  createOrUpdateContact,
  syncUserWithHubspot,
  getContactById,
  getAllContacts,
  searchContactsByEmail,
  searchContacts,
  addContactToList,
  removeContactFromList,
  getRandomContact,
  batchCreateOrUpdateContacts,
  deleteContact,
  getContactProperties,
} from './contacts';

export {
  // Deal functions
  createDeal,
  createDealWithContact,
  updateDeal,
  getDealById,
  getAllDeals,
  searchDeals,
  associateDealWithContact,
  associateDealWithCompany,
  getDealsForContact,
  deleteDeal,
  getDealPipelines,
  getDealStages,
  batchCreateDeals,
} from './deals';

export {
  // Marketing functions
  getMarketingEvents,
  getMarketingEventById,
  createMarketingEvent,
  getMarketingEventsByDateRange,
} from './marketing';

export {
  // Activity functions
  logActivity,
} from './activities';

export {
  // Webhook functions
  processHubspotWebhook,
} from './webhooks';

export {
  // User sync functions
  syncUserWithHubSpot,
  bulkSyncExistingUsers,
  getUserSyncStatus,
  retrySyncForUser,
} from './userSync';

// Utility functions for common operations
export const hubspotUtils = {
  // Contact utilities
  async findOrCreateContact(email: string, firstName?: string, lastName?: string, properties?: Record<string, string>) {
    const { createOrUpdateContact } = await import('./contacts');
    return createOrUpdateContact(email, firstName, lastName, properties);
  },

  // Deal utilities
  async createDealForUser(userId: number, dealName: string, amount?: number, stage?: string) {
    const { searchContactsByEmail } = await import('./contacts');
    const { createDealWithContact } = await import('./deals');
    
    // This would require user service integration to get email from userId
    // For now, return the deal creation function
    throw new Error('User service integration required - use createDealWithContact directly');
  },

  // User sync utilities
  async ensureUserHasHubSpotContact(userId: string): Promise<string> {
    const { getUserSyncStatus, retrySyncForUser } = await import('./userSync');
    
    const status = await getUserSyncStatus(userId);
    
    if (status.hasHubSpotContact && status.hubspotContactId) {
      return status.hubspotContactId;
    }
    
    // Sync user if no contact exists
    const result = await retrySyncForUser(userId);
    return result.contactId;
  },

  // Formatting utilities
  formatContactForDisplay(contact: any) {
    return {
      id: contact.id,
      name: `${contact.properties?.firstname || ''} ${contact.properties?.lastname || ''}`.trim(),
      email: contact.properties?.email,
      phone: contact.properties?.phone,
      company: contact.properties?.company,
      createdAt: contact.createdAt,
      updatedAt: contact.updatedAt,
    };
  },

  formatDealForDisplay(deal: any) {
    return {
      id: deal.id,
      name: deal.properties?.dealname,
      amount: deal.properties?.amount ? parseFloat(deal.properties.amount) : null,
      stage: deal.properties?.dealstage,
      closeDate: deal.properties?.closedate,
      pipeline: deal.properties?.pipeline,
      createdAt: deal.createdAt,
      updatedAt: deal.updatedAt,
    };
  },

  // Validation utilities
  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  validatePhoneNumber(phone: string): boolean {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/[-\s\(\)]/g, ''));
  },

  // Sync status helpers
  formatSyncStatus(status: any) {
    return {
      hasContact: status.hasHubSpotContact,
      contactId: status.hubspotContactId,
      lastSync: status.lastSyncLog?.createdAt,
      lastSyncStatus: status.lastSyncLog?.status,
      needsSync: !status.hasHubSpotContact
    };
  }
};