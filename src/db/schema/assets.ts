5// assets.ts - Simplified database schema
import { mysqlTable, varchar, timestamp, decimal, text, mysqlEnum, json } from 'drizzle-orm/mysql-core';
import { v4 as uuidv4 } from 'uuid';
import { users } from '.';

// Simplified Assets Table - store all asset data as JSON
export const assets = mysqlTable('assets', {
  id: varchar('asset_id', { length: 36 }).primaryKey().$defaultFn(() => uuidv4()),
  userId: varchar('user_id', { length: 36 }).notNull().references(() => users.id),
  assetType: mysqlEnum('asset_type', [
    'liquid', 
    'investment', 
    'retirement', 
    'real_estate', 
    'business', 
    'personal_property'
  ]).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  institution: varchar('institution', { length: 100 }),
  currentValue: decimal('current_value', { precision: 15, scale: 2 }).notNull(),
  // Store all additional asset properties as JSON
  assetData: json('asset_data'), // This will store type-specific fields
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull().onUpdateNow()
});

// Asset Allocations Table - simplified
export const assetAllocations = mysqlTable('asset_allocations', {
  id: varchar('allocation_id', { length: 36 }).primaryKey().$defaultFn(() => uuidv4()),
  userId: varchar('user_id', { length: 36 }).notNull().references(() => users.id),
  allocationType: mysqlEnum('allocation_type', ['current', 'target']).notNull(),
  stocks: decimal('stocks', { precision: 5, scale: 2 }).notNull().default('0'),
  bonds: decimal('bonds', { precision: 5, scale: 2 }).notNull().default('0'),
  cash: decimal('cash', { precision: 5, scale: 2 }).notNull().default('0'),
  realEstate: decimal('real_estate', { precision: 5, scale: 2 }).notNull().default('0'),
  alternatives: decimal('alternatives', { precision: 5, scale: 2 }).notNull().default('0'),
  other: decimal('other', { precision: 5, scale: 2 }).notNull().default('0'),
  liquidityNeeds: decimal('liquidity_needs', { precision: 5, scale: 2 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull().onUpdateNow()
});