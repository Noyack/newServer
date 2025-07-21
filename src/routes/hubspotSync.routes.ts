// src/routes/hubspotSync.routes.ts
import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import {
  getCurrentUserSyncStatus,
  getUserSyncStatusById,
  syncCurrentUser,
  syncUserById,
  bulkSyncUsers,
  getSyncStatistics,
  getUsersNeedingSync,
  getUserSyncLogs,
  getCurrentUserSyncLogs
} from '../controllers/hubspotSync.controller';

const router = Router();

// All routes require authentication
router.use(requireAuth);

// ============================================================================
// USER SYNC ROUTES
// ============================================================================

// Get current user's sync status
router.get('/status', getCurrentUserSyncStatus);

// Get current user's sync logs
router.get('/logs', getCurrentUserSyncLogs);

// Manually sync current user with HubSpot
router.post('/sync', syncCurrentUser);

// ============================================================================
// ADMIN SYNC ROUTES (you might want to add admin middleware here)
// ============================================================================

// Get sync statistics (admin only)
router.get('/admin/statistics', getSyncStatistics);

// Get users that need syncing (admin only)
router.get('/admin/users-needing-sync', getUsersNeedingSync);

// Bulk sync users without HubSpot contact IDs (admin only)
router.post('/admin/bulk-sync', bulkSyncUsers);

// Get sync status for specific user (admin only)
router.get('/admin/users/:userId/status', getUserSyncStatusById);

// Get sync logs for specific user (admin only)
router.get('/admin/users/:userId/logs', getUserSyncLogs);

// Manually sync specific user with HubSpot (admin only)
router.post('/admin/users/:userId/sync', syncUserById);

export default router;