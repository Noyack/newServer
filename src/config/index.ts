import dotenv from 'dotenv';
// Load environment variables from .env file
dotenv.config();

interface Config {
  nodeEnv: string;
  port: number;
  databaseUrl: string;
  jwtSecret: string;
  clerkSecretKey: string;
  clerkWebhookSecret: string; // Added this
  stripeSecretKey: string;
  hubspotApiKey: string;
  hubspotPortalId: string;
  redisUrl?: string;
  clerkApiKey: string;
}

export const config: Config = {
  nodeEnv: process.env.NODE_ENV || '',
  port: parseInt(process.env.PORT || '3000', 10),
  databaseUrl: process.env.DATABASE_URL || '',
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
  clerkSecretKey: process.env.CLERK_SECRET_KEY || '',
  clerkWebhookSecret: process.env.CLERK_WEBHOOK_SECRET || '', // Add this line
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
  hubspotApiKey: process.env.HUBSPOT_API_KEY || '',
  hubspotPortalId: process.env.HUBSPOT_PORTAL_ID || '',
  redisUrl: process.env.REDIS_URL,
  clerkApiKey: process.env.CLERK_API_KEY || '',
};

export const equityTrustConfig = {
  subscriptionKey: process.env.EQUITY_TRUST_SUBSCRIPTION_KEY || '',
  clientId: process.env.EQUITY_TRUST_CLIENT_ID || '',
  clientSecret: process.env.EQUITY_TRUST_CLIENT_SECRET || '',
  resource: process.env.EQUITY_TRUST_RESOURCE || '',
  baseUrl: process.env.NODE_ENV === 'production' 
    ? 'https://api.myequityconnect.com'
    : 'https://stageapi.myequityconnect.com',
};