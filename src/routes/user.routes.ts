// Add this to your user.routes.ts for debugging

import { Response, Router } from 'express';
import { completeUserProfile, getUserProfile, updateUserProfile } from '../controllers/user.controller';
import { getTotalDebts } from '../controllers/debts.controller';
import { getTotalExpenseItemsByUser } from '../controllers/expenseItems.controller';
import { getTotalIncome } from '../controllers/incomeSources.controller';
import { AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// Add this debug route BEFORE your other routes
router.get('/debug', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  console.log('=== AUTH DEBUG INFO ===');
  console.log('req.userId:', req.userId);
  console.log('req.user:', req.user);
  console.log('Headers:', req.headers.authorization?.substring(0, 30) + '...');
  
  res.json({
    userId: req.userId,
    userObject: req.user ? {
      id: req.user.id,
      clerkId: req.user.clerkId,
      email: req.user.email,
      firstName: req.user.firstName,
      lastName: req.user.lastName
    } : null,
    hasToken: !!req.headers.authorization
  });
});

// Protected routes requiring authentication
router.get('/profile', getUserProfile);
router.patch('/profile', updateUserProfile);
router.get('/profile/wealth/:userId', async(req: AuthenticatedRequest, res: Response):Promise<any>=>{
    const userId = req.params.userId
    try{
        const debt = await getTotalDebts(userId)
        const expenses = await getTotalExpenseItemsByUser(userId)
        const income = await getTotalIncome(userId)
        
        res.status(200).json({debt:debt, expenses: expenses, income:income})
    }catch{
        res.status(500).json({message: "Server Error"})
    }
})
router.patch('/:userId/onboarding', completeUserProfile);

export default router;