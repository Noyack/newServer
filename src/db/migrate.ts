import { migrate } from 'drizzle-orm/mysql2/migrator';
import { db } from './index';
import path from 'path';


// This script will run the migrations
async function runMigrations() {
  console.log('Running migrations...');
  
  try {
    await migrate(db, { 
      migrationsFolder: path.join(__dirname, '../../drizzle') 
    });
    console.log('Migrations completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigrations();
