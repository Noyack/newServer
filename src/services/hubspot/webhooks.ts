import { WebhookPayload } from './types';

export const processHubspotWebhook = async (payload: WebhookPayload): Promise<void> => {
  try {
    const { eventId, subscriptionType, objectId, propertyName, propertyValue } = payload;
    
    console.log(`Received HubSpot webhook: ${subscriptionType} for object ${objectId}`);
    
    switch (subscriptionType) {
      case 'contact.propertyChange':
        console.log(`Contact ${objectId} property ${propertyName} changed to ${propertyValue}`);
        break;
      
      case 'deal.creation':
        console.log(`New deal created with ID ${objectId}`);
        break;
        
      default:
        console.log(`Unhandled webhook type: ${subscriptionType}`);
    }
  } catch (error) {
    console.error('Error processing HubSpot webhook:', error);
    throw error;
  }
};
