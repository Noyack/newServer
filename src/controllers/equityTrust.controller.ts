// controllers/equityTrust.controller.ts - FIXED VERSION
import { Response } from 'express';
import { EquityTrustService, AccountOpenRequest, DirectTradeRequest } from '../services/equityTrust.service';
import { equityTrustConfig } from '../config';
import { AuthenticatedRequest } from '../middleware/auth';
import { db } from '../db';
import { equityAccounts } from '../db/schema/equityTrust';
import { eq } from 'drizzle-orm';

const equityTrustService = new EquityTrustService(equityTrustConfig);

export const equityTrustController = {
  // Account opening endpoint - FIXED
  async openAccount(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { accountRequest, apiVersion = '3' } = req.body;
      
      if (!accountRequest) {
        res.status(400).json({ error: 'Missing account request data' });
        return;
      }

      console.log('🚀 Backend: Passing through perfectly formatted request to Equity Trust');

      const response = await equityTrustService.openAccount(accountRequest, apiVersion);
      
      console.log('✅ Backend: Received response from Equity Trust:', JSON.stringify(response, null, 2));
      if(req.userId){
      const enter = {
        userId: req.userId || "",
        accountNumber: response.response[0].accountNumber,
        activityId: response.response[0].activityId
      }
      await db.insert(equityAccounts).values({...enter}).execute()
    }
      res.json({
        success: true,
        data: response,
        accountNumber: response.response[0].accountNumber,
        activityId: response.response[0].activityId,
      });
    } catch (error:any) {
      console.error('❌ Account opening error:', error);
      
      // Enhanced error logging
      if (error.response?.data) {
        console.error('❌ Equity Trust API Error Response:', JSON.stringify(error.response.data, null, 2));
        
        if (error.response.data.errors && Array.isArray(error.response.data.errors)) {
          console.error('❌ Validation Errors:');
          error.response.data.errors.forEach((err: any, index: number) => {
            console.error(`   ${index + 1}. ${JSON.stringify(err, null, 2)}`);
          });
        }
      }
      
      res.status(500).json({
        error: 'Failed to open account',
        message: error instanceof Error ? error.message : 'Unknown error',
        apiErrors: error.response?.data?.errors || null,
        correlationId: error.response?.data?.correlationId || null,
      });
    }
  },

  // Investment submission endpoint (unchanged)
  async submitInvestment(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { formData } = req.body;
      
      if (!formData.accountNumber || !formData.investmentAmount) {
        res.status(400).json({
          error: 'Missing required investment data'
        });
        return;
      }

      const directTradeRequest: DirectTradeRequest = {
        requests: [{
          accountNumber: formData.accountNumber,
          transactionType: 'Purchase',
          investmentName: formData.investmentName || 'NOYACK Logistics Income REIT I',
          investmentAmount: parseFloat(formData.investmentAmount),
          investmentDescription: formData.investmentDescription || '',
          payeeDetails: formData.payeeDetails ? {
            name: formData.payeeDetails.name,
            address: formData.payeeDetails.address,
            city: formData.payeeDetails.city,
            state: formData.payeeDetails.state,
            zipCode: formData.payeeDetails.zipCode,
          } : undefined,
        }],
      };

      const response = await equityTrustService.submitDirectTrade(directTradeRequest);
      
      res.json({
        success: true,
        data: response,
        activityId: response.response[0].activityId,
      });
    } catch (error) {
      console.error('Investment submission error:', error);
      res.status(500).json({
        error: 'Failed to submit investment',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },

  // Get account activities (unchanged)
  async getActivities(req: AuthenticatedRequest, res: Response): Promise<void> {
    
    try {
      const id = req.userId
      if(id){
        const accounts = await db.select().from(equityAccounts).where(eq(equityAccounts.userId, id))
        let numbers = accounts.map((x, i) => x.accountNumber).join(',');
      const response = await equityTrustService.getActivities(numbers);

      res.json({
        success: true,
        data: response,
      });
    }
    } catch (error) {
      console.error('Get activities error:', error);
      res.status(500).json({
        error: 'Failed to get activities',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },

  // Get user accounts (unchanged)
  async getAccounts(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = req.userId
      if(id){
        const accounts = await db.select().from(equityAccounts).where(eq(equityAccounts.userId, id))
        let numbers = accounts.map((x, i) => x.accountNumber).join(',');
        const response = await equityTrustService.getAccounts(numbers);
        
        res.json({
          success: true,
          data: response,
        });
      }
      else{
        res.status(404).json({
        error: 'Failed to get accounts',
        message: 'No account found',
        
      });
      return
      }
    } catch (error) {
      console.error('Get accounts error:', error);
      res.status(404).json({
        error: 'Failed to get accounts',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },

  // Get account assets (unchanged)
  async getAssets(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { accountNumber } = req.params;
      
      if (!accountNumber) {
        res.status(400).json({
          error: 'Account number is required'
        });
        return;
      }

      const response = await equityTrustService.getAssets(accountNumber);
      
      res.json({
        success: true,
        data: response,
      });
    } catch (error) {
      console.error('Get assets error:', error);
      res.status(500).json({
        error: 'Failed to get assets',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },

  // Get account transactions (unchanged)
  async getTransactions(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { accountNumber } = req.params;
      const { fromDate, toDate } = req.query;
      
      if (!accountNumber) {
        res.status(400).json({
          error: 'Account number is required'
        });
        return;
      }

      const response = await equityTrustService.getTransactions(
        accountNumber,
        fromDate as string,
        toDate as string
      );
      
      res.json({
        success: true,
        data: response,
      });
    } catch (error) {
      console.error('Get transactions error:', error);
      res.status(500).json({
        error: 'Failed to get transactions',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },

  // Get available custodians
  async getCustodians(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      console.log('🏦 Backend: Fetching custodians from Equity Trust');

      const response = await equityTrustService.getCustodians();

      console.log('✅ Backend: Received custodians response:', JSON.stringify(response, null, 2));

      res.json({
        success: true,
        data: response,
      });
    } catch (error) {
      console.error('❌ Get custodians error:', error);
      res.status(500).json({
        error: 'Failed to get custodians',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },

  // Initialize transfer
  async initializeTransfer(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { requests, apiVersion = '2' } = req.body;

      if (!requests || !Array.isArray(requests) || requests.length === 0) {
        res.status(400).json({
          error: 'Missing or invalid transfer request data',
          message: 'requests array is required'
        });
        return;
      }

      console.log('🔄 Backend: Processing transfer request:', JSON.stringify({ requests }, null, 2));

      // Add user info if standalone transfer (no existing account)
      const userId = req.userId;
      if (userId && !requests[0].account?.accountNumber) {
        console.log('🔍 Backend: Adding user account info for standalone transfer');

        // Try to get user's existing Equity account
        const accounts = await db.select().from(equityAccounts).where(eq(equityAccounts.userId, userId));

        if (accounts.length > 0) {
          // Use existing account
          requests[0].account = {
            accountNumber: accounts[0].accountNumber,
            ownerContactId: userId // Use user ID as contact ID for now
          };
          console.log('✅ Backend: Using existing account:', accounts[0].accountNumber);
        } else {
          console.log('⚠️ Backend: No existing account found - will need owner information');
        }
      }

      const response = await equityTrustService.initializeTransfer({ requests }, apiVersion);

      console.log('✅ Backend: Received transfer response:', JSON.stringify(response, null, 2));

      // Store transfer activity in database
      if (userId && response.response?.[0]) {
        const transferResult = response.response[0];

        // If this created a new account, store it
        if (transferResult.accountNumber) {
          try {
            await db.insert(equityAccounts).values({
              userId: userId,
              accountNumber: transferResult.accountNumber,
              activityId: transferResult.activityId
            }).execute();
            console.log('✅ Backend: Stored new account from transfer:', transferResult.accountNumber);
          } catch (dbError) {
            console.log('ℹ️ Backend: Account may already exist in database');
          }
        }
      }

      res.json({
        success: true,
        data: response,
        accountNumber: response.response?.[0]?.accountNumber,
        activityId: response.response?.[0]?.activityId,
      });
    } catch (error: any) {
      console.error('❌ Transfer initialization error:', error);

      // Enhanced error logging for transfers
      if (error.response?.data) {
        console.error('❌ Equity Trust Transfer API Error:', JSON.stringify(error.response.data, null, 2));

        if (error.response.data.errors && Array.isArray(error.response.data.errors)) {
          console.error('❌ Transfer Validation Errors:');
          error.response.data.errors.forEach((err: any, index: number) => {
            console.error(`   ${index + 1}. ${JSON.stringify(err, null, 2)}`);
          });
        }
      }

      res.status(500).json({
        error: 'Failed to initialize transfer',
        message: error instanceof Error ? error.message : 'Unknown error',
        apiErrors: error.response?.data?.errors || null,
        correlationId: error.response?.data?.correlationId || null,
      });
    }
  },
};