import { Router } from 'express';
import { completeUserProfile, getUserProfile, updateUserProfile } from '../controllers/user.controller';
import { getSubscriptions } from '../controllers/subscriptions.controller';
import * as SubController from '../controllers/subscriptions.controller'

const router = Router();

// Protected routes requiring authentication
router.get('/subscription/:userId', SubController.getSubscriptions);

export default router;