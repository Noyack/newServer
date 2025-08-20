import { int, json, mysqlTable, timestamp, varchar } from "drizzle-orm/mysql-core";
import { v4 as uuidv4 } from 'uuid';
import { users } from "./mainDetails";


export const wealthIq = mysqlTable('wealthIq', {
    id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => uuidv4()),
    userId: varchar('user_id', {length:255}).notNull().references(() => users.id),
    category: varchar('category', {length:100}),
    rawScore: int('rawScore'),
    iq: int('iq',),
    recommendations: json('recommendations'),
    quiz: json('quiz'),
    createdAt: timestamp('created_at').defaultNow(),
  });