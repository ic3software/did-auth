import { and, eq } from 'drizzle-orm';
import type { DrizzleD1Database } from 'drizzle-orm/d1';

import { emails } from '../db/schema';

export async function getEmailsByUserId(db: DrizzleD1Database, userId: number) {
	return await db
		.select({ email: emails.email })
		.from(emails)
		.where(eq(emails.userId, userId))
		.all();
}

export async function getEmailByUserIdAndEmail(
	db: DrizzleD1Database,
	userId: number,
	email: string
) {
	return await db
		.select({ id: emails.id })
		.from(emails)
		.where(and(eq(emails.email, email), eq(emails.userId, userId)))
		.get();
}

export async function checkEmailExists(db: DrizzleD1Database, email: string) {
	const result = await db
		.select({ id: emails.id })
		.from(emails)
		.where(eq(emails.email, email))
		.get();

	return !!result;
}

export async function insertEmail(db: DrizzleD1Database, userId: number, email: string) {
	return await db.insert(emails).values({ userId, email }).run();
}

export async function deleteEmail(db: DrizzleD1Database, id: number) {
	return await db.delete(emails).where(eq(emails.id, id)).run();
}
