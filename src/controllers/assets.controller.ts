import { Response } from 'express';
import { db } from '../db';
import { assets } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { AuthenticatedRequest } from '../middleware/auth';
import { v4 as uuidv4 } from 'uuid';

// Define valid asset types
const validAssetTypes = ['liquid', 'investment', 'retirement', 'real_estate', 'business', 'personal_property'] as const;
type AssetType = typeof validAssetTypes[number];

export const getAssets = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.params.userId;
      const assetTypeParam = req.query.type as string | undefined;
      
      let query = db.select().from(assets).where(eq(assets.userId, userId));
      
      if (assetTypeParam) {
        // Validate the asset type
        if (validAssetTypes.includes(assetTypeParam as any)) {
          const assetType = assetTypeParam as AssetType;
          query = db.select().from(assets).where(
            and(
              eq(assets.userId, userId),
              eq(assets.assetType, assetType)
            )
          );
        } else {
          res.status(400).json({ message: 'Invalid asset type' });
          return 
        }
      }
      
      const userAssets = await query;
      
      res.status(200).json(userAssets);
    } catch (error) {
      console.error('Error fetching assets:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  };

export const getAsset = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id;
    
    const asset = await db.select().from(assets).where(eq(assets.id, id));
    
    if (!asset || asset.length === 0) {
      res.status(404).json({ message: 'Asset not found' });
      return 
    }
    
    res.status(200).json(asset[0]);
  } catch (error) {
    console.error('Error fetching asset:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const createAsset = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.params.userId;
    const assetData = req.body;

    // Validate the asset type
    if (!assetData.assetType || !validAssetTypes.includes(assetData.assetType as any)) {
      res.status(400).json({ message: 'Invalid asset type' });
      return 
    }

    // Generate ID if not provided
    const assetId = assetData.id || uuidv4();

    // Validate required fields
    if (!assetData.name) {
      res.status(400).json({ message: 'Asset name is required' });
      return 
    }

    if (assetData.currentValue === undefined || assetData.currentValue === null) {
      res.status(400).json({ message: 'Current value is required' });
      return 
    }

    const newAsset = await db.insert(assets).values({
      id: assetId,
      userId,
      assetType: assetData.assetType,
      name: assetData.name,
      institution: assetData.institution || '',
      currentValue: assetData.currentValue
    });
    
    res.status(201).json({ message: 'Asset created successfully', id: assetId });
  } catch (error) {
    console.error('Error creating asset:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateAsset = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id;
    const assetData = req.body;
    
    // Check if asset exists
    const existingAsset = await db.select().from(assets).where(eq(assets.id, id));
    if (!existingAsset || existingAsset.length === 0) {
      res.status(404).json({ message: 'Asset not found' });
      return 
    }

    // Don't allow changing the asset type
    if (assetData.assetType && assetData.assetType !== existingAsset[0].assetType) {
      res.status(400).json({ message: 'Cannot change asset type' });
      return 
    }

    // Prepare the update data
    const updateData: Partial<typeof assets.$inferInsert> = {};
    
    if (assetData.name) updateData.name = assetData.name;
    if (assetData.institution !== undefined) updateData.institution = assetData.institution;
    if (assetData.currentValue !== undefined) updateData.currentValue = assetData.currentValue;
    
    await db.update(assets)
      .set(updateData)
      .where(eq(assets.id, id));
    
    res.status(200).json({ message: 'Asset updated successfully' });
  } catch (error) {
    console.error('Error updating asset:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteAsset = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id;
    
    // Check if asset exists
    const existingAsset = await db.select().from(assets).where(eq(assets.id, id));
    if (!existingAsset || existingAsset.length === 0) {
      res.status(404).json({ message: 'Asset not found' });
      return 
    }
    
    await db.delete(assets).where(eq(assets.id, id));
    
    res.status(200).json({ message: 'Asset deleted successfully' });
  } catch (error) {
    console.error('Error deleting asset:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};