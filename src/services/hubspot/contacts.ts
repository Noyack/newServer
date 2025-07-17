import { hubspotClient } from './client';
import { ContactProperties } from './types';
import fs from 'fs';

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

    const contactProperties: ContactProperties = {
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

export const syncUserWithHubspot = async (
  userId: number,
  email: string,
  firstName?: string,
  lastName?: string,
  additionalProperties?: Record<string, string>
): Promise<string> => {
  try {
    const properties = {
      ...additionalProperties,
      user_id: userId.toString(),
    };

    const contactId = await createOrUpdateContact(email, firstName, lastName, properties);
    return contactId;
  } catch (error) {
    console.error('Error syncing user with HubSpot:', error);
    throw error;
  }
};

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

export const getRandomContact = async (): Promise<any> => {
  try {
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
    });

    console.log('Available contact properties:', propertiesResponse.data.results.map((p: { name: any; }) => p.name));

    if (response.data.results && response.data.results.length > 0) {
      const randomIndex = Math.floor(Math.random() * response.data.results.length);
      return response.data.results[randomIndex];
    }
    
    console.log('No contacts found in HubSpot');
    return null;
  } catch (error) {
    console.error('Error getting random HubSpot contact:', error);
    return null;
  }
};