import { Response } from 'express';
import { db } from '../db';
import { assetDetails } from '../db/schema';
import { eq } from 'drizzle-orm';
import { AuthenticatedRequest } from '../middleware/auth';

export const getAssetDetails = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const assetId = req.params.assetId;
    
    const details = await db.select().from(assetDetails).where(eq(assetDetails.assetId, assetId));
    
    // Return the details as an array
    res.status(200).json(details);
  } catch (error) {
    console.error('Error fetching asset details:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getAllUserAssetDetails = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.params.userId;
    
    // We need to join with the assets table to filter by userId
    const details = await db.execute(`
      SELECT ad.* 
      FROM asset_details ad
      JOIN assets a ON ad.asset_id = a.asset_id
      WHERE a.user_id = ${userId}
    `);
    
    res.status(200).json(details);
  } catch (error) {
    console.error('Error fetching all user asset details:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const createAssetDetail = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const assetId = req.params.assetId;
    const { detailKey, detailValue } = req.body;
    
    if (!detailKey) {
      res.status(400).json({ message: 'Detail key is required' });
      return 
    }
    
    // Convert value to string if needed
    const valueToStore = typeof detailValue === 'object' 
      ? JSON.stringify(detailValue) 
      : detailValue !== undefined ? String(detailValue) : '';
    
    await db.insert(assetDetails).values({
      assetId,
      detailKey,
      detailValue: valueToStore
    });
    
    res.status(201).json({ message: 'Asset detail created successfully' });
  } catch (error) {
    console.error('Error creating asset detail:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateAssetDetail = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id;
    const { detailKey, detailValue } = req.body;
    
    // Check if the detail exists
    const detail = await db.select().from(assetDetails).where(eq(assetDetails.id, id));
    
    if (!detail || detail.length === 0) {
      res.status(404).json({ message: 'Asset detail not found' });
      return 
    }
    
    // Convert value to string if needed
    const valueToStore = typeof detailValue === 'object' 
      ? JSON.stringify(detailValue) 
      : detailValue !== undefined ? String(detailValue) : '';
    
    const updateData: Partial<typeof assetDetails.$inferInsert> = {};
    
    if (detailKey) {
      updateData.detailKey = detailKey;
    }
    
    if (detailValue !== undefined) {
      updateData.detailValue = valueToStore;
    }
    
    await db.update(assetDetails)
      .set(updateData)
      .where(eq(assetDetails.id, id));
    
    res.status(200).json({ message: 'Asset detail updated successfully' });
  } catch (error) {
    console.error('Error updating asset detail:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteAssetDetail = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id;
    
    // Check if the detail exists
    const detail = await db.select().from(assetDetails).where(eq(assetDetails.id, id));
    
    if (!detail || detail.length === 0) {
      res.status(404).json({ message: 'Asset detail not found' });
      return 
    }
    
    await db.delete(assetDetails).where(eq(assetDetails.id, id));
    
    res.status(200).json({ message: 'Asset detail deleted successfully' });
  } catch (error) {
    console.error('Error deleting asset detail:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const bulkUpsertAssetDetails = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const assetId = req.params.assetId;
    const detailsArray = req.body;
    
    if (!Array.isArray(detailsArray)) {
      res.status(400).json({ message: 'Details must be an array of detail objects' });
      return 
    }
    
    // Delete existing details - but only proceed if there are new details to add
    if (detailsArray.length > 0) {
      await db.delete(assetDetails).where(eq(assetDetails.assetId, assetId));
      
      // Prepare details for insertion
      const detailsToInsert = detailsArray.map(detail => {
        const { detailKey, detailValue } = detail;
        
        // Convert value to string if needed
        const valueToStore = typeof detailValue === 'object' 
          ? JSON.stringify(detailValue) 
          : detailValue !== undefined ? String(detailValue) : '';
        
        return {
          assetId,
          detailKey,
          detailValue: valueToStore
        };
      });
      
      // Insert all details at once
      await db.insert(assetDetails).values(detailsToInsert);
    }
    
    res.status(200).json({ message: 'Asset details updated successfully' });
  } catch (error) {
    console.error('Error bulk updating asset details:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};