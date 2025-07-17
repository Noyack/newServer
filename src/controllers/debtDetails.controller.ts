import { Response } from 'express';
import { db } from '../db';
import { debtDetails } from '../db/schema';
import { eq } from 'drizzle-orm';
import { AuthenticatedRequest } from '../middleware/auth';

export const getDebtDetails = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const debtId = req.params.debtId;
    
    const details = await db.select().from(debtDetails).where(eq(debtDetails.debtId, debtId));
    
    // Convert to key-value object
    const detailsObject = details.reduce((acc, detail) => {
      // Try to parse JSON values
      let value = detail.detailValue;
      try {
        const parsed = JSON.parse(detail.detailValue || '');
        if (typeof parsed === 'object') {
          value = parsed;
        }
      } catch (e) {
        // Not JSON, use as is
      }
      
      return {
        ...acc,
        [detail.detailKey]: value
      };
    }, {});
    
    res.status(200).json(detailsObject);
  } catch (error) {
    console.error('Error fetching debt details:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const createDebtDetail = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const debtId = req.params.debtId;
    const { key, value } = req.body;
    
    if (!key || value === undefined) {
      res.status(400).json({ message: 'Key and value are required' });
    }
    
    // Convert object/array values to JSON strings
    const detailValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
    
    const newDetail = await db.insert(debtDetails).values({
      debtId,
      detailKey: key,
      detailValue
    }).execute();
    
    res.status(201).json({ message: 'Debt detail created successfully'});
  } catch (error) {
    console.error('Error creating debt detail:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateDebtDetail = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id;
    const { key, value } = req.body;
    
    // Convert object/array values to JSON strings
    const detailValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
    
    await db.update(debtDetails)
      .set({
        detailKey: key,
        detailValue
      })
      .where(eq(debtDetails.id, id))
      .execute();
    
    res.status(200).json({ message: 'Debt detail updated successfully' });
  } catch (error) {
    console.error('Error updating debt detail:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteDebtDetail = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id;
    
    await db.delete(debtDetails).where(eq(debtDetails.id, id)).execute();
    
    res.status(200).json({ message: 'Debt detail deleted successfully' });
  } catch (error) {
    console.error('Error deleting debt detail:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const bulkUpsertDebtDetails = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const debtId = req.params.debtId;
    const details = req.body;
    
    if (!details || typeof details !== 'object') {
      res.status(400).json({ message: 'Details must be an object with key-value pairs' });
    }
    
    // Delete existing details
    await db.delete(debtDetails).where(eq(debtDetails.debtId, debtId)).execute();
    
    // Insert new details
    const detailsArray = Object.entries(details).map(([key, value]) => ({
      debtId,
      detailKey: key,
      detailValue: typeof value === 'object' ? JSON.stringify(value) : String(value)
    }));
    
    if (detailsArray.length > 0) {
      await db.insert(debtDetails).values(detailsArray).execute();
    }
    
    res.status(200).json({ message: 'Debt details updated successfully' });
  } catch (error) {
    console.error('Error updating debt details:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};