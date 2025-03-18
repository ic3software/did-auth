import { isValidBase58btc } from '$lib/base58btcUtils';
import { verifySignature } from '$lib/server/db/crypto.server';
import { getDB } from '$lib/server/db/db';
import { getPublicKeysByUserId, getUserIdByPublicKey } from '$lib/server/models/publicKey';
import type { D1Database } from '@cloudflare/workers-types';
import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';

export const GET: RequestHandler = async ({
	platform = { env: { DB: {} as D1Database } },
	request
}) => {
	try {
		const db = getDB(platform.env);
		const xPublicKey = request.headers.get('X-Public-Key');
		const xSignature = request.headers.get('X-Signature');

		if (!xPublicKey) {
			return json({ error: 'Missing X-Public-Key', success: false }, { status: 400 });
		}

		// If no signature is provided, this is a new user
		if (!xSignature) {
			return json({ error: 'User not found', success: false }, { status: 404 });
		}

		if (!isValidBase58btc(xSignature)) {
			return json({ error: 'Invalid signature format', success: false }, { status: 400 });
		}

		const isVerified = verifySignature(`{}`, xSignature, xPublicKey);

		if (!isVerified) {
			return json({ error: 'Invalid signature', success: false }, { status: 400 });
		}

		const userByPublicKey = await getUserIdByPublicKey(db, xPublicKey);

		if (!userByPublicKey) {
			return json({ error: 'User not found', success: false }, { status: 404 });
		}

		const userId = userByPublicKey.userId;
		const userPublicKeys = await getPublicKeysByUserId(db, userId);

		return json({ data: userPublicKeys, success: true }, { status: 200 });
	} catch (error) {
		console.error('Error processing GET request:', error);
		return json({ error: 'Internal Server Error', success: false }, { status: 500 });
	}
};
