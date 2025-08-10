// src/controllers/hubspotSync.controller.ts
import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { 
  syncUserWithHubSpot, 
  bulkSyncExistingUsers, 
  getUserSyncStatus, 
  retrySyncForUser 
} from '../services/hubspot/userSync';
import { db } from '../db';
import { users, hubspotSyncLogs } from '../db/schema';
import { eq, desc, and, isNull } from 'drizzle-orm';

/**
 * Get sync status for current user
 */
export const getCurrentUserSyncStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    const syncStatus = await getUserSyncStatus(req.userId);
    res.status(200).json(syncStatus);

  } catch (error) {
    console.error('Error getting user sync status:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Get sync status for specific user (admin only)
 */
export const getUserSyncStatusById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    if (!userId) {
      res.status(400).json({ message: 'User ID is required' });
      return;
    }

    const syncStatus = await getUserSyncStatus(userId);
    res.status(200).json(syncStatus);

  } catch (error) {
    console.error('Error getting user sync status:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Manually sync current user with HubSpot
 */
export const syncCurrentUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    const result = await retrySyncForUser(req.userId);
    
    res.status(200).json({
      success: true,
      contactId: result.contactId,
      isNewContact: result.isNewContact,
      message: result.isNewContact ? 'New contact created in HubSpot' : 'Existing contact found and linked'
    });

  } catch (error) {
    console.error('Error syncing current user:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to sync with HubSpot',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Manually sync specific user with HubSpot (admin only)
 */
export const syncUserById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    if (!userId) {
      res.status(400).json({ message: 'User ID is required' });
      return;
    }

    const result = await retrySyncForUser(userId);
    
    res.status(200).json({
      success: true,
      contactId: result.contactId,
      isNewContact: result.isNewContact,
      message: result.isNewContact ? 'New contact created in HubSpot' : 'Existing contact found and linked'
    });

  } catch (error) {
    console.error('Error syncing user:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to sync with HubSpot',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Bulk sync users without HubSpot contact IDs (admin only)
 */
export const bulkSyncUsers = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { limit = 50 } = req.query;
    
    const parsedLimit = parseInt(limit as string);
    if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
      res.status(400).json({ message: 'Limit must be between 1 and 100' });
      return;
    }

    
    const result = await bulkSyncExistingUsers(parsedLimit);
    
    res.status(200).json({
      success: true,
      summary: {
        processed: result.processed,
        synced: result.synced,
        errors: result.errors,
        successRate: result.processed > 0 ? (result.synced / result.processed * 100).toFixed(2) + '%' : '0%'
      },
      results: result.results
    });

  } catch (error) {
    console.error('Error in bulk sync:', error);
    res.status(500).json({ 
      success: false,
      message: 'Bulk sync failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get sync statistics (admin only)
 */
export const getSyncStatistics = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    // Get total users
    const allUsers = await db.query.users.findMany();
    const totalUsers = allUsers.length;
    
    // Get users with HubSpot contacts
    const usersWithContacts = allUsers.filter(user => user.hubspotContactId !== null).length;
    const usersWithoutContacts = totalUsers - usersWithContacts;
    
    // Get recent sync logs
    const recentSyncLogs = await db.query.hubspotSyncLogs.findMany({
      limit: 10,
      orderBy: [desc(hubspotSyncLogs.createdAt)]
    });

    // Get sync statistics by status - simplified approach
    const allSyncLogs = await db.query.hubspotSyncLogs.findMany();
    const syncStats = allSyncLogs.reduce((acc: Record<string, number>, log) => {
      acc[log.status] = (acc[log.status] || 0) + 1;
      return acc;
    }, {});

    res.status(200).json({
      userStats: {
        totalUsers,
        usersWithHubSpotContacts: usersWithContacts,
        usersWithoutHubSpotContacts: usersWithoutContacts,
        syncPercentage: totalUsers > 0 ? (usersWithContacts / totalUsers * 100).toFixed(2) + '%' : '0%'
      },
      syncStats,
      recentSyncLogs
    });

  } catch (error) {
    console.error('Error getting sync statistics:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Get users that need syncing (admin only)
 */
export const getUsersNeedingSync = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { limit = 20, offset = 0 } = req.query;
    
    const parsedLimit = parseInt(limit as string);
    const parsedOffset = parseInt(offset as string);
    
    const usersNeedingSync = await db.query.users.findMany({
      where: isNull(users.hubspotContactId),
      limit: parsedLimit,
      offset: parsedOffset,
      columns: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        createdAt: true,
        hubspotContactId: true
      }
    });

    // Get total count separately
    const allUsersNeedingSync = await db.query.users.findMany({
      where: isNull(users.hubspotContactId),
      columns: { id: true }
    });
    const totalCount = allUsersNeedingSync.length;

    res.status(200).json({
      users: usersNeedingSync,
      pagination: {
        total: totalCount,
        limit: parsedLimit,
        offset: parsedOffset,
        hasMore: parsedOffset + parsedLimit < totalCount
      }
    });

  } catch (error) {
    console.error('Error getting users needing sync:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Get sync logs for a user
 */
export const getUserSyncLogs = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const { limit = 10 } = req.query;

    if (!userId) {
      res.status(400).json({ message: 'User ID is required' });
      return;
    }

    const syncLogs = await db.query.hubspotSyncLogs.findMany({
      where: eq(hubspotSyncLogs.userId, userId),
      limit: parseInt(limit as string),
      orderBy: [desc(hubspotSyncLogs.createdAt)]
    });

    res.status(200).json({ syncLogs });

  } catch (error) {
    console.error('Error getting user sync logs:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Get current user's sync logs
 */
export const getCurrentUserSyncLogs = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    const { limit = 10 } = req.query;

    const syncLogs = await db.query.hubspotSyncLogs.findMany({
      where: eq(hubspotSyncLogs.userId, req.userId),
      limit: parseInt(limit as string),
      orderBy: [desc(hubspotSyncLogs.createdAt)]
    });

    res.status(200).json({ syncLogs });

  } catch (error) {
    console.error('Error getting current user sync logs:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};