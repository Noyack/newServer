import { Response } from 'express';
import { db } from '../db';
import { expenseItems, expenseCategories } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { AuthenticatedRequest } from '../middleware/auth';

export const getExpenseItems = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const categoryId = req.params.categoryId;
    
    const items = await db.select().from(expenseItems).where(eq(expenseItems.categoryId, categoryId));
    
    res.status(200).json(items);
  } catch (error) {
    console.error('Error fetching expense items:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getExpenseItemsByUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.params.userId;
    
    // First get all categories for this user
    const categories = await db.select().from(expenseCategories).where(eq(expenseCategories.userId, userId));
    
    if (!categories || categories.length === 0) {
      res.status(200).json([]);
      return
    }
    
    // Get all expense items for these categories
    const items = await db.select({
      id: expenseItems.id,
      categoryId: expenseItems.categoryId,
      subcategory: expenseItems.subcategory,
      description: expenseItems.description,
      amount: expenseItems.amount,
      frequency: expenseItems.frequency,
      isVariable: expenseItems.isVariable,
      variableMin: expenseItems.variableMin,
      variableMax: expenseItems.variableMax,
      isTaxDeductible: expenseItems.isTaxDeductible,
      priority: expenseItems.priority,
      notes: expenseItems.notes,
      createdAt: expenseItems.createdAt,
      updatedAt: expenseItems.updatedAt,
      // Join fields
      categoryName: expenseCategories.name
    }).from(expenseItems)
      .innerJoin(expenseCategories, eq(expenseItems.categoryId, expenseCategories.id))
      .where(eq(expenseCategories.userId, userId));
    
    res.status(200).json(items);
    return
  } catch (error) {
    console.error('Error fetching expense items by user:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};


export const getTotalExpenseItemsByUser = async (userId:string): Promise<any> => {
  try {
    // First get all categories for this user
    const categories = await db.select().from(expenseCategories).where(eq(expenseCategories.userId, userId));
    
    
    if (!categories || categories.length === 0) {
      return {status: 200, expenses: 0};
    }
    
    // Get all expense items for these categories
    const items = await db.select({
      amount: expenseItems.amount,
    }).from(expenseItems)
      .innerJoin(expenseCategories, eq(expenseItems.categoryId, expenseCategories.id))
      .where(eq(expenseCategories.userId, userId));
    const res = items.map(item => parseFloat(item.amount)).reduce((a, b) => a + b, 0)
    return {status: 200, expenses: res};
  } catch (error) {
    console.error('Error fetching expense items by user:', error);
    return {status: 500, expenses: null};
  }
};

export const getExpenseItem = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id;
    
    const item = await db.select().from(expenseItems).where(eq(expenseItems.id, id));
    
    if (!item || item.length === 0) {
      res.status(404).json({ message: 'Expense item not found' });
    }
    
    res.status(200).json(item[0]);
  } catch (error) {
    console.error('Error fetching expense item:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const createExpenseItem = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const categoryId = req.params.categoryId;
    const itemData = req.body;
    
    const newItem = await db.insert(expenseItems).values({
      categoryId,
      ...itemData
    }).execute();
    
    // Update category total if needed
    await updateCategoryTotal(categoryId);
    
    res.status(201).json({ message: 'Expense item created successfully', data: newItem });
  } catch (error) {
    console.error('Error creating expense item:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateExpenseItem = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id;
    const itemData = req.body;
    
    // Get current item to know its category
    const currentItem = await db.select().from(expenseItems).where(eq(expenseItems.id, id));
    
    if (!currentItem || currentItem.length === 0) {
      res.status(404).json({ message: 'Expense item not found' });
    }
    
    const categoryId = currentItem[0].categoryId;
    
    await db.update(expenseItems)
      .set(itemData)
      .where(eq(expenseItems.id, id))
      .execute();
    
    // Update category total
    await updateCategoryTotal(categoryId);
    
    res.status(200).json({ message: 'Expense item updated successfully' });
  } catch (error) {
    console.error('Error updating expense item:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteExpenseItem = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id;
    
    // Get current item to know its category
    const currentItem = await db.select().from(expenseItems).where(eq(expenseItems.id, id));
    
    if (!currentItem || currentItem.length === 0) {
      res.status(404).json({ message: 'Expense item not found' });
    }
    
    const categoryId = currentItem[0].categoryId;
    
    await db.delete(expenseItems).where(eq(expenseItems.id, id)).execute();
    
    // Update category total
    await updateCategoryTotal(categoryId);
    
    res.status(200).json({ message: 'Expense item deleted successfully' });
  } catch (error) {
    console.error('Error deleting expense item:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Helper function to update category total
async function updateCategoryTotal(categoryId: string) {
  try {
    // Get all items for this category
    const items = await db.select().from(expenseItems).where(eq(expenseItems.categoryId, categoryId));
    
    // Calculate monthly totals (normalize to monthly amount based on frequency)
    let totalMonthly = 0;
    
    for (const item of items) {
      let monthlyAmount = 0;
      
      switch (item.frequency) {
        case 'daily':
          monthlyAmount = Number(item.amount) * 30;
          break;
        case 'weekly':
          monthlyAmount = Number(item.amount) * 4.33;
          break;
        case 'biweekly':
          monthlyAmount = Number(item.amount) * 2.17;
          break;
        case 'monthly':
          monthlyAmount = Number(item.amount);
          break;
        case 'quarterly':
          monthlyAmount = Number(item.amount) / 3;
          break;
        case 'annual':
          monthlyAmount = Number(item.amount) / 12;
          break;
        case 'one_time':
          // Skip one-time expenses for recurring monthly total
          monthlyAmount = 0;
          break;
      }
      
      totalMonthly += monthlyAmount;
    }
    
    // Update the category total
    await db.update(expenseCategories)
    .set({ totalMonthly: totalMonthly.toString() })
    .where(eq(expenseCategories.id, categoryId))
    .execute();
    
  } catch (error) {
    console.error('Error updating category total:', error);
    throw error;
  }
}