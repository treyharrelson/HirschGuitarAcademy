import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema/index';
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
	user: process.env.POSTGRES_USER,
	password: process.env.POSTGRES_PASSWORD,
	host: process.env.DB_HOST,
	port: Number(process.env.DB_PORT),
	database: process.env.POSTGRES_DB,
});

export const db = drizzle(pool, { schema });
export * as schema from './schema/index'