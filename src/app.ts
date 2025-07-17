import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { errorHandler } from './middleware/errorHandler';

// Routes
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import featuresRoutes from './routes/index.routes';
import hubspotRoutes from './routes/hubspot.routes';
import plaidRoutes from './routes/plaid.routes';
import equityTrustRoutes from './routes/equityTrust.routes';
import { requireAuth } from './middleware/auth';
// import subscriptionRoutes from './routes/subscription.routes';

const app: Express = express();
const PORT = process.env.PORT

app.use(cors({
    origin: ['http://localhost:5173', 'https://noyack.netlify.app', 'https://911e-136-158-57-182.ngrok-free.app'],
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));

// Middleware
app.use(helmet());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);

app.use('/api/hubspot', requireAuth,hubspotRoutes);
app.use('/api/plaid', requireAuth, plaidRoutes);
app.use('/api/users', requireAuth, userRoutes);
app.use('/api/v1', requireAuth, featuresRoutes);
app.use('/api/equity-trust', requireAuth, equityTrustRoutes);
// app.use('/api/subscriptions', subscriptionRoutes);

// Error handling middleware
app.use(errorHandler);
// Start the server
    // Test HubSpot connection by fetching a random contact    
    // const fetch = async() =>{
        // const test = await getEvents()
        // try {
        //     console.log('Testing HubSpot CRM connection...');
        //     const randomContact = await getContactById("107594950981");
            
        //     if (randomContact) {
        //         console.log('✅ Successfully connected to HubSpot CRM');
        //         console.log('Random contact from HubSpot:');
        //         console.log(JSON.stringify(randomContact, null, 2));
        //         await getContactProperties();
        //     } else {
        //         console.log('⚠️ Connected to HubSpot but no contacts were found');
        //     }
        // } catch (error) {
        //     console.error('❌ Error connecting to HubSpot CRM:', error);
        // }
    // }
        // fetch()

;

export default app;