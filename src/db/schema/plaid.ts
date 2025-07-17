import { int, mysqlTable, timestamp, varchar } from "drizzle-orm/mysql-core";
import { users } from "./mainDetails";
import { v4 as uuidv4 } from 'uuid';

export const plaidItems = mysqlTable('plaid_items', {
    id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => uuidv4()),
    userId: varchar('user_id', {length:255}).notNull().references(() => users.id),
    itemId: varchar('item_id', {length:255}).notNull(),
    accessToken: varchar('access_token', {length:255}).notNull(),
    status: varchar('status', {length:255}).default('active'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull().onUpdateNow(),
  });

  // Add to your Drizzle schema
export const liabilities = mysqlTable('liabilities', {
  id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => uuidv4()),
  userId: varchar('user_id', {length:255}).notNull().references(() => users.id),
  accountId: varchar('account_id',{length:255}).notNull(),
  type: varchar('type',{length:255}).notNull(), // 'credit', 'student', 'mortgage'
  data: varchar('data', {length:5000}).notNull(), // JSON stringified liability data
  lastUpdated: timestamp('last_updated').defaultNow().notNull().onUpdateNow(),
});