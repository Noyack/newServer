// In your db/index.ts file
import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { config } from '../config';
import * as schema from './schema';  // Import your schema

// Create MySQL connection pool
const pool = mysql.createPool({
  uri: config.databaseUrl,
});

// Create Drizzle ORM instance with complete config
export const db = drizzle(pool, { 
  schema,
  mode: 'default'  // Add the required mode property
});