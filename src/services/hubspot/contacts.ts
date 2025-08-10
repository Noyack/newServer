// src/services/hubspot/contacts.ts
import { hubspotClient } from './client';
import { ContactProperties, ContactSearchParams, ContactSearchResult } from './types';
import fs from 'fs';

/**
 * Create a new contact in HubSpot
 */
export const createContact = async (
  email: string,
  firstName?: string,
  lastName?: string,
  properties?: Record<string, string>
): Promise<string> => {
  try {
    const contactProperties: ContactProperties = {
      email,
      ...(firstName && { firstname: firstName }),
      ...(lastName && { lastname: lastName }),
      ...properties,
    };

    const createResponse = await hubspotClient.post('/crm/v3/objects/contacts', {
      properties: contactProperties,
    });

    return createResponse.data.id;
  } catch (error) {
    console.error('Error creating HubSpot contact:', error);
    throw error;
  }
};

/**
 * Update an existing contact in HubSpot
 */
export const updateContact = async (
  contactId: string,
  properties: Partial<ContactProperties>
): Promise<void> => {
  try {
    await hubspotClient.patch(`/crm/v3/objects/contacts/${contactId}`, {
      properties,
    });
  } catch (error) {
    console.error('Error updating HubSpot contact:', error);
    throw error;
  }
};

/**
 * Search for contacts by email
 */
export const searchContactsByEmail = async (email: string): Promise<ContactSearchResult> => {
  try {
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

    return searchResponse.data;
  } catch (error) {
    console.error('Error searching HubSpot contacts:', error);
    throw error;
  }
};

/**
 * Advanced contact search with multiple filters
 */
export const searchContacts = async (params: ContactSearchParams): Promise<ContactSearchResult> => {
  try {
    const searchResponse = await hubspotClient.post(`/crm/v3/objects/contacts/search`, {
      filterGroups: params.filterGroups,
      sorts: params.sorts,
      properties: params.properties,
      limit: params.limit || 100,
      after: params.after,
    });

    return searchResponse.data;
  } catch (error) {
    console.error('Error performing advanced contact search:', error);
    throw error;
  }
};

/**
 * Create or update a contact (upsert functionality)
 */
export const createOrUpdateContact = async (
  email: string,
  firstName?: string,
  lastName?: string,
  properties?: Record<string, string>
): Promise<string> => {
  try {
    // First check if contact exists
    const searchResult = await searchContactsByEmail(email);

    const contactProperties: ContactProperties = {
      email,
      ...(firstName && { firstname: firstName }),
      ...(lastName && { lastname: lastName }),
      ...properties,
    };

    // If contact exists, update it
    if (searchResult.results && searchResult.results.length > 0) {
      const contactId = searchResult.results[0].id;
      await updateContact(contactId, contactProperties);
      return contactId;
    }

    // Otherwise create a new contact
    return await createContact(email, firstName, lastName, properties);
  } catch (error) {
    console.error('Error creating/updating HubSpot contact:', error);
    throw error;
  }
};

/**
 * Sync user data with HubSpot
 */
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

/**
 * Get contact by ID with specific properties
 */
export const getContactById = async (
  contactId: string,
  properties?: string[]
): Promise<any> => {
  try {
    const defaultProperties = ['email', 'firstname', 'lastname', 'hs_calculated_phone', 'website'];
    const requestedProperties = properties || defaultProperties;

    const response = await hubspotClient.get(`/crm/v3/objects/contacts/${contactId}`, {
      params: {
        properties: requestedProperties,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error getting HubSpot contact:', error);
    throw error;
  }
};

/**
 * Get all contacts with pagination
 */
export const getAllContacts = async (
  limit: number = 100,
  after?: string,
  properties?: string[]
): Promise<any> => {
  try {
    const params: any = { limit };
    if (after) params.after = after;
    if (properties) params.properties = properties;

    const response = await hubspotClient.get('/crm/v3/objects/contacts', {
      params,
    });
    return response.data;
  } catch (error) {
    console.error('Error getting all HubSpot contacts:', error);
    throw error;
  }
};

/**
 * Get a random contact for testing purposes
 */
export const getRandomContact = async (): Promise<any> => {
  try {
    const response = await getAllContacts(10, undefined, ['*']);

    if (response.results && response.results.length > 0) {
      const randomIndex = Math.floor(Math.random() * response.results.length);
      return response.results[randomIndex];
    }
    return null;
  } catch (error) {
    console.error('Error getting random HubSpot contact:', error);
    return null;
  }
};

/**
 * Add contact to a static list (using legacy v1 API)
 */
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

/**
 * Remove contact from a static list (using legacy v1 API)
 */
export const removeContactFromList = async (contactId: string, listId: string): Promise<void> => {
  try {
    await hubspotClient.post(`/contacts/v1/lists/${listId}/remove`, {
      vids: [contactId],
    });
  } catch (error) {
    console.error('Error removing contact from list:', error);
    throw error;
  }
};

/**
 * Batch create/update contacts
 */
export const batchCreateOrUpdateContacts = async (
  contacts: Array<{
    email: string;
    firstName?: string;
    lastName?: string;
    properties?: Record<string, string>;
  }>
): Promise<string[]> => {
  try {
    const contactIds: string[] = [];
    
    // Process contacts in batches of 10 to respect rate limits
    const batchSize = 10;
    for (let i = 0; i < contacts.length; i += batchSize) {
      const batch = contacts.slice(i, i + batchSize);
      
      const batchPromises = batch.map(contact =>
        createOrUpdateContact(
          contact.email,
          contact.firstName,
          contact.lastName,
          contact.properties
        )
      );
      
      const batchResults = await Promise.all(batchPromises);
      contactIds.push(...batchResults);
      
      // Add delay between batches to respect rate limits
      if (i + batchSize < contacts.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return contactIds;
  } catch (error) {
    console.error('Error batch creating/updating contacts:', error);
    throw error;
  }
};

/**
 * Delete a contact
 */
export const deleteContact = async (contactId: string): Promise<void> => {
  try {
    await hubspotClient.delete(`/crm/v3/objects/contacts/${contactId}`);
  } catch (error) {
    console.error('Error deleting HubSpot contact:', error);
    throw error;
  }
};

/**
 * Get all contact properties for debugging/export purposes
 */
export const getContactProperties = async (): Promise<void> => {
  try {
    const propertiesResponse = await hubspotClient.get('/crm/v3/properties/contacts');
    
    const properties = propertiesResponse.data;
    
    // Write to file with proper JSON formatting
    fs.writeFile(
      './hubspot-contact-properties.json', 
      JSON.stringify(properties, null, 2), 
      (err) => {
        if (err) {
          console.error('Error writing properties to file:', err);
        } else {
        }
      }
    );
    
    const sampleProperties = properties.results.slice(0, 5).map((p: { name: any; }) => p.name);
    
  } catch (error) {
    console.error('Error getting HubSpot contact properties:', error);
  }
};