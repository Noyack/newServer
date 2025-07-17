import { Response } from 'express';
import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';
import { AuthenticatedRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { OnboardingCompleted } from './onboarding.controller';




// Get user profile
export const getUserProfile = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    if (!req.userId) {
      throw new AppError('User not authenticated', 401);
    }
    
    const user = await db.query.users.findFirst({
      where: eq(users.clerkId, req.userId)
    });
    
    if (!user) {
      throw new AppError('User not found', 404);
    }
    
    // Don't return sensitive information
    const { createdAt, email, firstName, lastName, id, onboarding, plaidUserToken } = user;
    
    res.status(200).json({
      id,
      email,
      firstName,
      lastName,
      createdAt,
      onboarding,
      plaidUserToken
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

// Update user profile
export const updateUserProfile = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    if (!req.userId) {
      throw new AppError('User not authenticated', 401);
    }
    
    const { firstName, lastName } = req.body;
    
    // Update user
    await db
      .update(users)
      .set({
        firstName,
        lastName,
        updatedAt: new Date()
      })
      .where(eq(users.clerkId, req.userId));
    
    res.status(200).json({
      message: 'Profile updated successfully',
      user: {
        firstName,
        lastName
      }
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

export const completeUserProfile = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    if (!req.userId) {
      throw new AppError('User not authenticated', 401);
    }
    
    const { age, investmentGoals, investmentAccreditation, riskTolerance, location } = req.body;
    
    // Update user
    await db
      .update(users)
      .set({
        onboarding: false,
        age,
        investmentGoals,
        investmentAccreditation,
        riskTolerance,
        location,
      })
      .where(eq(users.clerkId, req.userId));
      const user = await db.query.users.findFirst({
        where: eq(users.clerkId, req.userId)
      });
      res.status(200).json({
        message: 'Profile updated successfully',
      });
      if(user){
        OnboardingCompleted(user?.id)
      }
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};