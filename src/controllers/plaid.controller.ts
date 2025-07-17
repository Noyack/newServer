import { Configuration, PlaidApi, PlaidEnvironments, Products, CountryCode } from 'plaid';
import { Request, Response } from 'express';
import { db } from '../db';
import { users, plaidItems } from '../db/schema';
import { eq } from 'drizzle-orm';
import { AuthenticatedRequest } from '../middleware/auth';

const configuration = new Configuration({
  basePath: PlaidEnvironments.sandbox, // Change to development or production when ready
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': '67e8c47a05d1170022eda857',
      'PLAID-SECRET': '272e93c0e9f79dbe58d55ec73d3850',
    },
  },
});

const plaidClient = new PlaidApi(configuration);

// Add this to your Express server routes
export const createUserToken = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      res.status(400).json({ error: 'Missing required userId parameter' });
      return;
    }
    
    // Create a user token for this user
    const userTokenResponse = await plaidClient.userCreate({
      client_user_id: userId,
    });
    
    const userToken = userTokenResponse.data.user_token;
    
    // You may want to store this user_token in your database
    // associated with this user for future use
    await db.update(users)
      .set({ plaidUserToken: userToken })
      .where(eq(users.id, userId));
    
    res.json({ user_token: userToken });
  } catch (error: any) {
    console.error('Error creating user token:', error);
    res.status(500).json({ error });
  }
};

export const createLink = async(req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { userId, userToken } = req.body;
    
    // Check if userToken was provided
    if (!userToken) {
      res.status(400).json({ 
        error: 'user_token is required for income verification' 
      });
      return;
    }
    
    const request = {
      user: {
        client_user_id: userId,
      },
      client_name: 'Noyack',
      products: ['auth', 'transactions', 'identity', 'investments', 'liabilities'] as Products[],
      language: 'en',
      country_codes: ['US'] as CountryCode[],
      user_token: userToken, // Include the user token here
      // income_verification: {
      //   income_source_types: ['bank'],
      //   bank_income: {
      //     days_requested: 90,
      //   },
      // },
    };
    
    const response = await plaidClient.linkTokenCreate(request);
    res.json({ link_token: response.data.link_token });
  } catch (error: any) {
    console.error('Error creating link token:', error);
    res.status(500).json({ error });
  }
};

export const exchangeToken = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { publicToken, userId } = req.body;
    
    const response = await plaidClient.itemPublicTokenExchange({
      public_token: publicToken,
    });
    
    const accessToken = response.data.access_token;
    const itemId = response.data.item_id;
    
    // Store in your database using Drizzle
    await db.insert(plaidItems).values({
      userId,
      itemId,
      accessToken,
      // Add other fields as needed
    });
    
    res.json({ success: true });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error });
  }
};
  
export const account = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.query;
    
    // Get the Plaid access token for this user
    const plaidItem = await db.query.plaidItems.findFirst({
      where: eq(plaidItems.userId, userId as string),
    });
    
    if (!plaidItem) {
      res.status(404).json({ error: 'No linked accounts found' });
      return;
    }
    
    const response = await plaidClient.accountsGet({
      access_token: plaidItem.accessToken,
    });
    
    res.json(response.data);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error });
  }
};

export const getInfo = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { userId, startDate, endDate } = req.query;
    
    if (!userId || !startDate || !endDate) {
      res.status(400).json({ error: 'Missing required parameters' });
      return;
    }
    
    // Get the Plaid access token for this user
    const plaidItem = await db.query.plaidItems.findFirst({
      where: eq(plaidItems.userId, userId as string),
    });
    
    if (!plaidItem) {
      res.status(404).json({ error: 'No linked accounts found' });
      return;
    }
    
    const request = {
      access_token: plaidItem.accessToken,
      start_date: startDate as string,
      end_date: endDate as string,
    };
    
    // Note: For newer Plaid API versions, you'd use transactionsSync instead
    // This example uses the transactions/get endpoint
    const response = await plaidClient.transactionsGet(request);
    
    res.json({
      transactions: response.data.transactions,
      accounts: response.data.accounts,
      total_transactions: response.data.total_transactions,
    });
  } catch (error: any) {
    console.error('Error fetching transactions:', error);
    
    // Check for Plaid-specific errors
    if (error.response && error.response.data) {
      const plaidError = error.response.data;
      
      // Handle ITEM_LOGIN_REQUIRED error specifically
      if (plaidError.error_code === 'ITEM_LOGIN_REQUIRED') {
        res.status(401).json({
          error: 'Reconnection required',
          message: 'Your bank connection needs to be updated',
          error_code: plaidError.error_code,
        });
        return;
      }
    }
    
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
};

// Add this to your Express server
export const identify = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      res.status(400).json({ error: 'Missing required userId parameter' });
      return;
    }
    
    // Get the Plaid access token for this user
    const plaidItem = await db.query.plaidItems.findFirst({
      where: eq(plaidItems.userId, userId as string),
    });
    
    if (!plaidItem) {
      res.status(404).json({ error: 'No linked accounts found' });
      return;
    }
    
    // Call Plaid's identity endpoint
    const identityResponse = await plaidClient.identityGet({
      access_token: plaidItem.accessToken,
    });
    
    res.json(identityResponse.data);
  } catch (error: any) {
    console.error('Error fetching identity data:', error);
    
    // Handle Plaid-specific errors
    if (error.response && error.response.data) {
      const plaidError = error.response.data;
      
      // Handle case where identity data is not supported by this institution
      if (plaidError.error_code === 'PRODUCTS_NOT_SUPPORTED') {
        res.status(400).json({
          error: 'Identity information not supported',
          message: 'This financial institution does not support identity information retrieval'
        });
        return;
      }
      
      res.status(400).json({
        error: plaidError.error_code,
        message: plaidError.error_message
      });
      return;
    }
    
    res.status(500).json({ error: 'Failed to fetch identity information' });
  }
};


export const incomeCheck = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      res.status(400).json({ error: 'Missing required userId parameter' });
      return;
    }
    
    // Get the Plaid access token and user token for this user
    const plaidItem = await db.query.plaidItems.findFirst({
      where: eq(plaidItems.userId, userId as string),
    });
    
    if (!plaidItem) {
      res.status(404).json({ error: 'No linked accounts found' });
      return;
    }
    
    // Get the user token from your database
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId as string),
    });
    
    if (!user || !user.plaidUserToken) {
      res.status(404).json({ error: 'Plaid user token not found' });
      return;
    }
    
    // For bank income, use the user token (not the access token)
    const bankIncomeResponse = await plaidClient.creditBankIncomeGet({
      user_token: user.plaidUserToken,
      options: {
        count: 12, // Past 12 months of income
      }
    });
    
    // Note: For paystubs, you might need to first create an income verification
    // This generally requires a user to upload documents or connect to their payroll provider
    // Plaid's docs should be consulted for the exact flow needed

    // Simplified response with just bank income data
    res.json({
      bankIncome: bankIncomeResponse.data
    });
  } catch (error: any) {
    console.error('Error fetching income data:', error);
    
    // Handle Plaid-specific errors
    if (error.response && error.response.data) {
      const plaidError = error.response.data;
      
      // Handle case where income verification is not supported
      if (plaidError.error_code === 'PRODUCTS_NOT_SUPPORTED') {
        res.status(400).json({
          error: 'Income verification not supported',
          message: 'This financial institution does not support income verification'
        });
        return;
      }
      
      res.status(400).json({
        error: plaidError.error_code,
        message: plaidError.error_message
      });
      return;
    }
    
    res.status(500).json({ error: 'Failed to fetch income information' });
  }
};


// Get investment holdings
export const holdings = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.query;
    
    // Get the Plaid access token for this user
    const plaidItem = await db.query.plaidItems.findFirst({
      where: eq(plaidItems.userId, userId as string),
    });
    
    if (!plaidItem) {
      res.status(404).json({ error: 'No linked accounts found' });
      return;
    }
    
    const response = await plaidClient.investmentsHoldingsGet({
      access_token: plaidItem.accessToken,
    });
    
    res.json({
      accounts: response.data.accounts,
      holdings: response.data.holdings,
      securities: response.data.securities,
    });
  } catch (error: any) {
    console.error('Error fetching investment holdings:', error);
    res.status(500).json({ error: 'Failed to fetch investment holdings' });
  }
};

// Get investment transactions
export const transactions = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { userId, startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      res.status(400).json({ error: 'Missing date parameters' });
      return;
    }
    
    // Get the Plaid access token for this user
    const plaidItem = await db.query.plaidItems.findFirst({
      where: eq(plaidItems.userId, userId as string),
    });
    
    if (!plaidItem) {
      res.status(404).json({ error: 'No linked accounts found' });
      return;
    }
    
    const response = await plaidClient.investmentsTransactionsGet({
      access_token: plaidItem.accessToken,
      start_date: startDate as string,
      end_date: endDate as string,
    });
    res.json({
      accounts: response.data.accounts,
      investment_transactions: response.data.investment_transactions,
      securities: response.data.securities,
      total_investment_transactions: response.data.total_investment_transactions,
    });
  } catch (error: any) {
    console.error('Error fetching investment transactions:', error);
    res.status(500).json({ error: 'Failed to fetch investment transactions' });
  }
};

// Endpoint to get user's liabilities
export const liabilities = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      res.status(400).json({ error: 'Missing user ID' });
      return;
    }
    
    // Get the Plaid access token for this user
    const plaidItem = await db.query.plaidItems.findFirst({
      where: eq(plaidItems.userId, userId as string),
    });
    
    if (!plaidItem) {
      res.status(404).json({ error: 'No linked accounts found' });
      return;
    }
    
    // Request liabilities data
    const response = await plaidClient.liabilitiesGet({
      access_token: plaidItem.accessToken,
    });
    
    res.json({
      liabilities: response.data.liabilities,
      accounts: response.data.accounts,
      item: response.data.item,
    });
  } catch (error: any) {
    console.error('Error fetching liabilities:', error);
    
    // Handle common errors
    if (error.response && error.response.data) {
      const plaidError = error.response.data;
      
      if (plaidError.error_code === 'PRODUCT_NOT_READY') {
        res.status(400).json({
          error: 'Liabilities data not ready',
          message: 'Please try again in a few moments'
        });
        return;
      }
    }
    
    res.status(500).json({ error: 'Failed to fetch liabilities' });
  }
};