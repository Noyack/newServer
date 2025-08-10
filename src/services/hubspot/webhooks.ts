import { WebhookPayload } from './types';

export const processHubspotWebhook = async (payload: WebhookPayload): Promise<void> => {
  try {
    const { eventId, subscriptionType, objectId, propertyName, propertyValue } = payload;
    
    switch (subscriptionType) {
      case 'contact.propertyChange':
        break;
      
      case 'deal.creation':
        break;
        
      default:
    }
  } catch (error) {
    console.error('Error processing HubSpot webhook:', error);
    throw error;
  }
};
