import { Response } from 'express';
import { db } from '../db';
import { basicInfo } from '../db/schema';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { AuthenticatedRequest } from '../middleware/auth';
import { HttpStatusCode } from 'axios';
import { AppError } from '../middleware/errorHandler';

export const getBasicInfo = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.params.userId;
    
    const userBasicInfo = await db.select().from(basicInfo).where(eq(basicInfo.userId, userId));
    
    if (!userBasicInfo || userBasicInfo.length === 0) {
      res.status(404).json({ message: 'Basic information not found' });
      return;
    }
    
    res.status(200).json(userBasicInfo[0]);
  } catch (error) {
    console.error('Error fetching basic info:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const createBasicInfo = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.params.userId;
    const basicInfoData = req.body;
    
    // Generate a UUID if not provided
    const id = basicInfoData.id || uuidv4();
    
    await db.insert(basicInfo).values({
      id,
      userId,
      ...basicInfoData
    }).execute();
    
    res.status(201).json({ message: 'Basic information created successfully', id });
  } catch (error) {
    console.error('Error creating basic info:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
export const initiateBasicInfo = async (userId:string): Promise<HttpStatusCode> => {
  try {
    // Generate a UUID if not provided
    const id = uuidv4();
    
    await db.insert(basicInfo).values({
      id,
      userId,
    }).execute();
    
    return 201;
  } catch (error) {
    console.error('Error creating basic info:', error);
    throw new AppError('Could not initiate Basic info form', 400)
  }
};

export const updateBasicInfo = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id;
    const basicInfoData = req.body;
    
    await db.update(basicInfo)
      .set(basicInfoData)
      .where(eq(basicInfo.id, id))
      .execute();
    
    res.status(200).json({ message: 'Basic information updated successfully' });
  } catch (error) {
    console.error('Error updating basic info:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteBasicInfo = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id;
    
    await db.delete(basicInfo).where(eq(basicInfo.id, id)).execute();
    
    res.status(200).json({ message: 'Basic information deleted successfully' });
  } catch (error) {
    console.error('Error deleting basic info:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};