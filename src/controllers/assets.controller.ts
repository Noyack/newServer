// assets.controller.ts - Simplified controller
import { Response } from 'express';
import { db } from '../db';
import { assets, assetAllocations } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { AuthenticatedRequest } from '../middleware/auth';
import { v4 as uuidv4 } from 'uuid';

const validAssetTypes = ['liquid', 'investment', 'retirement', 'real_estate', 'business', 'personal_property'] as const;
type AssetType = typeof validAssetTypes[number];

// Get all user assets with their allocations
export const getUserAssets = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.params.userId;
    
    // Get all assets
    const userAssets = await db.select().from(assets).where(eq(assets.userId, userId));
    
    // Get allocations
    const allocations = await db.select().from(assetAllocations).where(eq(assetAllocations.userId, userId));
    
    // Format response to match frontend expectations
    const response = {
      assets: userAssets,
      allocations: allocations
    };
    
    res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching user assets:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getAsset = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id;
    
    const asset = await db.select().from(assets).where(eq(assets.id, id));
    
    if (!asset || asset.length === 0) {
      res.status(404).json({ message: 'Asset not found' });
      return;
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

    // Validate asset type
    if (!assetData.assetType || !validAssetTypes.includes(assetData.assetType as any)) {
      res.status(400).json({ message: 'Invalid asset type' });
      return;
    }

    // Validate required fields
    if (!assetData.name || assetData.currentValue === undefined) {
      res.status(400).json({ message: 'Name and current value are required' });
      return;
    }

    const assetId = assetData.id || uuidv4();

    // Extract base fields and additional data
    const { id, name, institution, currentValue, assetType, notes, ...additionalData } = assetData;

    const newAsset = await db.insert(assets).values({
      id: assetId,
      userId,
      assetType,
      name,
      institution: institution || '',
      currentValue: String(currentValue),
      assetData: additionalData, // Store additional fields as JSON
      notes: notes || ''
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
      return;
    }

    // Extract base fields and additional data
    const { name, institution, currentValue, notes, ...additionalData } = assetData;
    
    const updateData: any = {};
    if (name) updateData.name = name;
    if (institution !== undefined) updateData.institution = institution;
    if (currentValue !== undefined) updateData.currentValue = String(currentValue);
    if (notes !== undefined) updateData.notes = notes;
    if (Object.keys(additionalData).length > 0) updateData.assetData = additionalData;
    
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
    
    const existingAsset = await db.select().from(assets).where(eq(assets.id, id));
    if (!existingAsset || existingAsset.length === 0) {
      res.status(404).json({ message: 'Asset not found' });
      return;
    }
    
    await db.delete(assets).where(eq(assets.id, id));
    
    res.status(200).json({ message: 'Asset deleted successfully' });
  } catch (error) {
    console.error('Error deleting asset:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Bulk save assets and allocations
export const saveAssetsAndAllocations = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.params.userId;
    const { assets: assetsData, currentAllocation, targetAllocation, liquidityNeeds } = req.body;

    // Start transaction (if your DB supports it)
    
    // Delete existing assets for this user
    await db.delete(assets).where(eq(assets.userId, userId));
    
    // Insert new assets
    if (assetsData && assetsData.length > 0) {
      const assetsToInsert = assetsData.map((asset: any) => {
        const { id, name, institution, currentValue, assetType, notes, ...additionalData } = asset;
        return {
          id: id || uuidv4(),
          userId,
          assetType,
          name,
          institution: institution || '',
          currentValue: String(currentValue),
          assetData: additionalData,
          notes: notes || ''
        };
      });
      
      await db.insert(assets).values(assetsToInsert);
    }

    // Handle allocations
    await db.delete(assetAllocations).where(eq(assetAllocations.userId, userId));
    
    const allocationsToInsert = [];
    
    if (currentAllocation) {
      allocationsToInsert.push({
        id: uuidv4(),
        userId,
        allocationType: 'current' as const,
        ...currentAllocation,
        liquidityNeeds: liquidityNeeds || 10
      });
    }
    
    if (targetAllocation) {
      allocationsToInsert.push({
        id: uuidv4(),
        userId,
        allocationType: 'target' as const,
        ...targetAllocation
      });
    }
    
    if (allocationsToInsert.length > 0) {
      await db.insert(assetAllocations).values(allocationsToInsert);
    }

    res.status(200).json({ message: 'Assets and allocations saved successfully' });
  } catch (error) {
    console.error('Error saving assets and allocations:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};