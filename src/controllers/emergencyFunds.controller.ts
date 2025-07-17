import { Response } from 'express';
import { db } from '../db';
import { emergencyFunds } from '../db/schema/';
import { eq } from 'drizzle-orm';
import { AuthenticatedRequest } from '../middleware/auth';

export const getEmergencyFund = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.params.userId;
    
    const userEmergencyFund = await db.select().from(emergencyFunds).where(eq(emergencyFunds.userId, userId));
    
    if (!userEmergencyFund || userEmergencyFund.length === 0) {
      res.status(404).json({ message: 'Emergency fund information not found' });
    }
    
    res.status(200).json(userEmergencyFund[0]);
  } catch (error) {
    console.error('Error fetching emergency fund:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const createEmergencyFund = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.params.userId;
    const emergencyFundData = req.body;
    
    const newEmergencyFund = await db.insert(emergencyFunds).values({
      userId,
      ...emergencyFundData
    }).execute();
    
    res.status(201).json({ message: 'Emergency fund created successfully' });
  } catch (error) {
    console.error('Error creating emergency fund:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateEmergencyFund = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id;
    const emergencyFundData = req.body;
    
    await db.update(emergencyFunds)
      .set(emergencyFundData)
      .where(eq(emergencyFunds.id, id))
      .execute();
    
    res.status(200).json({ message: 'Emergency fund updated successfully' });
  } catch (error) {
    console.error('Error updating emergency fund:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteEmergencyFund = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id;
    
    await db.delete(emergencyFunds).where(eq(emergencyFunds.id, id)).execute();
    
    res.status(200).json({ message: 'Emergency fund deleted successfully' });
  } catch (error) {
    console.error('Error deleting emergency fund:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};