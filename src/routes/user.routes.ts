import { Response, Router } from 'express';
import { completeUserProfile, getUserProfile, updateUserProfile } from '../controllers/user.controller';
import { getTotalDebts } from '../controllers/debts.controller';
import { getTotalExpenseItemsByUser } from '../controllers/expenseItems.controller';
import { getTotalIncome } from '../controllers/incomeSources.controller';
import { AuthenticatedRequest } from '../middleware/auth';

const router = Router();

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