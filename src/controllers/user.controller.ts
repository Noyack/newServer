// src/controllers/user.controller.ts
import { Response } from 'express';
import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';
import { AuthenticatedRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

// Get user profile
export const getUserProfile = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    // req.userId is the internal user ID from our auth middleware
    // req.user contains the full user object
    if (!req.userId || !req.user) {
      throw new AppError('User not authenticated', 401);
    }
    
    // We already have the user from auth middleware, so just return it
    const user = req.user;
    
    // Don't return sensitive information
    const { createdAt, email, firstName, lastName, id, onboarding, plaidUserToken, hubspotContactId } = user;
    
    res.status(200).json({
      id,
      email,
      firstName,
      lastName,
      createdAt,
      onboarding: onboarding || false,
      plaidUserToken,
      hubspotContactId,
      hasHubSpotContact: !!hubspotContactId
    });
  } catch (error) {
    console.error('Error getting user profile:', error);
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
    if (!req.userId || !req.user) {
      throw new AppError('User not authenticated', 401);
    }
    
    const { firstName, lastName, age, investmentGoals, investmentAccreditation, riskTolerance, location, metadata } = req.body;
    
    
    // Build update object with only provided fields
    const updateData: any = {
      updatedAt: new Date()
    };
    
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (age !== undefined) updateData.age = age;
    if (investmentGoals !== undefined) updateData.investmentGoals = investmentGoals;
    if (investmentAccreditation !== undefined) updateData.investmentAccreditation = investmentAccreditation;
    if (riskTolerance !== undefined) updateData.riskTolerance = riskTolerance;
    if (location !== undefined) updateData.location = location;
    if (metadata !== undefined) updateData.metadata = metadata;
    
    // Update user using internal user ID
    await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, req.userId));
    
    // Get updated user data
    const updatedUser = await db.query.users.findFirst({
      where: eq(users.id, req.userId)
    });
    
    if (!updatedUser) {
      throw new AppError('User not found after update', 404);
    }
    
    res.status(200).json({
      message: 'Profile updated successfully',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        age: updatedUser.age,
        investmentGoals: updatedUser.investmentGoals,
        investmentAccreditation: updatedUser.investmentAccreditation,
        riskTolerance: updatedUser.riskTolerance,
        location: updatedUser.location,
        onboarding: updatedUser.onboarding,
        hubspotContactId: updatedUser.hubspotContactId
      }
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

// Complete user profile (onboarding)
export const completeUserProfile = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { userId } = req.params;
    const updateData = req.body;
    
    // Validate that the user can only update their own profile
    if (req.userId !== userId) {
      throw new AppError('Unauthorized to update this profile', 403);
    }
    
    
    // Mark onboarding as complete and update any provided data
    const finalUpdateData = {
      ...updateData,
      onboarding: false,
      updatedAt: new Date()
    };
    
    await db
      .update(users)
      .set(finalUpdateData)
      .where(eq(users.id, userId));
    
    // Get updated user data
    const updatedUser = await db.query.users.findFirst({
      where: eq(users.id, userId)
    });
    
    if (!updatedUser) {
      throw new AppError('User not found after onboarding completion', 404);
    }
    
    res.status(200).json({
      message: 'Onboarding completed successfully',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        age: updatedUser.age,
        investmentGoals: updatedUser.investmentGoals,
        investmentAccreditation: updatedUser.investmentAccreditation,
        riskTolerance: updatedUser.riskTolerance,
        location: updatedUser.location,
        onboarding: updatedUser.onboarding,
        hubspotContactId: updatedUser.hubspotContactId
      }
    });
  } catch (error) {
    console.error('Error completing user profile:', error);
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

// Get user by ID (admin function)
export const getUserById = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { userId } = req.params;
    
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId)
    });
    
    if (!user) {
      throw new AppError('User not found', 404);
    }
    
    // Don't return sensitive information
    const { createdAt, email, firstName, lastName, id, onboarding, hubspotContactId } = user;
    
    res.status(200).json({
      id,
      email,
      firstName,
      lastName,
      createdAt,
      onboarding,
      hubspotContactId,
      hasHubSpotContact: !!hubspotContactId
    });
  } catch (error) {
    console.error('Error getting user by ID:', error);
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};