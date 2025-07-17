import { Request, Response, NextFunction } from 'express';
import { Webhook } from 'svix';
import { buffer } from 'micro';
import { config } from '../config';
import { AppError } from './errorHandler';
import { clerkClient } from '@clerk/clerk-sdk-node';
import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';

// Extended Express Request with user information
export interface AuthenticatedRequest extends Request {
  userId?: string;
  user?: {
    clerkId: string;
    email: any;
  };
}

// Middleware to verify JWT from Clerk
export const requireAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get the token from the Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Unauthorized - No token provided' });
      return;
    }

    const token = authHeader.split(' ')[1];
    
    try {
      // Verify the token with Clerk
      const test = await clerkClient.verifyToken(token);
      const { sub, 'x-email': email } = await clerkClient.verifyToken(token);
      
      if (!sub) {
        res.status(401).json({ error: 'Invalid token' });
        return;
      }
      
      // Set the user ID on the request object
      req.userId = sub;
      req.user = {
        clerkId: sub,
        email: email// Ensure email is never undefined
      };
      
      next();
    } catch (error) {
      res.status(401).json({ error: 'Unauthorized - Invalid token' });
      return;
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
    return;
  }
};

// Make sure to export this function so it can be imported in your router
// Update your clerkWebhookHandler function
export const clerkWebhookHandler = async (
    req: Request, 
    res: Response, 
    next: NextFunction
  ): Promise<void> => {
    try {
      // Make sure we have the raw body
      const payload = req.body;
      if (!payload) {
        console.error('Missing payload');
        res.status(400).json({ error: 'Missing payload' });
        return;
      }
  
      // Check if headers are present
      if (!req.headers['svix-id'] || !req.headers['svix-timestamp'] || !req.headers['svix-signature']) {
        console.error('Missing Svix headers');
        res.status(400).json({ error: 'Missing headers' });
        return;
      }
  
      const headersSvix = {
        'svix-id': req.headers['svix-id'] as string,
        'svix-timestamp': req.headers['svix-timestamp'] as string,
        'svix-signature': req.headers['svix-signature'] as string
      };
      
    //   console.log('Headers:', headersSvix);
    //   console.log('Secret:', config.clerkWebhookSecret.substring(0, 5) + '...');
      
      try {
        // Create webhook instance
        const webhook = new Webhook(config.clerkWebhookSecret);
        
        // Verify the payload
        const event: any = webhook.verify(
          Buffer.isBuffer(payload) ? payload.toString('utf8') : JSON.stringify(payload),
          headersSvix
        );
        
        // console.log("Webhook verified successfully:", event.type);
        const { data } = event;
        
        // Handle different Clerk events
        switch (event.type) {
          case 'user.created':
            console.log("Processing user creation...");
            await createUser(data);
            break;
          case 'user.updated':
            await updateUser(data);
            break;
          case 'user.deleted':
            await deleteUser(data.id);
            break;
          default:
            console.log(`Unhandled webhook event: ${event.type}`);
        }
        
        res.status(200).json({ received: true });
      } catch (err) {
        console.error('Webhook verification error details:', err);
        res.status(400).json({ error: 'Webhook verification failed' });
      }
    } catch (error) {
      console.error('Error processing webhook:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

// Helper function to create a user in the database
async function createUser(userData: any) {
  try {
    // Check if user already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.clerkId, userData.id)
    });

    if (existingUser) {
    //   console.log(`User already exists with clerkId: ${userData.id}`);
      return;
    }

    // Get primary email
    const primaryEmail = userData.email_addresses.find((email: any) => email.id === userData.primary_email_address_id);
    
    if (!primaryEmail) {
      console.error('No primary email found for user:', userData.id);
      return;
    }

    // Insert new user
    await db.insert(users).values({
      clerkId: userData.id,
      email: primaryEmail.email_address,
      firstName: userData.first_name || null,
      lastName: userData.last_name || null,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // console.log(`User created with clerkId: ${userData.id}`);
  } catch (error) {
    console.error('Error creating user:', error);
  }
}

// Helper function to update a user in the database
async function updateUser(userData: any) {
  try {
    const primaryEmail = userData.email_addresses.find((email: any) => email.id === userData.primary_email_address_id);
    
    await db.update(users)
      .set({
        email: primaryEmail?.email_address,
        firstName: userData.first_name || null,
        lastName: userData.last_name || null,
        updatedAt: new Date()
      })
      .where(eq(users.clerkId, userData.id));
      
    // console.log(`User updated with clerkId: ${userData.id}`);
  } catch (error) {
    console.error('Error updating user:', error);
  }
}

// Helper function to delete a user from the database
async function deleteUser(clerkId: string) {
  try {
    await db.delete(users).where(eq(users.clerkId, clerkId));
    // console.log(`User deleted with clerkId: ${clerkId}`);
  } catch (error) {
    console.error('Error deleting user:', error);
  }
}