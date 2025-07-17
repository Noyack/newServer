import { Response } from 'express';
import { db } from '../db';
import { debtStrategies } from '../db/schema';
import { eq } from 'drizzle-orm';
import { AuthenticatedRequest } from '../middleware/auth';

export const getDebtStrategy = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.params.userId;
    
    const strategy = await db.select().from(debtStrategies).where(eq(debtStrategies.userId, userId));
    
    if (!strategy || strategy.length === 0) {
      res.status(404).json({ message: 'Debt strategy not found' });
    }
    
    res.status(200).json(strategy[0]);
  } catch (error) {
    console.error('Error fetching debt strategy:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const createDebtStrategy = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.params.userId;
    const strategyData = req.body;
    
    // Check if a strategy already exists for this user
    const existingStrategy = await db.select().from(debtStrategies).where(eq(debtStrategies.userId, userId));
    
    if (existingStrategy.length > 0) {
      res.status(400).json({ 
        message: 'A debt strategy already exists for this user',
        existingId: existingStrategy[0].id
      });
    }
    
    const newStrategy = await db.insert(debtStrategies).values({
      userId,
      ...strategyData
    }).execute();
    
    res.status(201).json({ message: 'Debt strategy created successfully' });
  } catch (error) {
    console.error('Error creating debt strategy:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateDebtStrategy = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id;
    const strategyData = req.body;
    
    await db.update(debtStrategies)
      .set(strategyData)
      .where(eq(debtStrategies.id, id))
      .execute();
    
    res.status(200).json({ message: 'Debt strategy updated successfully' });
  } catch (error) {
    console.error('Error updating debt strategy:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteDebtStrategy = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id;
    
    await db.delete(debtStrategies).where(eq(debtStrategies.id, id)).execute();
    
    res.status(200).json({ message: 'Debt strategy deleted successfully' });
  } catch (error) {
    console.error('Error deleting debt strategy:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};