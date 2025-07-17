import { mysqlTable, varchar, timestamp, decimal, boolean, text, mysqlEnum } from 'drizzle-orm/mysql-core';
import { v4 as uuidv4 } from 'uuid';
import { users } from '.';

// Expense Categories Table
export const expenseCategories = mysqlTable('expense_categories', {
  id: varchar('category_id', { length: 36 }).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull().references(() => users.id),
  name: varchar('name', { length: 50 }).notNull(),
  totalMonthly: decimal('total_monthly', { precision: 15, scale: 2 }).default('0'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull().onUpdateNow()
});

// Expense Items Table
export const expenseItems = mysqlTable('expense_items', {
  id: varchar('expense_id', { length: 36 }).primaryKey().$defaultFn(() => uuidv4()),
  categoryId: varchar('category_id', { length: 36 }).notNull().references(() => expenseCategories.id),
  subcategory: varchar('subcategory', { length: 50 }).notNull(),
  description: text('description'),
  amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
  frequency: mysqlEnum('frequency', [
    'daily', 
    'weekly', 
    'biweekly', 
    'monthly', 
    'quarterly', 
    'annual', 
    'one_time'
  ]).notNull(),
  isVariable: boolean('is_variable').default(false),
  variableMin: decimal('variable_min', { precision: 15, scale: 2 }),
  variableMax: decimal('variable_max', { precision: 15, scale: 2 }),
  isTaxDeductible: boolean('is_tax_deductible').default(false),
  priority: mysqlEnum('priority', ['essential', 'important', 'discretionary', 'luxury']).notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull().onUpdateNow()
});