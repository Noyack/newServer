import { Response } from 'express';
import { db } from '../db';
import { debts } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { AuthenticatedRequest } from '../middleware/auth';

export const getDebts = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.params.userId;
    const debtTypeParam = req.query.type as string | undefined;
    
    // Define valid debt types
    const validDebtTypes = ['mortgage', 'auto_loan', 'student_loan', 'credit_card', 'personal_loan', 'other'] as const;
    type DebtType = typeof validDebtTypes[number];
    
    let query = db.select().from(debts).where(eq(debts.userId, userId));
    
    if (debtTypeParam) {
      // Validate the debt type
      if (validDebtTypes.includes(debtTypeParam as any)) {
        const debtType = debtTypeParam as DebtType;
        query = db.select().from(debts).where(
          and(
            eq(debts.userId, userId),
            eq(debts.debtType, debtType)
          )
        );
      } else {
        res.status(400).json({ message: 'Invalid debt type' });
      }
    }
    
    const userDebts = await query;
    
    res.status(200).json(userDebts);
  } catch (error) {
    console.error('Error fetching debts:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getTotalDebts = async (userId:string): Promise<any> => {
  try {
    
    // Define valid debt types
    
    const query = await db.select().from(debts).where(eq(debts.userId, userId));
    
      // Validate the debt type 
    const res = query.map(item => parseFloat(item.currentBalance)).reduce((a, b) => a + b, 0)
      
    return {status:200, debt:res};
  } catch (error) {
    console.error('Error fetching debts:', error);
    return {status:500, debt: null};
  }
};


export const getDebt = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id;
    
    const debt = await db.select().from(debts).where(eq(debts.id, id));
    
    if (!debt || debt.length === 0) {
      res.status(404).json({ message: 'Debt not found' });
    }
    
    res.status(200).json(debt[0]);
  } catch (error) {
    console.error('Error fetching debt:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const createDebt = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.params.userId;
    const debtData = req.body;
    
    const newDebt = await db.insert(debts).values({
      userId,
      ...debtData
    }).execute();
    
    res.status(201).json({ message: 'Debt created successfully' });
  } catch (error) {
    console.error('Error creating debt:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateDebt = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id;
    const debtData = req.body;
    
    await db.update(debts)
      .set(debtData)
      .where(eq(debts.id, id))
      .execute();
    
    res.status(200).json({ message: 'Debt updated successfully' });
  } catch (error) {
    console.error('Error updating debt:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteDebt = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id;
    
    await db.delete(debts).where(eq(debts.id, id)).execute();
    
    res.status(200).json({ message: 'Debt deleted successfully' });
  } catch (error) {
    console.error('Error deleting debt:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};