import { Response } from 'express';
import { db } from '../db';
import { incomeSources } from '../db/schema';
import { eq } from 'drizzle-orm';
import { AuthenticatedRequest } from '../middleware/auth';

export const getIncomeSources = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.params.userId;
    
    const userIncomeSources = await db.select().from(incomeSources).where(eq(incomeSources.userId, userId));
    
    res.status(200).json(userIncomeSources);
  } catch (error) {
    console.error('Error fetching income sources:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getIncomeSource = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id;
    
    const incomeSource = await db.select().from(incomeSources).where(eq(incomeSources.id, id));
    
    if (!incomeSource || incomeSource.length === 0) {
      res.status(404).json({ message: 'Income source not found' });
    }
    
    res.status(200).json(incomeSource[0]);
  } catch (error) {
    console.error('Error fetching income source:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getTotalIncome = async (userId:string): Promise<any> => {
  try {
    
    const incomeSource = await db.select().from(incomeSources).where(eq(incomeSources.userId, userId));
    
    if (!incomeSource || incomeSource.length === 0) {
      return {status:404, income: null}
    }
    const res = incomeSource
    const test = res.map(item => parseFloat(item.amount)).reduce((a, b) => a + b, 0)
    return {status: 200, income: test};
  } catch (error) {
    console.error('Error fetching income source:', error);
    return {status: 500, income: 'Internal server error'};
  }
}

export const createIncomeSource = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.params.userId;
    const incomeSourceData = req.body;
    
    const newIncomeSource = await db.insert(incomeSources).values({
      userId,
      ...incomeSourceData
    }).execute();
    
    res.status(201).json({ message: 'Income source created successfully' });
  } catch (error) {
    console.error('Error creating income source:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateIncomeSource = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id;
    const incomeSourceData = req.body;
    
    await db.update(incomeSources)
      .set(incomeSourceData)
      .where(eq(incomeSources.id, id))
      .execute();
    
    res.status(200).json({ message: 'Income source updated successfully' });
  } catch (error) {
    console.error('Error updating income source:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteIncomeSource = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id;
    
    await db.delete(incomeSources).where(eq(incomeSources.id, id)).execute();
    
    res.status(200).json({ message: 'Income source deleted successfully' });
  } catch (error) {
    console.error('Error deleting income source:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};