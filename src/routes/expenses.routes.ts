import express from 'express';
import * as expenseCategoriesController from '../controllers/expenseCategories.controller';
import * as expenseItemsController from '../controllers/expenseItems.controller';

const router = express.Router();

// Expense Categories Routes
router.get('/users/:userId/expense-categories', expenseCategoriesController.getExpenseCategories);
router.get('/expense-categories/:id', expenseCategoriesController.getExpenseCategory);
router.post('/users/:userId/expense-categories', expenseCategoriesController.createExpenseCategory);
router.patch('/expense-categories/:id', expenseCategoriesController.updateExpenseCategory);
router.delete('/expense-categories/:id', expenseCategoriesController.deleteExpenseCategory);

// Expense Items Routes
router.get('/expense-categories/:categoryId/items', expenseItemsController.getExpenseItems);
router.get('/users/:userId/expense-items', expenseItemsController.getExpenseItemsByUser);
router.get('/expense-items/:id', expenseItemsController.getExpenseItem);
router.post('/expense-categories/:categoryId/items', expenseItemsController.createExpenseItem);
router.patch('/expense-items/:id', expenseItemsController.updateExpenseItem);
router.delete('/expense-items/:id', expenseItemsController.deleteExpenseItem);

export default router;