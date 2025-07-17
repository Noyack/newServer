import { sql } from 'drizzle-orm';
import { mysqlTable, varchar, timestamp, boolean, json, int, mysqlEnum } from 'drizzle-orm/mysql-core';
import { v4 as uuidv4 } from 'uuid';

// Users table
export const users = mysqlTable('users', {
    id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => uuidv4()), // Use UUID as string
    clerkId: varchar('clerk_id', { length: 255 }).notNull().unique(),
    email: varchar('email', { length: 255 }).notNull(),
    firstName: varchar('first_name', { length: 255 }),
    lastName: varchar('last_name', { length: 255 }),
    age: int('age'),
    investmentGoals: json('investment_goals'),
    investmentAccreditation: boolean('investment_accreditation'),
    riskTolerance: mysqlEnum('risk_tolerance', ['moderate', 'conservative', 'aggressive']),
    location: json('location'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull().onUpdateNow(),
    hubspotContactId: varchar('hubspot_contact_id', { length: 255 }),
    plaidUserToken: varchar('plaidUserToken', {length: 255}),
    onboarding: boolean('onboarding').notNull().default(true),
    metadata: json('metadata')
});

// Subscriptions table
export const subscriptions = mysqlTable('subscriptions', {
  id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => uuidv4()),
  userId: varchar('user_id', { length: 36 }).notNull().references(() => users.id),
  stripeCustomerId: varchar('stripe_customer_id', { length: 255 }),
  stripeSubscriptionId: varchar('stripe_subscription_id', { length: 255 }),
  status: boolean('status').notNull().default(true),
  plan: mysqlEnum('plan', ['free', 'community', 'investor']).notNull().default('free'),
  currentPeriodStart: timestamp('current_period_start').defaultNow().notNull(),
  currentPeriodEnd: timestamp('current_period_end').$defaultFn(() => 
    sql`DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 1 YEAR)`
  ),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull().onUpdateNow(),
  cancelAtPeriodEnd: boolean('cancel_at_period_end').default(false)
});

// HubSpot sync logs
export const hubspotSyncLogs = mysqlTable('hubspot_sync_logs', {
  id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => uuidv4()), // Use UUID as string
  userId: varchar('user_id', { length: 36 }).notNull().references(() => users.id),
  action: varchar('action', { length: 50 }).notNull(),
  status: varchar('status', { length: 50 }).notNull(),
  details: json('details'),
  createdAt: timestamp('created_at').defaultNow().notNull()
});
