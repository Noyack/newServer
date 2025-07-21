// src/services/hubspot/userSync.ts
import { db } from '../../db';
import { users, hubspotSyncLogs } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { hubspotClient } from './client';
import { v4 as uuidv4 } from 'uuid';

/**
 * Search for a contact by email in HubSpot
 */
const searchContactByEmail = async (email: string): Promise<string | null> => {
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

    if (searchResponse.data.results && searchResponse.data.results.length > 0) {
      return searchResponse.data.results[0].id;
    }
    
    return null;
  } catch (error) {
    console.error('Error searching for contact:', error);
    throw error;
  }
};

/**
 * Create a new contact in HubSpot with basic properties only
 */
const createHubSpotContact = async (
  email: string,
  firstName?: string,
  lastName?: string
): Promise<string> => {
  try {
    // Only use standard HubSpot properties
    const contactProperties: any = {
      email, // Required field
    };

    // Add optional fields only if they have values
    if (firstName) contactProperties.firstname = firstName;
    if (lastName) contactProperties.lastname = lastName;

    console.log('Creating HubSpot contact with properties:', contactProperties);

    const createResponse = await hubspotClient.post('/crm/v3/objects/contacts', {
      properties: contactProperties,
    });

    console.log('✅ HubSpot contact created successfully:', createResponse.data.id);
    return createResponse.data.id;
  } catch (error:any) {
    console.error('Error creating HubSpot contact:', error);
    
    // Log the specific error details for debugging
    if (error?.response?.data) {
      console.error('HubSpot API Error Details:', error?.response.data);
    }
    
    throw error;
  }
};

/**
 * Update an existing contact in HubSpot
 */
const updateHubSpotContact = async (
  contactId: string,
  email: string,
  firstName?: string,
  lastName?: string
): Promise<void> => {
  try {
    const updateProperties: any = {
      email,
    };

    if (firstName) updateProperties.firstname = firstName;
    if (lastName) updateProperties.lastname = lastName;

    console.log('Updating HubSpot contact with properties:', updateProperties);

    await hubspotClient.patch(`/crm/v3/objects/contacts/${contactId}`, {
      properties: updateProperties,
    });

    console.log('✅ HubSpot contact updated successfully:', contactId);
  } catch (error) {
    console.error('Error updating HubSpot contact:', error);
    throw error;
  }
};

/**
 * Synchronize user with HubSpot when they sign up
 * Checks if contact exists by email, if not creates one
 * Updates user record with HubSpot contact ID
 */
export const syncUserWithHubSpot = async (
  userId: string,
  email: string,
  firstName?: string,
  lastName?: string,
  additionalProperties?: Record<string, string>
): Promise<{ contactId: string; isNewContact: boolean }> => {
  let syncLogId: string | null = null;
  
  try {
    // Create sync log entry
    syncLogId = uuidv4();
    await db.insert(hubspotSyncLogs).values({
      id: syncLogId,
      userId,
      action: 'user_signup_sync',
      status: 'started',
      details: { email, firstName, lastName },
      createdAt: new Date()
    });

    console.log(`🔄 Starting HubSpot sync for user ${userId} with email ${email}`);

    // Step 1: Search for existing contact by email
    const existingContactId = await searchContactByEmail(email);
    
    let contactId: string;
    let isNewContact: boolean;

    if (existingContactId) {
      // Contact exists - use existing contact ID
      contactId = existingContactId;
      isNewContact = false;
      
      console.log(`✅ Found existing HubSpot contact: ${contactId} for email: ${email}`);
      
      // Optionally update the existing contact with current name info
      try {
        await updateHubSpotContact(contactId, email, firstName, lastName);
        console.log('✅ Updated existing contact with current name information');
      } catch (updateError) {
        console.warn('⚠️ Could not update existing contact:', updateError);
        // Don't fail the sync if update fails
      }
      
      // Update sync log
      await db.update(hubspotSyncLogs)
        .set({
          status: 'existing_contact_found',
          details: { 
            email, 
            firstName, 
            lastName, 
            contactId, 
            isNewContact: false 
          }
        })
        .where(eq(hubspotSyncLogs.id, syncLogId));

    } else {
      // Contact doesn't exist - create new contact
      console.log(`📝 No existing contact found for ${email}, creating new contact`);
      
      contactId = await createHubSpotContact(email, firstName, lastName);
      isNewContact = true;
      
      console.log(`✅ Created new HubSpot contact: ${contactId} for email: ${email}`);
      
      // Update sync log
      await db.update(hubspotSyncLogs)
        .set({
          status: 'new_contact_created',
          details: { 
            email, 
            firstName, 
            lastName, 
            contactId, 
            isNewContact: true
          }
        })
        .where(eq(hubspotSyncLogs.id, syncLogId));
    }

    // Step 2: Update user record with HubSpot contact ID
    await db.update(users)
      .set({
        hubspotContactId: contactId,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));

    console.log(`✅ Updated user ${userId} with HubSpot contact ID: ${contactId}`);

    // Final sync log update
    await db.update(hubspotSyncLogs)
      .set({
        status: 'completed',
        details: { 
          email, 
          firstName, 
          lastName, 
          contactId, 
          isNewContact,
          userUpdated: true
        }
      })
      .where(eq(hubspotSyncLogs.id, syncLogId));

    return { contactId, isNewContact };

  } catch (error:any) {
    console.error('❌ Error syncing user with HubSpot:', error);
    
    // Update sync log with error
    if (syncLogId) {
      await db.update(hubspotSyncLogs)
        .set({
          status: 'failed',
          details: { 
            email, 
            firstName, 
            lastName, 
            error: error instanceof Error ? error.message : 'Unknown error',
            errorResponse: error?.response?.data
          }
        })
        .where(eq(hubspotSyncLogs.id, syncLogId));
    }
    
    throw error;
  }
};

/**
 * Get sync status for a user
 */
export const getUserSyncStatus = async (userId: string): Promise<{
  hasHubSpotContact: boolean;
  hubspotContactId: string | null;
  lastSyncLog?: any;
}> => {
  try {
    // Get user
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId)
    });

    if (!user) {
      throw new Error(`User not found: ${userId}`);
    }

    // Get last sync log
    const lastSyncLog = await db.query.hubspotSyncLogs.findFirst({
      where: eq(hubspotSyncLogs.userId, userId),
      orderBy: (logs, { desc }) => [desc(logs.createdAt)]
    });

    return {
      hasHubSpotContact: !!user.hubspotContactId,
      hubspotContactId: user.hubspotContactId,
      lastSyncLog
    };

  } catch (error) {
    console.error('Error getting sync status:', error);
    throw error;
  }
};

/**
 * Retry failed sync for a user
 */
export const retrySyncForUser = async (userId: string): Promise<{ contactId: string; isNewContact: boolean }> => {
  try {
    // Get user details
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId)
    });

    if (!user) {
      throw new Error(`User not found: ${userId}`);
    }

    console.log(`🔄 Retrying HubSpot sync for user ${userId}`);

    return await syncUserWithHubSpot(
      user.id,
      user.email,
      user.firstName || undefined,
      user.lastName || undefined
    );

  } catch (error) {
    console.error('Error retrying sync:', error);
    throw error;
  }
};

/**
 * Bulk sync existing users who don't have HubSpot contact IDs
 */
export const bulkSyncExistingUsers = async (limit: number = 50): Promise<{
  processed: number;
  synced: number;
  errors: number;
  results: Array<{ userId: string; email: string; status: string; contactId?: string; error?: string }>;
}> => {
  try {
    // Get users without HubSpot contact IDs
    const usersToSync = await db.query.users.findMany({
      where: eq(users.hubspotContactId, ""),
      limit
    });

    console.log(`Found ${usersToSync.length} users to sync with HubSpot`);

    const results: Array<{ userId: string; email: string; status: string; contactId?: string; error?: string }> = [];
    let synced = 0;
    let errors = 0;

    // Process users with delay to respect rate limits
    for (const user of usersToSync) {
      try {
        const result = await syncUserWithHubSpot(
          user.id,
          user.email,
          user.firstName || undefined,
          user.lastName || undefined
        );

        results.push({
          userId: user.id,
          email: user.email,
          status: 'success',
          contactId: result.contactId
        });

        synced++;
        console.log(`✅ Synced user ${user.id} (${user.email}) - Contact: ${result.contactId}`);

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        results.push({
          userId: user.id,
          email: user.email,
          status: 'error',
          error: errorMessage
        });

        errors++;
        console.error(`❌ Failed to sync user ${user.id} (${user.email}):`, errorMessage);
      }

      // Add delay between requests to respect HubSpot rate limits (100ms = 10 requests/second)
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return {
      processed: usersToSync.length,
      synced,
      errors,
      results
    };

  } catch (error) {
    console.error('Error in bulk sync:', error);
    throw error;
  }
};