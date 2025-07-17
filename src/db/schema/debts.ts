import { mysqlTable, varchar, timestamp, decimal, int, boolean, text, mysqlEnum, json } from 'drizzle-orm/mysql-core';
import { v4 as uuidv4 } from 'uuid';
import { users } from '.';

// Debts Table (polymorphic)
export const debts = mysqlTable('debts', {
  id: varchar('debt_id', { length: 36 }).primaryKey().$defaultFn(() => uuidv4()),
  userId: varchar('user_id', { length: 36 }).notNull().references(() => users.id),
  debtType: mysqlEnum('debt_type', [
    'mortgage', 
    'auto_loan', 
    'student_loan', 
    'credit_card', 
    'personal_loan', 
    'other'
  ]).notNull(),
  lender: varchar('lender', { length: 100 }).notNull(),
  accountLast4: varchar('account_last4', { length: 4 }),
  originalAmount: decimal('original_amount', { precision: 15, scale: 2 }),
  currentBalance: decimal('current_balance', { precision: 15, scale: 2 }).notNull(),
  interestRate: decimal('interest_rate', { precision: 5, scale: 3 }).notNull(),
  monthlyPayment: decimal('monthly_payment', { precision: 15, scale: 2 }).notNull(),
  remainingTerm: int('remaining_term'),
  originalTerm: int('original_term'),
  isJoint: boolean('is_joint').default(false),
  status: mysqlEnum('status', [
    'current', 
    'past_due', 
    'delinquent', 
    'in_collection', 
    'default', 
    'paid_off', 
    'in_grace_period'
  ]).notNull(),
  hasCollateral: boolean('has_collateral').default(false),
  collateralDescription: text('collateral_description'),
  hasCosigner: boolean('has_cosigner').default(false),
  cosignerName: varchar('cosigner_name', { length: 100 }),
  extra: json('extra_data'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull().onUpdateNow()
});

// Debt Details Table (for polymorphic debt attributes)
export const debtDetails = mysqlTable('debt_details', {
  id: varchar('detail_id', { length: 36 }).primaryKey().$defaultFn(() => uuidv4()),
  debtId: varchar('debt_id', { length: 36 }).notNull().references(() => debts.id, { onDelete: 'cascade' }),
  detailKey: varchar('detail_key', { length: 50 }).notNull(),
  detailValue: text('detail_value'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull().onUpdateNow()
});

// Debt Strategies Table
export const debtStrategies = mysqlTable('debt_strategies', {
  id: varchar('strategy_id', { length: 36 }).primaryKey().$defaultFn(() => uuidv4()),
  userId: varchar('user_id', { length: 36 }).notNull().references(() => users.id),
  currentStrategy: mysqlEnum('current_strategy', ['avalanche', 'snowball', 'highest_interest', 'custom', 'none']).notNull(),
  customStrategy: text('custom_strategy'),
  consolidationPlans: text('consolidation_plans'),
  priorityDebtId: varchar('priority_debt_id', { length: 36 }),
  bankruptcyHistory: boolean('bankruptcy_history').default(false),
  bankruptcyDetails: text('bankruptcy_details'),
  debtSettlementActivities: text('debt_settlement_activities'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull().onUpdateNow()
});