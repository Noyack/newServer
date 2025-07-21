// src/services/hubspot/deals.ts
import { hubspotClient } from './client';
import { DealProperties, CreateDealRequest, DealAssociation } from './types';

/**
 * Create a new deal in HubSpot
 */
export const createDeal = async (
  dealName: string,
  amount?: number,
  stage?: string,
  properties?: Record<string, string>
): Promise<string> => {
  try {
    const dealProperties: DealProperties = {
      dealname: dealName,
      ...(amount && { amount: amount.toString() }),
      ...(stage && { dealstage: stage }),
      ...properties,
    };

    const response = await hubspotClient.post('/crm/v3/objects/deals', {
      properties: dealProperties,
    });

    return response.data.id;
  } catch (error) {
    console.error('Error creating HubSpot deal:', error);
    throw error;
  }
};

/**
 * Create a deal and associate it with a contact
 */
export const createDealWithContact = async (
  contactId: string,
  dealName: string,
  amount?: number,
  stage?: string,
  properties?: Record<string, string>
): Promise<string> => {
  try {
    const dealProperties: DealProperties = {
      dealname: dealName,
      ...(amount && { amount: amount.toString() }),
      ...(stage && { dealstage: stage }),
      ...properties,
    };

    // Create the deal with association
    const dealRequest: CreateDealRequest = {
      properties: dealProperties,
      associations: [
        {
          to: { id: contactId },
          types: [
            {
              associationCategory: 'HUBSPOT_DEFINED',
              associationTypeId: 3, // Deal to Contact association
            },
          ],
        },
      ],
    };

    const response = await hubspotClient.post('/crm/v3/objects/deals', dealRequest);
    return response.data.id;
  } catch (error) {
    console.error('Error creating HubSpot deal with contact:', error);
    throw error;
  }
};

/**
 * Update an existing deal
 */
export const updateDeal = async (
  dealId: string,
  properties: Partial<DealProperties>
): Promise<void> => {
  try {
    await hubspotClient.patch(`/crm/v3/objects/deals/${dealId}`, {
      properties,
    });
  } catch (error) {
    console.error('Error updating HubSpot deal:', error);
    throw error;
  }
};

/**
 * Get deal by ID
 */
export const getDealById = async (
  dealId: string,
  properties?: string[]
): Promise<any> => {
  try {
    const defaultProperties = [
      'dealname',
      'amount',
      'dealstage',
      'closedate',
      'pipeline',
      'dealtype',
      'createdate'
    ];
    const requestedProperties = properties || defaultProperties;

    const response = await hubspotClient.get(`/crm/v3/objects/deals/${dealId}`, {
      params: {
        properties: requestedProperties,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error getting HubSpot deal:', error);
    throw error;
  }
};

/**
 * Get all deals with pagination
 */
export const getAllDeals = async (
  limit: number = 100,
  after?: string,
  properties?: string[]
): Promise<any> => {
  try {
    const params: any = { limit };
    if (after) params.after = after;
    if (properties) params.properties = properties;

    const response = await hubspotClient.get('/crm/v3/objects/deals', {
      params,
    });
    return response.data;
  } catch (error) {
    console.error('Error getting all HubSpot deals:', error);
    throw error;
  }
};

/**
 * Search for deals
 */
export const searchDeals = async (
  filterGroups: any[],
  sorts?: any[],
  properties?: string[],
  limit: number = 100,
  after?: string
): Promise<any> => {
  try {
    const searchRequest = {
      filterGroups,
      sorts: sorts || [],
      properties: properties || ['dealname', 'amount', 'dealstage', 'closedate'],
      limit,
      after,
    };

    const response = await hubspotClient.post('/crm/v3/objects/deals/search', searchRequest);
    return response.data;
  } catch (error) {
    console.error('Error searching HubSpot deals:', error);
    throw error;
  }
};

/**
 * Associate a deal with a contact (legacy method for existing deals)
 */
export const associateDealWithContact = async (
  dealId: string,
  contactId: string
): Promise<void> => {
  try {
    await hubspotClient.put(
      `/crm/v3/objects/deals/${dealId}/associations/contacts/${contactId}/deal_to_contact`,
      {}
    );
  } catch (error) {
    console.error('Error associating deal with contact:', error);
    throw error;
  }
};

/**
 * Associate a deal with a company
 */
export const associateDealWithCompany = async (
  dealId: string,
  companyId: string
): Promise<void> => {
  try {
    await hubspotClient.put(
      `/crm/v3/objects/deals/${dealId}/associations/companies/${companyId}/deal_to_company`,
      {}
    );
  } catch (error) {
    console.error('Error associating deal with company:', error);
    throw error;
  }
};

/**
 * Get deals associated with a contact
 */
export const getDealsForContact = async (contactId: string): Promise<any> => {
  try {
    const response = await hubspotClient.get(
      `/crm/v3/objects/contacts/${contactId}/associations/deals`
    );
    return response.data;
  } catch (error) {
    console.error('Error getting deals for contact:', error);
    throw error;
  }
};

/**
 * Delete a deal
 */
export const deleteDeal = async (dealId: string): Promise<void> => {
  try {
    await hubspotClient.delete(`/crm/v3/objects/deals/${dealId}`);
  } catch (error) {
    console.error('Error deleting HubSpot deal:', error);
    throw error;
  }
};

/**
 * Get deal pipelines
 */
export const getDealPipelines = async (): Promise<any> => {
  try {
    const response = await hubspotClient.get('/crm/v3/pipelines/deals');
    return response.data;
  } catch (error) {
    console.error('Error getting deal pipelines:', error);
    throw error;
  }
};

/**
 * Get deal stages for a specific pipeline
 */
export const getDealStages = async (pipelineId: string): Promise<any> => {
  try {
    const response = await hubspotClient.get(`/crm/v3/pipelines/deals/${pipelineId}`);
    return response.data;
  } catch (error) {
    console.error('Error getting deal stages:', error);
    throw error;
  }
};

/**
 * Batch create deals
 */
export const batchCreateDeals = async (
  deals: Array<{
    dealName: string;
    amount?: number;
    stage?: string;
    properties?: Record<string, string>;
    contactId?: string;
  }>
): Promise<string[]> => {
  try {
    const dealIds: string[] = [];
    
    // Process deals in batches of 10 to respect rate limits
    const batchSize = 10;
    for (let i = 0; i < deals.length; i += batchSize) {
      const batch = deals.slice(i, i + batchSize);
      
      const batchPromises = batch.map(deal => {
        if (deal.contactId) {
          return createDealWithContact(
            deal.contactId,
            deal.dealName,
            deal.amount,
            deal.stage,
            deal.properties
          );
        } else {
          return createDeal(
            deal.dealName,
            deal.amount,
            deal.stage,
            deal.properties
          );
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      dealIds.push(...batchResults);
      
      // Add delay between batches to respect rate limits
      if (i + batchSize < deals.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return dealIds;
  } catch (error) {
    console.error('Error batch creating deals:', error);
    throw error;
  }
};