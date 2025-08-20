import { Response } from 'express';
import { db } from '../db';
import { emergencyFunds } from '../db/schema/';
import { eq } from 'drizzle-orm';
import { AuthenticatedRequest } from '../middleware/auth';

export const getEmergencyFund = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.params.userId;
    
    const userEmergencyFund = await db.select().from(emergencyFunds).where(eq(emergencyFunds.userId, userId));
    
    if (!userEmergencyFund || userEmergencyFund.length === 0) {
      res.status(404).json({ message: 'Emergency fund information not found' });
      return;
    }
    
    // Convert decimal fields to strings for frontend compatibility
    const fund = userEmergencyFund[0];
    const responseData = {
      ...fund,
      totalEmergencySavings: fund.totalEmergencySavings?.toString() || '0',
      monthlyEssentialExpenses: fund.monthlyEssentialExpenses?.toString() || '0',
      otherLiquidAssets: fund.otherLiquidAssets?.toString() || '0',
      monthlyContribution: fund.monthlyContribution?.toString() || '0'
    };
    
    res.status(200).json(responseData);
  } catch (error) {
    console.error('Error fetching emergency fund:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const createEmergencyFund = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.params.userId;
    const emergencyFundData = req.body;
    
    // Ensure numeric fields are properly formatted
    const sanitizedData = {
      ...emergencyFundData,
      totalEmergencySavings: emergencyFundData.totalEmergencySavings || '0',
      monthlyEssentialExpenses: emergencyFundData.monthlyEssentialExpenses || '0',
      otherLiquidAssets: emergencyFundData.otherLiquidAssets || '0',
      monthlyContribution: emergencyFundData.monthlyContribution || '0',
      targetCoverageMonths: emergencyFundData.targetCoverageMonths || 6,
      jobSecurityLevel: emergencyFundData.jobSecurityLevel || 3,
      dependentCount: emergencyFundData.dependentCount || 0
    };
    
    const result = await db.insert(emergencyFunds).values({
      userId,
      ...sanitizedData
    }).execute();
    
    // Get the created fund to return the ID
    const createdFund = await db.select().from(emergencyFunds).where(eq(emergencyFunds.userId, userId));
    
    res.status(201).json({ 
      message: 'Emergency fund created successfully',
      id: createdFund[0]?.id,
      fund_id: createdFund[0]?.id // Frontend expects fund_id
    });
  } catch (error) {
    console.error('Error creating emergency fund:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateEmergencyFund = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id;
    const emergencyFundData = req.body;
    
    // Check if fund exists before updating
    const existingFund = await db.select().from(emergencyFunds).where(eq(emergencyFunds.id, id));
    
    if (!existingFund || existingFund.length === 0) {
      res.status(404).json({ message: 'Emergency fund not found' });
      return;
    }
    
    // Remove fields that shouldn't be updated
    const { createdAt, updatedAt, id: bodyId, userId, ...updateData } = emergencyFundData;
    
    await db.update(emergencyFunds)
      .set({
        ...updateData,
        updatedAt: new Date()
      })
      .where(eq(emergencyFunds.id, id))
      .execute();
    
    res.status(200).json({ 
      message: 'Emergency fund updated successfully',
      id: id
    });
  } catch (error) {
    console.error('Error updating emergency fund:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteEmergencyFund = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id;
    
    // Check if fund exists before deleting
    const existingFund = await db.select().from(emergencyFunds).where(eq(emergencyFunds.id, id));
    
    if (!existingFund || existingFund.length === 0) {
      res.status(404).json({ message: 'Emergency fund not found' });
      return;
    }
    
    // Delete the fund (cascade delete should handle savings accounts)
    await db.delete(emergencyFunds).where(eq(emergencyFunds.id, id)).execute();
    
    res.status(200).json({ 
      message: 'Emergency fund deleted successfully',
      deletedId: id
    });
  } catch (error) {
    console.error('Error deleting emergency fund:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};