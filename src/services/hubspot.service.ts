import axios from 'axios';
import { config } from '../config';
import  fs from 'fs'

// Base URL for HubSpot API
const HUBSPOT_API_URL = 'https://api.hubapi.com';

// Create an axios instance for HubSpot
export const hubspotClient = axios.create({
  baseURL: HUBSPOT_API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${config.hubspotApiKey}`,
  },
});

// Create or update a contact in HubSpot
export const createOrUpdateContact = async (
  email: string,
  firstName?: string,
  lastName?: string,
  properties?: Record<string, string>
): Promise<string> => {
  try {
    // First check if contact exists
    const searchResponse = await hubspotClient.post(`/crm/v3/objects/contacts/search`, {
      filterGroups: [
        {
          filters: [
            {
              propertyName: 'email',
              operator: 'EQ',
              value: email,
            },
          ],
        },
      ],
    });

    const contactProperties = {
      email,
      ...(firstName && { firstname: firstName }),
      ...(lastName && { lastname: lastName }),
      ...properties,
    };

    // If contact exists, update it
    if (searchResponse.data.results && searchResponse.data.results.length > 0) {
      const contactId = searchResponse.data.results[0].id;
      await hubspotClient.patch(`/crm/v3/objects/contacts/${contactId}`, {
        properties: contactProperties,
      });
      return contactId;
    }

    // Otherwise create a new contact
    const createResponse = await hubspotClient.post('/crm/v3/objects/contacts', {
      properties: contactProperties,
    });

    return createResponse.data.id;
  } catch (error) {
    console.error('Error creating/updating HubSpot contact:', error);
    throw error;
  }
};

// Sync user data with HubSpot
export const syncUserWithHubspot = async (
  userId: number,
  email: string,
  firstName?: string,
  lastName?: string,
  additionalProperties?: Record<string, string>
): Promise<string> => {
  try {
    // Prepare additional properties with user ID
    const properties = {
      ...additionalProperties,
      user_id: userId.toString(),
    };

    // Create or update the contact
    const contactId = await createOrUpdateContact(email, firstName, lastName, properties);
    
    return contactId;
  } catch (error) {
    console.error('Error syncing user with HubSpot:', error);
    throw error;
  }
};

// Add a contact to a static list
export const addContactToList = async (contactId: string, listId: string): Promise<void> => {
  try {
    await hubspotClient.post(`/contacts/v1/lists/${listId}/add`, {
      vids: [contactId],
    });
  } catch (error) {
    console.error('Error adding contact to list:', error);
    throw error;
  }
};

// Create a deal in HubSpot
export const createDeal = async (
  contactId: string,
  dealName: string,
  amount?: number,
  stage?: string,
  properties?: Record<string, string>
): Promise<string> => {
  try {
    const dealProperties = {
      dealname: dealName,
      ...(amount && { amount: amount.toString() }),
      ...(stage && { dealstage: stage }),
      ...properties,
    };

    // Create the deal
    const response = await hubspotClient.post('/crm/v3/objects/deals', {
      properties: dealProperties,
    });

    // Associate the deal with the contact
    await hubspotClient.put(`/crm/v3/objects/deals/${response.data.id}/associations/contacts/${contactId}/deal_to_contact`, {});

    return response.data.id;
  } catch (error) {
    console.error('Error creating HubSpot deal:', error);
    throw error;
  }
};

// Get contact by ID
export const getContactById = async (contactId: string): Promise<any> => {
  try {
    const response = await hubspotClient.get(`/crm/v3/objects/contacts/${contactId}`, {
      params: {
        properties: ['email', 'firstname', 'lastname', 'hs_calculated_phone', 'website'],
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error getting HubSpot contact:', error);
    throw error;
  }
};

// Process webhook events from HubSpot
export const processHubspotWebhook = async (
  payload: any
): Promise<void> => {
  try {
    // Extract the event type and data from the payload
    const { eventId, subscriptionType, objectId, propertyName, propertyValue } = payload;
    
    // Handle different event types
    switch (subscriptionType) {
      case 'contact.propertyChange':
        // Handle contact property change
        // Implement your business logic here
        break;
      
      case 'deal.creation':
        // Handle deal creation
        // Implement your business logic here
        break;
        
      // Add more cases as needed
        
      default:
    }
  } catch (error) {
    console.error('Error processing HubSpot webhook:', error);
    throw error;
  }
};

// Log activities for a contact
export const logActivity = async (
  contactId: string,
  activityType: string,
  subject: string,
  notes?: string
): Promise<string> => {
  try {
    // Create an engagement (activity)
    const response = await hubspotClient.post('/engagements/v1/engagements', {
      engagement: {
        type: activityType, // 'NOTE', 'TASK', 'MEETING', 'CALL', 'EMAIL'
      },
      associations: {
        contactIds: [contactId],
      },
      metadata: {
        subject,
        body: notes || '',
      },
    });

    return response.data.engagement.id;
  } catch (error) {
    console.error('Error logging HubSpot activity:', error);
    throw error;
  }
};


// Add this function to your hubspot.service.ts file

/**
 * Get a random contact from HubSpot
 * @returns A random contact object or null if none found
 */
export const getRandomContact = async (): Promise<any> => {
    try {
      // Get a list of contacts (limit to a small number)
      const response = await hubspotClient.get('/crm/v3/objects/contacts', {
        params: {
          limit: 10,
          properties: ['*'],
        },
      });
      const propertiesResponse = await hubspotClient.get('/crm/v3/properties/contacts');
      fs.writeFile('./test.txt', String(propertiesResponse), err => {
        if (err) {
          console.error(err);
        } else {
          // file written successfully
        }
      })
  
      // Check if any contacts were returned
      if (response.data.results && response.data.results.length > 0) {
        // Select a random contact from the list
        const randomIndex = Math.floor(Math.random() * response.data.results.length);
        return response.data.results[randomIndex];
      }
      
      return null;
    } catch (error) {
      console.error('Error getting random HubSpot contact:', error);
      return null;
    }
  };