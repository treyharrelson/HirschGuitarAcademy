import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

dotenv.config()

export default defineConfig({
  out: './drizzle',
  schema: './src/db/schema/index.ts',
  dialect: 'postgresql',
  dbCredentials: {
    host: process.env.DB_HOST!,
    user: process.env.POSTGRES_USER!,
    password: process.env.POSTGRES_PASSWORD!,
    database: process.env.POSTGRES_DB!,
    port: Number(process.env.DB_PORT),
	ssl: false,
  },
});