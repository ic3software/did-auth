import { eq } from 'drizzle-orm';
import type { DrizzleD1Database } from 'drizzle-orm/d1';

import { users } from '../db/schema';

export async function getUserIdByName(db: DrizzleD1Database, name: string) {
	return await db.select({ id: users.id }).from(users).where(eq(users.name, name)).get();
}

export async function insertUser(db: DrizzleD1Database, name: string) {
	return await db
		.insert(users)
		.values({ name, normalizedName: name.toLowerCase() })
		.returning({ id: users.id })
		.get();
}

export async function doesNameExist(db: DrizzleD1Database, name: string): Promise<boolean> {
	const result = await db
		.select({ id: users.id })
		.from(users)
		.where(eq(users.normalizedName, name.toLowerCase()))
		.get();
	return result !== undefined;
}

export async function getByUserId(db: DrizzleD1Database, id: number) {
	return await db
		.select({ name: users.name, emailReset: users.emailReset })
		.from(users)
		.where(eq(users.id, id))
		.get();
}

export async function updateUserEmailReset(
	db: DrizzleD1Database,
	userId: number,
	emailReset: boolean
) {
	return await db.update(users).set({ emailReset }).where(eq(users.id, userId)).run();
}
