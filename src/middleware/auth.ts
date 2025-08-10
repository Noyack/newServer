// src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import { Webhook } from 'svix';
import { config } from '../config';
import { AppError } from './errorHandler';
import { clerkClient } from '@clerk/clerk-sdk-node';
import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';

// Extended Express Request with user information
export interface AuthenticatedRequest extends Request {
  userId?: string;
  user?: any;
}

// Define the webhook event type
interface ClerkWebhookEvent {
  type: string;
  data: {
    id: string;
    email_addresses: Array<{
      id: string;
      email_address: string;
    }>;
    primary_email_address_id: string;
    first_name?: string;
    last_name?: string;
    [key: string]: any;
  };
}

// Simple middleware to verify JWT tokens and set user information
export const requireAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Unauthorized - No token provided' });
      return;
    }

    const token = authHeader.split(' ')[1];
    
    try {
      // Verify the token with Clerk using the simple method
      const sessionClaims = await clerkClient.verifyToken(token);
      const userId = sessionClaims.sub;
      
      if (!userId) {
        res.status(401).json({ error: 'Invalid token - no user ID' });
        return;
      }
      
      // Fetch user from database
      const user = await db.query.users.findFirst({
        where: eq(users.clerkId, userId)
      });

      if (!user) {
        res.status(404).json({ error: 'User not found in database' });
        return;
      }

      // Set user information in request
      req.userId = user.id; // Your internal user ID
      req.user = user;
      
      next();
    } catch (tokenError) {
      console.error('Token verification error:', tokenError);
      res.status(401).json({ error: 'Invalid or expired token' });
      return;
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Internal server error' });
    return;
  }
};

// Robust webhook handler for Clerk events
export const handleClerkWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    // Handle GET requests (for webhook URL verification)
    if (req.method === 'GET') {
      res.status(200).json({ message: 'Webhook endpoint is active' });
      return;
    }

    // Extract headers
    const svixId = req.headers['svix-id'] as string;
    const svixTimestamp = req.headers['svix-timestamp'] as string;
    const svixSignature = req.headers['svix-signature'] as string;


    // Check if we have the required headers
    if (!svixId || !svixTimestamp || !svixSignature) {
      console.error('Missing required Svix headers');
      
      // If this is a test webhook without proper headers, respond with success
      if (req.body && typeof req.body === 'object') {
        try {
          await processWebhookEvent(req.body);
          res.status(200).json({ received: true, note: 'Processed without signature verification' });
          return;
        } catch (error) {
          console.error('Error processing test webhook:', error);
        }
      }
      
      res.status(400).json({ 
        error: 'Missing required headers', 
        required: ['svix-id', 'svix-timestamp', 'svix-signature'],
        received: Object.keys(req.headers).filter(h => h.startsWith('svix'))
      });
      return;
    }

    // Check webhook secret
    if (!config.clerkWebhookSecret) {
      console.error('CLERK_WEBHOOK_SECRET not configured');
      res.status(500).json({ error: 'Webhook secret not configured' });
      return;
    }

    // Get payload
    const payload = req.body;

    if (!payload) {
      console.error('Empty payload received');
      res.status(400).json({ error: 'Empty payload' });
      return;
    }

    try {
      // Create webhook instance and verify
      const wh = new Webhook(config.clerkWebhookSecret);
      
      // Convert payload to string if it's an object
      const payloadString = typeof payload === 'string' 
        ? payload 
        : Buffer.isBuffer(payload) 
          ? payload.toString('utf8') 
          : JSON.stringify(payload);

      const event = wh.verify(payloadString, {
        'svix-id': svixId,
        'svix-timestamp': svixTimestamp,
        'svix-signature': svixSignature,
      }) as ClerkWebhookEvent;


      // Process the event
      await processWebhookEvent(event);
      
      res.status(200).json({ received: true });

    } catch (verifyError) {
      console.error('Webhook verification failed:', verifyError);
      
      // In development, you might want to process webhooks without verification
      if (config.nodeEnv === 'development') {
        try {
          const event = typeof payload === 'string' ? JSON.parse(payload) : payload;
          await processWebhookEvent(event);
          res.status(200).json({ received: true, note: 'Processed without verification (dev mode)' });
          return;
        } catch (devError) {
          console.error('Error processing dev webhook:', devError);
        }
      }
      
      res.status(400).json({ 
        error: 'Webhook verification failed',
        details: verifyError instanceof Error ? verifyError.message : 'Unknown verification error'
      });
    }

  } catch (error) {
    console.error('General webhook error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Process the webhook event
async function processWebhookEvent(event: any) {
  try {
    const { data } = event;
    
    // Handle different Clerk events
    switch (event.type) {
      case 'user.created':
        await createUser(data);
        break;
      case 'user.updated':
        await updateUser(data);
        break;
      case 'user.deleted':
        await deleteUser(data.id);
        break;
      default:
    }
  } catch (error) {
    console.error('Error processing webhook event:', error);
    throw error;
  }
}

// Helper function to create a user in the database with HubSpot sync
async function createUser(userData: ClerkWebhookEvent['data']) {
  try {
    // Check if user already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.clerkId, userData.id)
    });

    if (existingUser) {
      return;
    }

    // Get primary email
    const primaryEmail = userData.email_addresses?.find((email: any) => email.id === userData.primary_email_address_id);
    
    if (!primaryEmail) {
      console.error('No primary email found for user:', userData.id);
      return;
    }


    // Insert new user first
    await db.insert(users).values({
      clerkId: userData.id,
      email: primaryEmail.email_address,
      firstName: userData.first_name || null,
      lastName: userData.last_name || null,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Get the inserted user to get the internal user ID
    const newUser = await db.query.users.findFirst({
      where: eq(users.clerkId, userData.id)
    });

    if (!newUser) {
      throw new Error('Failed to retrieve newly created user');
    }


    // Sync with HubSpot asynchronously (don't block user creation if HubSpot fails)
    syncUserWithHubSpotAsync(
      newUser.id,
      primaryEmail.email_address,
      userData.first_name || undefined,
      userData.last_name || undefined
    );

  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}

// Async wrapper for HubSpot sync to prevent blocking user creation
async function syncUserWithHubSpotAsync(
  userId: string,
  email: string,
  firstName?: string,
  lastName?: string
) {
  try {
    // Import HubSpot services dynamically to avoid circular dependencies
    const { syncUserWithHubSpot } = await import('../services/hubspot/userSync');
    
    
    const result = await syncUserWithHubSpot(userId, email, firstName, lastName, {
      signup_source: 'clerk_webhook',
      sync_timestamp: new Date().toISOString()
    });


  } catch (error) {
    console.error(`❌ HubSpot sync failed for user ${userId}:`, error);
  }
}

// Helper function to update a user in the database
async function updateUser(userData: ClerkWebhookEvent['data']) {
  try {
    const primaryEmail = userData.email_addresses?.find((email: any) => email.id === userData.primary_email_address_id);
    
    await db.update(users)
      .set({
        email: primaryEmail?.email_address,
        firstName: userData.first_name || null,
        lastName: userData.last_name || null,
        updatedAt: new Date()
      })
      .where(eq(users.clerkId, userData.id));
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
}

// Helper function to delete a user from the database
async function deleteUser(clerkId: string) {
  try {

    // Delete user from database
    await db.delete(users).where(eq(users.clerkId, clerkId));
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
}