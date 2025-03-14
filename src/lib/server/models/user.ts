import { users } from '../db/schema';
import { eq } from 'drizzle-orm';
import type { DrizzleD1Database } from 'drizzle-orm/d1';

export async function getUserByName(db: DrizzleD1Database, name: string) {
	return await db.select({ id: users.id }).from(users).where(eq(users.name, name)).get();
}

export async function insertUser(db: DrizzleD1Database, name: string) {
	return await db.insert(users).values({ name }).returning({ id: users.id }).get();
}
