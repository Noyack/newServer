import { mysqlTable, varchar, timestamp, decimal, text, mysqlEnum } from 'drizzle-orm/mysql-core';
import { v4 as uuidv4 } from 'uuid';
import { users } from '.';

// Assets Table (polymorphic)
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
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull().onUpdateNow()
});

// Asset Details Table (for polymorphic asset attributes)
export const assetDetails = mysqlTable('asset_details', {
  id: varchar('detail_id', { length: 36 }).primaryKey().$defaultFn(() => uuidv4()),
  assetId: varchar('asset_id', { length: 36 }).notNull().references(() => assets.id, { onDelete: 'cascade' }),
  detailKey: varchar('detail_key', { length: 50 }).notNull(),
  detailValue: text('detail_value'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull().onUpdateNow()
});

// Asset Allocations Table
export const assetAllocations = mysqlTable('asset_allocations', {
  id: varchar('allocation_id', { length: 36 }).primaryKey().$defaultFn(() => uuidv4()),
  userId: varchar('user_id', { length: 36 }).notNull().references(() => users.id),
  allocationType: mysqlEnum('allocation_type', ['current', 'target']).notNull(),
  stocks: decimal('stocks', { precision: 5, scale: 2 }).notNull(),
  bonds: decimal('bonds', { precision: 5, scale: 2 }).notNull(),
  cash: decimal('cash', { precision: 5, scale: 2 }).notNull(),
  realEstate: decimal('real_estate', { precision: 5, scale: 2 }).notNull(),
  alternatives: decimal('alternatives', { precision: 5, scale: 2 }).notNull(),
  other: decimal('other', { precision: 5, scale: 2 }).notNull(),
  liquidityNeeds: decimal('liquidity_needs', { precision: 5, scale: 2 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull().onUpdateNow()
});