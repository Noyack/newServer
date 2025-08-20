import { Response } from 'express';
import { db } from '../db';
import { emergencySavingsAccounts, emergencyFunds } from '../db/schema';
import { eq, sum } from 'drizzle-orm';
import { AuthenticatedRequest } from '../middleware/auth';

export const getEmergencySavingsAccounts = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const fundId = req.params.fundId;
    
    const accounts = await db.select().from(emergencySavingsAccounts).where(eq(emergencySavingsAccounts.fundId, fundId));
    
    // Convert decimal fields to strings for frontend compatibility
    const formattedAccounts = accounts.map(account => ({
      ...account,
      amount: account.amount?.toString() || '0',
      interestRate: account.interestRate?.toString() || '0'
    }));
    
    res.status(200).json(formattedAccounts);
  } catch (error) {
    console.error('Error fetching emergency savings accounts:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getEmergencySavingsAccount = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id;
    
    const account = await db.select().from(emergencySavingsAccounts).where(eq(emergencySavingsAccounts.id, id));
    
    if (!account || account.length === 0) {
      res.status(404).json({ message: 'Emergency savings account not found' });
      return;
    }
    
    // Convert decimal fields to strings for frontend compatibility
    const formattedAccount = {
      ...account[0],
      amount: account[0].amount?.toString() || '0',
      interestRate: account[0].interestRate?.toString() || '0'
    };
    
    res.status(200).json(formattedAccount);
  } catch (error) {
    console.error('Error fetching emergency savings account:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const createEmergencySavingsAccount = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const fundId = req.params.fundId;
    const accountData = req.body;
    
    // Ensure required fields and proper formatting
    const sanitizedData = {
      ...accountData,
      amount: accountData.amount?.toString() || '0',
      interestRate: accountData.interestRate?.toString() || '0',
      institution: accountData.institution || '',
      liquidityPeriod: accountData.liquidityPeriod || 'Same day'
    };
    
    const result = await db.insert(emergencySavingsAccounts).values({
      fundId,
      ...sanitizedData
    }).execute();
    
    // Recalculate total emergency savings for the fund
    const allAccounts = await db.select().from(emergencySavingsAccounts).where(eq(emergencySavingsAccounts.fundId, fundId));
    
    // Calculate new total
    const newTotal = allAccounts.reduce((total, account) => {
      return total + parseFloat(account.amount?.toString() || '0');
    }, 0);
    
    // Update the emergency fund with the new total
    await db.update(emergencyFunds)
      .set({
        totalEmergencySavings: newTotal.toString(),
        updatedAt: new Date()
      })
      .where(eq(emergencyFunds.id, fundId))
      .execute();
    
    res.status(201).json({ 
      message: 'Emergency savings account created successfully',
      newTotal: newTotal.toString()
    });
  } catch (error) {
    console.error('Error creating emergency savings account:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateEmergencySavingsAccount = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id;
    const accountData = req.body;
    
    // Check if account exists before updating
    const existingAccount = await db.select().from(emergencySavingsAccounts).where(eq(emergencySavingsAccounts.id, id));
    
    if (!existingAccount || existingAccount.length === 0) {
      res.status(404).json({ message: 'Emergency savings account not found' });
      return;
    }
    
    const fundId = existingAccount[0].fundId;
    
    // Remove fields that shouldn't be updated
    const { createdAt, updatedAt, id: bodyId, fundId: bodyFundId, ...updateData } = accountData;
    
    // Ensure proper data formatting
    const sanitizedUpdateData = {
      ...updateData,
      amount: updateData.amount?.toString() || existingAccount[0].amount?.toString() || '0',
      interestRate: updateData.interestRate?.toString() || existingAccount[0].interestRate?.toString() || '0',
      updatedAt: new Date()
    };
    
    await db.update(emergencySavingsAccounts)
      .set(sanitizedUpdateData)
      .where(eq(emergencySavingsAccounts.id, id))
      .execute();
    
    // Recalculate total emergency savings for the fund
    const allAccounts = await db.select().from(emergencySavingsAccounts).where(eq(emergencySavingsAccounts.fundId, fundId));
    
    // Calculate new total
    const newTotal = allAccounts.reduce((total, account) => {
      return total + parseFloat(account.amount?.toString() || '0');
    }, 0);
    
    // Update the emergency fund with the new total
    await db.update(emergencyFunds)
      .set({
        totalEmergencySavings: newTotal.toString(),
        updatedAt: new Date()
      })
      .where(eq(emergencyFunds.id, fundId))
      .execute();
    
    res.status(200).json({ 
      message: 'Emergency savings account updated successfully',
      id: id,
      newTotal: newTotal.toString()
    });
  } catch (error) {
    console.error('Error updating emergency savings account:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteEmergencySavingsAccount = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id;
    
    // Check if account exists before deleting and get the fundId
    const existingAccount = await db.select().from(emergencySavingsAccounts).where(eq(emergencySavingsAccounts.id, id));
    
    if (!existingAccount || existingAccount.length === 0) {
      res.status(404).json({ message: 'Emergency savings account not found' });
      return;
    }
    
    const fundId = existingAccount[0].fundId;
    
    // Delete the account
    await db.delete(emergencySavingsAccounts).where(eq(emergencySavingsAccounts.id, id)).execute();
    
    // Recalculate total emergency savings for the fund
    const remainingAccounts = await db.select().from(emergencySavingsAccounts).where(eq(emergencySavingsAccounts.fundId, fundId));
    
    // Calculate new total
    const newTotal = remainingAccounts.reduce((total, account) => {
      return total + parseFloat(account.amount?.toString() || '0');
    }, 0);
    
    // Update the emergency fund with the new total
    await db.update(emergencyFunds)
      .set({
        totalEmergencySavings: newTotal.toString(),
        updatedAt: new Date()
      })
      .where(eq(emergencyFunds.id, fundId))
      .execute();
    
    res.status(200).json({ 
      message: 'Emergency savings account deleted successfully',
      deletedId: id,
      newTotal: newTotal.toString()
    });
  } catch (error) {
    console.error('Error deleting emergency savings account:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};