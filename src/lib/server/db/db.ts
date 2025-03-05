import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';

const sqlite = new Database('./drizzle/svelte-ucan.db');

sqlite.pragma('foreign_keys = ON');

export const db = drizzle(sqlite);