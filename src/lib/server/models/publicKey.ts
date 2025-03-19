import type { DrizzleD1Database } from 'drizzle-orm/d1';

import { eq } from 'drizzle-orm';
import { publicKeys } from '../db/schema';

export async function getUserIdByPublicKey(db: DrizzleD1Database, publicKey: string) {
	return await db
		.select({ userId: publicKeys.userId })
		.from(publicKeys)
		.where(eq(publicKeys.publicKey, publicKey))
		.get();
}

export async function getPublicKeysByUserId(db: DrizzleD1Database, userId: number) {
	return await db
		.select({ publicKey: publicKeys.publicKey })
		.from(publicKeys)
		.where(eq(publicKeys.userId, userId))
		.all();
}

export async function insertPublicKey(db: DrizzleD1Database, userId: number, publicKey: string) {
	return await db
		.insert(publicKeys)
		.values({ userId, publicKey })
		.returning({ id: publicKeys.id })
		.get();
}
