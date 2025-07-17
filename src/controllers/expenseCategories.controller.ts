import { Response } from 'express';
import { db } from '../db';
import { expenseCategories } from '../db/schema';
import { eq } from 'drizzle-orm';
import { AuthenticatedRequest } from '../middleware/auth';
import { v4 as uuidv4 } from 'uuid';

export const getExpenseCategories = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.params.userId;
    
    const categories = await db.select().from(expenseCategories).where(eq(expenseCategories.userId, userId));
    
    res.status(200).json(categories);
  } catch (error) {
    console.error('Error fetching expense categories:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getExpenseCategory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id;
    
    const category = await db.select().from(expenseCategories).where(eq(expenseCategories.id, id));
    
    if (!category || category.length === 0) {
      res.status(404).json({ message: 'Expense category not found' });
    }
    
    res.status(200).json(category[0]);
  } catch (error) {
    console.error('Error fetching expense category:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const createExpenseCategory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.params.userId;
    const categoryData = req.body;
    const categoryId= uuidv4()
    
    const newCategory = await db.insert(expenseCategories).values({
      id:categoryId,
      userId,
      ...categoryData
    }).execute();
    
    res.status(201).json({ message: 'Expense category created successfully', data: {id:categoryId} });
  } catch (error) {
    console.error('Error creating expense category:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateExpenseCategory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id;
    const categoryData = req.body;
    
    await db.update(expenseCategories)
      .set(categoryData)
      .where(eq(expenseCategories.id, id))
      .execute();
    
    res.status(200).json({ message: 'Expense category updated successfully' });
  } catch (error) {
    console.error('Error updating expense category:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteExpenseCategory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id;
    
    await db.delete(expenseCategories).where(eq(expenseCategories.id, id)).execute();
    
    res.status(200).json({ message: 'Expense category deleted successfully' });
  } catch (error) {
    console.error('Error deleting expense category:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};