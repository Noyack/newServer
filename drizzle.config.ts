import type { Config } from 'drizzle-kit';
import { config } from './src/config';

export default {
  schema: './src/db/schema/index.ts',
  out: './drizzle',
  dialect: 'mysql',
  dbCredentials: {
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "your_db_name",
    port: parseInt(process.env.DB_PORT || "3306"),
  },
} satisfies Config;