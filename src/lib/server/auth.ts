import { isValidBase58btc } from '$lib/base58btcUtils';
import { verifySignature } from '$lib/server/db/crypto.server';
import { getDB } from '$lib/server/db/db';
import { getUserIdByPublicKey } from '$lib/server/models/publicKey';
import type { D1Database } from '@cloudflare/workers-types';
import type { DrizzleD1Database } from 'drizzle-orm/d1';

interface AuthResult {
	userId: number;
	db: DrizzleD1Database;
}

export async function authenticateRequest(
	platform: { env: { DB: D1Database } },
	request: Request
): Promise<
	{ success: true; data: AuthResult } | { success: false; error: string; status: number }
> {
	const db = getDB(platform.env);
	const xPublicKey = request.headers.get('X-Public-Key');
	const xSignature = request.headers.get('X-Signature');
	const xTimer = request.headers.get('X-Timer');
	const xTimerSignature = request.headers.get('X-Timer-Signature');

	if (!xPublicKey) {
		return { success: false, error: 'Missing X-Public-Key', status: 400 };
	}

	if (!xSignature) {
		return { success: false, error: 'User not found', status: 404 };
	}

	if (!xTimer || !xTimerSignature) {
		return { success: false, error: 'Missing timer or timer signature', status: 400 };
	}

	if (!isValidBase58btc(xSignature) || !isValidBase58btc(xTimerSignature)) {
		return { success: false, error: 'Invalid signature format', status: 400 };
	}

	const isVerified = await verifySignature(`{}`, xSignature, xPublicKey, xTimer, xTimerSignature);

	if (!isVerified.success) {
		return { success: false, error: isVerified.error ?? 'Verification failed', status: 400 };
	}

	const userByPublicKey = await getUserIdByPublicKey(db, xPublicKey);

	if (!userByPublicKey) {
		return { success: false, error: 'User not found', status: 404 };
	}

	return { success: true, data: { userId: userByPublicKey.userId, db } };
}
