import { Response } from 'express';
import { db } from '../db';
import { emergencySavingsAccounts } from '../db/schema';
import { eq } from 'drizzle-orm';
import { AuthenticatedRequest } from '../middleware/auth';

export const getEmergencySavingsAccounts = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const fundId = req.params.fundId;
    
    const accounts = await db.select().from(emergencySavingsAccounts).where(eq(emergencySavingsAccounts.fundId, fundId));
    
    res.status(200).json(accounts);
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
    }
    
    res.status(200).json(account[0]);
  } catch (error) {
    console.error('Error fetching emergency savings account:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const createEmergencySavingsAccount = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const fundId = req.params.fundId;
    const accountData = req.body;
    
    const newAccount = await db.insert(emergencySavingsAccounts).values({
      fundId,
      ...accountData
    }).execute();
    
    res.status(201).json({ message: 'Emergency savings account created successfully' });
  } catch (error) {
    console.error('Error creating emergency savings account:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateEmergencySavingsAccount = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id;
    const accountData = req.body;
    
    await db.update(emergencySavingsAccounts)
      .set(accountData)
      .where(eq(emergencySavingsAccounts.id, id))
      .execute();
    
    res.status(200).json({ message: 'Emergency savings account updated successfully' });
  } catch (error) {
    console.error('Error updating emergency savings account:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteEmergencySavingsAccount = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id;
    
    await db.delete(emergencySavingsAccounts).where(eq(emergencySavingsAccounts.id, id)).execute();
    
    res.status(200).json({ message: 'Emergency savings account deleted successfully' });
  } catch (error) {
    console.error('Error deleting emergency savings account:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};