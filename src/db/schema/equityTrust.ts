import { boolean, int, mysqlTable, timestamp, varchar } from "drizzle-orm/mysql-core";
import { users } from "./mainDetails";
import { v4 as uuidv4 } from 'uuid';

export const equityAccounts = mysqlTable('equity_accounts', {
    id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => uuidv4()),
    userId: varchar('user_id', {length:255}).notNull().references(() => users.id),
    accountNumber: varchar('account_number', {length:255}).notNull(),
    activityId: varchar('activity_id', {length:255}).notNull(),
    verified: boolean('verified').default(false),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull().onUpdateNow(),
});