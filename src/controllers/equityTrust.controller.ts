// controllers/equityTrust.controller.ts
import { Response } from 'express';
import { EquityTrustService, AccountOpenRequest, DirectTradeRequest } from '../services/equityTrust.service';
import { equityTrustConfig } from '../config';
import { AuthenticatedRequest } from '../middleware/auth';

const equityTrustService = new EquityTrustService(equityTrustConfig);

export const equityTrustController = {
  // Account opening endpoint
  async openAccount(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { formData, apiVersion = '3' } = req.body;
      
      // Validate required fields
      if (!formData) {
        res.status(400).json({
          error: 'Missing form data'
        });
        return;
      }

      // Transform frontend form data to Equity Trust format
      const accountOpenRequest: AccountOpenRequest = {
        requests: [{
          owner: {
            firstName: formData.firstName,
            lastName: formData.lastName,
            dateOfBirth: formData.dateOfBirth,
            ssn: formData.ssn,
            married: formData.married || false,
            minor: formData.minor || false,
            addresses: [
              {
                addressType: 'Legal',
                addressLine1: formData.legalAddress,
                addressLine2: formData.addressLine2 || '',
                city: formData.city,
                state: formData.state,
                zipCode: formData.zipCode,
                primary: true,
              },
              ...(formData.mailingAddress ? [{
                addressType: 'Mailing',
                addressLine1: formData.mailingAddress,
                addressLine2: formData.mailingAddressLine2 || '',
                city: formData.mailingCity,
                state: formData.mailingState,
                zipCode: formData.mailingZipCode,
                primary: false,
              }] : [])
            ],
            phones: [{
              phoneType: 'Home',
              phoneNumber: formData.phoneNumber,
              primary: true,
            }],
            emailAddresses: [{
              email: formData.email, // Use Clerk email if available
            }],
          },
          accountType: formData.iraType === 'traditional' ? 'Traditional IRA' :
                      formData.iraType === 'roth' ? 'Roth IRA' :
                      formData.iraType === 'sep' ? 'SEP IRA' :
                      'SIMPLE IRA',
          beneficiaries: formData.beneficiaries?.map((ben: any) => ({
            firstName: ben.firstName,
            lastName: ben.lastName,
            percentage: ben.percentage,
            dateOfBirth: ben.dateOfBirth,
            beneficiaryType: ben.beneficiaryType,
            spouse: ben.spouse || false,
          })) || [],
          fees: {
            currentFeePaymentMethod: formData.paymentMethod || 'Credit Card',
            futureFeePaymentMethod: 'Deduct from Account',
          },
          funding: {
            fundingAmount: parseFloat(formData.estimatedFundingAmount) || 0,
            fundingMethod: formData.fundingMethod || 'Transfer',
            contributionYear: new Date().getFullYear(),
          },
          statementPreference: formData.statementPreference || 'Electronic',
          investmentTypes: {
            Alternative: formData.investmentTypes?.Alternative || false,
            Digital: formData.investmentTypes?.Digital || false,
            Metals: formData.investmentTypes?.Metals || false,
            Traditional: formData.investmentTypes?.Traditional || true,
          },
          customerDueDiligence: apiVersion === '3' ? {
            accountPurpose: formData.accountPurpose || 'Retirement Savings',
            initialFundSource: {
              employmentWages: formData.initialSourceOfFunds === 'employment_income',
              transfer: formData.initialSourceOfFunds === 'ira_transfer',
              rollover: formData.initialSourceOfFunds === 'rollover_401k',
              investments: formData.initialSourceOfFunds === 'savings',
              inheritanceTrust: formData.initialSourceOfFunds === 'inheritance',
              other: !['employment_income', 'ira_transfer', 'rollover_401k', 'savings', 'inheritance'].includes(formData.initialSourceOfFunds),
            },
            ongoingFundSource: {
              employmentWages: formData.ongoingSourceOfFunds === 'employment_income',
              transfer: formData.ongoingSourceOfFunds === 'transfer',
              rollover: formData.ongoingSourceOfFunds === 'rollover',
              investments: formData.ongoingSourceOfFunds === 'investments',
              other: !['employment_income', 'transfer', 'rollover', 'investments'].includes(formData.ongoingSourceOfFunds),
            },
            employmentStatus: formData.employmentStatus || 'Employed',
            employerName: formData.employerName || '',
            occupationCategory: formData.occupationCategory || '',
            occupation: formData.occupation || '',
          } : undefined,
        }],
      };

      const response = await equityTrustService.openAccount(accountOpenRequest, apiVersion);
      
      // Save account info to your database here
      // await saveUserAccount(req.userId, response.response[0]);

      res.json({
        success: true,
        data: response,
        accountNumber: response.response[0].accountNumber,
        activityId: response.response[0].activityId,
      });
    } catch (error) {
      console.error('Account opening error:', error);
      console.log('Account opening error:', error);

      res.status(500).json({
        error: 'Failed to open account',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },

  // Investment submission endpoint
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
      
      // Save investment record to your database
      // await saveUserInvestment(req.userId, formData, response.response[0]);

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

  // Get account activities
  async getActivities(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { accountNumber, activityId, fromDate, toDate } = req.query;
      
      const response = await equityTrustService.getActivities({
        accountNumber: accountNumber as string,
        activityId: activityId as string,
        fromDate: fromDate as string,
        toDate: toDate as string,
      });

      res.json({
        success: true,
        data: response,
      });
    } catch (error) {
      console.error('Get activities error:', error);
      res.status(500).json({
        error: 'Failed to get activities',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },

  // Get user accounts
  async getAccounts(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Get user's account numbers from your database
      // const userAccountNumbers = await getUserAccountNumbers(req.userId);
      
      const response = await equityTrustService.getAccounts();
      
      res.json({
        success: true,
        data: response,
      });
    } catch (error) {
      console.error('Get accounts error:', error);
      res.status(500).json({
        error: 'Failed to get accounts',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },

  // Get account assets
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

  // Get account transactions
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
};