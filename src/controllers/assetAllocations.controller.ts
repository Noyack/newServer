import { Response } from 'express';
import { db } from '../db';
import { assetAllocations } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { AuthenticatedRequest } from '../middleware/auth';

// Type for allocation type to help with type safety
type AllocationType = 'current' | 'target';

export const getAssetAllocations = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.params.userId;
    const allocationType = req.query.type as string | undefined;
    
    let query = db.select().from(assetAllocations).where(eq(assetAllocations.userId, userId));
    
    if (allocationType) {
      // Validate allocation type
      const validTypes: AllocationType[] = ['current', 'target'];
      
      if (validTypes.includes(allocationType as AllocationType)) {
        query = db.select().from(assetAllocations).where(
          and(
            eq(assetAllocations.userId, userId),
            eq(assetAllocations.allocationType, allocationType as AllocationType)
          )
        );
      }
    }
    
    const allocations = await query;
    
    res.status(200).json(allocations);
  } catch (error) {
    console.error('Error fetching asset allocations:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getAssetAllocation = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id;
    
    const allocation = await db.select().from(assetAllocations).where(eq(assetAllocations.id, id));
    
    if (!allocation || allocation.length === 0) {
      res.status(404).json({ message: 'Asset allocation not found' });
      return 
    }
    
    res.status(200).json(allocation[0]);
  } catch (error) {
    console.error('Error fetching asset allocation:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const createAssetAllocation = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.params.userId;
    const allocationData = req.body;
    
    // Validate allocation type
    const allocationType = allocationData.allocationType as AllocationType;
    if (!allocationType || !['current', 'target'].includes(allocationType)) {
      res.status(400).json({ 
        message: "Invalid allocation type. Must be 'current' or 'target'"
      });
      return 
    }
    
    // Check if allocation type already exists for this user
    const existingAllocation = await db.select()
      .from(assetAllocations)
      .where(
        and(
          eq(assetAllocations.userId, userId),
          eq(assetAllocations.allocationType, allocationType)
        )
      );
    
    if (existingAllocation.length > 0) {
      res.status(400).json({ 
        message: `A ${allocationType} allocation already exists for this user`,
        existingId: existingAllocation[0].id
      });
      return 
    }
    
    // Generate a UUID if not provided
    const id = allocationData.id || uuidv4();
    
    await db.insert(assetAllocations).values({
      id,
      userId,
      ...allocationData
    });
    
    res.status(201).json({ message: 'Asset allocation created successfully', id });
  } catch (error) {
    console.error('Error creating asset allocation:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateAssetAllocation = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id;
    const allocationData = req.body;
    
    // Check if the allocation exists first
    const existingAllocation = await db.select().from(assetAllocations).where(eq(assetAllocations.id, id));
    
    if (!existingAllocation || existingAllocation.length === 0) {
      res.status(404).json({ message: 'Asset allocation not found' });
      return 
    }
    
    await db.update(assetAllocations)
      .set(allocationData)
      .where(eq(assetAllocations.id, id));
    
    res.status(200).json({ message: 'Asset allocation updated successfully' });
  } catch (error) {
    console.error('Error updating asset allocation:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteAssetAllocation = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id;
    
    // Check if the allocation exists first
    const existingAllocation = await db.select().from(assetAllocations).where(eq(assetAllocations.id, id));
    
    if (!existingAllocation || existingAllocation.length === 0) {
      res.status(404).json({ message: 'Asset allocation not found' });
      return 
    }
    
    await db.delete(assetAllocations).where(eq(assetAllocations.id, id));
    
    res.status(200).json({ message: 'Asset allocation deleted successfully' });
  } catch (error) {
    console.error('Error deleting asset allocation:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};