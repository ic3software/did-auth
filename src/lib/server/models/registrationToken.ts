import { and, eq, gt, lt, sql } from 'drizzle-orm';
import type { DrizzleD1Database } from 'drizzle-orm/d1';

import { registrationTokens } from '../db/schema';

export async function isTokenValidAndGetUserId(
	db: DrizzleD1Database,
	token: string
): Promise<number | null> {
	const currentTime = Date.now();
	const result = await db
		.select({ userId: registrationTokens.userId })
		.from(registrationTokens)
		.where(
			and(
				eq(registrationTokens.token, token),
				gt(registrationTokens.expiresAt, new Date(currentTime))
			)
		)
		.get();

	return result ? result.userId : null;
}

export async function getTokensByUserId(
	db: DrizzleD1Database,
	userId: number
): Promise<{ token: string; expiresAt: Date }[]> {
	const currentTime = new Date();

	// Delete expired tokens
	await db
		.delete(registrationTokens)
		.where(
			and(eq(registrationTokens.userId, userId), lt(registrationTokens.expiresAt, currentTime))
		)
		.run();

	const result = await db
		.select({ token: registrationTokens.token, expiresAt: registrationTokens.expiresAt })
		.from(registrationTokens)
		.where(eq(registrationTokens.userId, userId))
		.all();

	return result;
}

export async function insertRegistrationToken(
	db: DrizzleD1Database,
	userId: number,
	token: string
) {
	return await db
		.insert(registrationTokens)
		.values({ token, userId, expiresAt: sql`(strftime('%s', 'now') + 300)` })
		.returning({ id: registrationTokens.id, expiresAt: registrationTokens.expiresAt })
		.get();
}

export async function deleteRegistrationToken(
	db: DrizzleD1Database,
	userId: number,
	token: string
): Promise<boolean> {
	const result = await db
		.delete(registrationTokens)
		.where(and(eq(registrationTokens.token, token), eq(registrationTokens.userId, userId)))
		.returning();
	return result.length > 0;
}
