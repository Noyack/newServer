// controllers/equityTrust.controller.ts - FIXED VERSION
import { Response } from 'express';
import { EquityTrustService, AccountOpenRequest, DirectTradeRequest } from '../services/equityTrust.service';
import { equityTrustConfig } from '../config';
import { AuthenticatedRequest } from '../middleware/auth';

const equityTrustService = new EquityTrustService(equityTrustConfig);

export const equityTrustController = {
  // Account opening endpoint - FIXED
  async openAccount(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { formData, apiVersion = '3' } = req.body;
      
      console.log('🔧 Received formData:', JSON.stringify(formData, null, 2));
      
      // Validate required fields
      if (!formData) {
        res.status(400).json({
          error: 'Missing form data'
        });
        return;
      }

      // Helper function to clean phone number (remove formatting)
      const cleanPhoneNumber = (phone: string): string => {
        return phone.replace(/\D/g, ''); // Remove all non-digits
      };

      // Helper function to clean SSN (remove dashes)
      const cleanSSN = (ssn: string): string => {
        return ssn.replace(/\D/g, ''); // Remove all non-digits
      };

      // Helper function to map fee payment method
      const mapFeePaymentMethod = (method: string): string => {
        const mapping: { [key: string]: string } = {
          'one_time': 'Deduct from Account',
          'monthly': 'Credit Card',
          'quarterly': 'Deduct from Account',
          'annual': 'Deduct from Account',
          'credit_card': 'Credit Card',
          'deduct_from_account': 'Deduct from Account'
        };
        return mapping[method] || 'Deduct from Account';
      };

      // Helper function to map funding method
      const mapFundingMethod = (method: string): string => {
        const mapping: { [key: string]: string } = {
          'ach_transfer': 'Transfer',
          'wire_transfer': 'Wire',
          'check': 'Check',
          'rollover': 'Rollover',
          'trustee_transfer': 'Transfer'
        };
        return mapping[method] || 'Transfer';
      };

      // Helper function to map account purpose
      const mapAccountPurpose = (purpose: string): string => {
        const mapping: { [key: string]: string } = {
          'retirement': 'Wealth Accumulation/Investment',
          'rollover': 'Wealth Accumulation/Investment',
          'transfer': 'Wealth Accumulation/Investment',
          'conversion': 'Wealth Accumulation/Investment'
        };
        return mapping[purpose] || 'Wealth Accumulation/Investment';
      };

      // Helper function to map employment status
      const mapEmploymentStatus = (status: string): string => {
        const mapping: { [key: string]: string } = {
          'employed': 'Employed',
          'self_employed': 'Self-Employed',
          'unemployed': 'Unemployed',
          'retired': 'Retired',
          'student': 'Student',
          'other': 'Other'
        };
        return mapping[status] || 'Employed';
      };

      // Transform frontend form data to EXACT Equity Trust format
      const accountOpenRequest: AccountOpenRequest = {
        requests: [{
          owner: {
            firstName: formData.firstName,
            lastName: formData.lastName,
            dateOfBirth: formData.dateOfBirth, // Keep as YYYY-MM-DD
            ssn: cleanSSN(formData.ssn), // Remove dashes: "123121234"
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
              ...(formData.mailingAddress && formData.mailingAddress !== formData.legalAddress ? [{
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
              phoneType: 'Cellular', // Use Cellular like in example
              phoneNumber: cleanPhoneNumber(formData.phoneNumber), // Remove formatting: "1233331234"
              primary: true,
            }],
            emailAddresses: [{
              email: formData.email,
            }],
          },
          // Map beneficiaries with CORRECT PascalCase (as in example)
          // beneficiaries: formData.beneficiaries?.map((ben: any) => ({
          //   FirstName: ben.firstName,        // ← PascalCase
          //   LastName: ben.lastName,          // ← PascalCase  
          //   Percentage: ben.percentage,      // ← PascalCase
          //   DateOfBirth: ben.dateOfBirth,    // ← PascalCase
          //   BeneficiaryType: ben.beneficiaryType, // ← PascalCase
          //   Spouse: ben.spouse || false,     // ← PascalCase
          // })) || [],
          accountType: formData.iraType === 'traditional' ? 'Traditional IRA' :
                      formData.iraType === 'roth' ? 'Roth IRA' :
                      formData.iraType === 'sep' ? 'SEP IRA' :
                      'SIMPLE IRA',
          // ADD MISSING REQUIRED FIELDS from example
          preciousMetals: {
            segregated: formData.investmentTypes?.Metals || false
          },
          goldLevelService: false, // Add this required field
          eSignature: false,       // Add this required field
          fees: {
            currentFeePaymentMethod: mapFeePaymentMethod(formData.paymentMethod),
            futureFeePaymentMethod: 'Deduct from Account',
          },
          funding: {
            fundingAmount: parseFloat(formData.estimatedFundingAmount) || 0,
            fundingMethod: mapFundingMethod(formData.fundingMethod),
            contributionYear: new Date().getFullYear(),
          },
          statementPreference: formData.statementPreference || 'Electronic',
          investmentTypes: {
            Alternative: formData.investmentTypes?.Alternative || false,
            Digital: formData.investmentTypes?.Digital || false,
            Metals: formData.investmentTypes?.Metals || false,
            Traditional: formData.investmentTypes?.Traditional || true,
          },
          // COMPLETE customerDueDiligence with ALL required fields
          customerDueDiligence: {
            accountPurpose: mapAccountPurpose(formData.accountPurpose),
            initialFundSource: {
              retirementFunds: formData.initialSourceOfFunds === 'rollover_401k',
              transfer: formData.initialSourceOfFunds === 'ira_transfer',
              rollover: formData.initialSourceOfFunds === 'rollover_401k',
              employmentWages: formData.initialSourceOfFunds === 'employment_income',
              investments: formData.initialSourceOfFunds === 'savings',
              inheritanceTrust: formData.initialSourceOfFunds === 'inheritance',
              other: !['rollover_401k', 'ira_transfer', 'employment_income', 'savings', 'inheritance'].includes(formData.initialSourceOfFunds),
            },
            initialFundSourceOtherDetails: formData.initialSourceOfFunds === 'gift' ? 'Gift' : 'Other details',
            ongoingFundSource: {
              retirementFunds: formData.ongoingSourceOfFunds === 'periodic_contributions',
              transfer: formData.ongoingSourceOfFunds === 'transfer',
              rollover: formData.ongoingSourceOfFunds === 'automatic_rollover',
              employmentWages: formData.ongoingSourceOfFunds === 'employment_income',
              investments: formData.ongoingSourceOfFunds === 'periodic_contributions',
              inheritanceTrust: false,
              other: formData.ongoingSourceOfFunds === 'none',
            },
            ongoingFundSourceOtherDetails: formData.ongoingSourceOfFunds === 'none' ? 'No ongoing contributions' : 'More details',
            // ADD MISSING ID FIELDS (required in v3)
            identificationType: 'US Drivers License',
            stateOfIssuance: formData.state,
            idNumber: '1234', // You'll need to collect this in frontend
            issueDate: '01/01/2020', // You'll need to collect this in frontend  
            expirationDate: '01/01/2030', // You'll need to collect this in frontend
            employmentStatus: mapEmploymentStatus(formData.employmentStatus),
            employerName: formData.employerName || 'Self-Employed',
            occupationCategory: formData.occupationCategory || 'Computer and Mathematical Occupations',
            occupation: formData.occupation || 'Software Developers',
            employerAddress: formData.employerAddress ? {
              addressLine1: formData.employerAddress,
              city: formData.city,
              state: formData.state,
              zipCode: formData.zipCode,
            } : {
              addressLine1: formData.legalAddress,
              city: formData.city,
              state: formData.state,
              zipCode: formData.zipCode,
            },
          },
        }],
      };

      console.log('📤 Sending to Equity Trust API:', JSON.stringify(accountOpenRequest, null, 2));

      const response = await equityTrustService.openAccount(accountOpenRequest, apiVersion);
      
      console.log('📥 Equity Trust API Response:', JSON.stringify(response, null, 2));

      res.json({
        success: true,
        data: response,
        accountNumber: response.response[0].accountNumber,
        activityId: response.response[0].activityId,
      });
    } catch (error) {
      console.error('❌ Account opening error:', error);
      res.status(500).json({
        error: 'Failed to open account',
        message: error instanceof Error ? error.message : 'Unknown error',
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

  // Get user accounts (unchanged)
  async getAccounts(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { accountNumber } = req.params
      const response = await equityTrustService.getAccounts(accountNumber);
      
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
};