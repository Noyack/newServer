import { hubspotClient } from './client';
import { DealProperties } from './types';

export const createDeal = async (
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

    const response = await hubspotClient.post('/crm/v3/objects/deals', {
      properties: dealProperties,
    });

    await hubspotClient.put(`/crm/v3/objects/deals/${response.data.id}/associations/contacts/${contactId}/deal_to_contact`, {});

    return response.data.id;
  } catch (error) {
    console.error('Error creating HubSpot deal:', error);
    throw error;
  }
};