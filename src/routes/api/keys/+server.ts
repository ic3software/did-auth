import { isValidBase58btc } from '$lib/base58btcUtils';
import { verifySignature } from '$lib/server/db/crypto.server';
import { getDB } from '$lib/server/db/db';
import {
	getPublicKeysByUserId,
	getUserIdByPublicKey,
	insertPublicKey
} from '$lib/server/models/publicKey';
import {
	deleteRegistrationToken,
	isTokenValidAndGetUserId
} from '$lib/server/models/registrationToken';
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

export const POST: RequestHandler = async ({
	platform = { env: { DB: {} as D1Database } },
	request
}) => {
	try {
		const db = getDB(platform.env);
		const body = await request.json();
		const { token } = body;

		if (!token) {
			return json({ error: 'Missing token', success: false }, { status: 400 });
		}

		const xPublicKey = request.headers.get('X-Public-Key');
		const xSignature = request.headers.get('X-Signature');

		if (!xPublicKey || !xSignature) {
			return json(
				{ error: 'Missing X-Public-Key or X-Signature', success: false },
				{ status: 400 }
			);
		}

		if (!isValidBase58btc(xSignature)) {
			return json({ error: 'Invalid signature format', success: false }, { status: 400 });
		}

		const isVerified = verifySignature(JSON.stringify(body), xSignature, xPublicKey);

		if (!isVerified) {
			return json({ error: 'Invalid signature', success: false }, { status: 400 });
		}

		const userId = await isTokenValidAndGetUserId(db, token);

		if (!userId) {
			return json({ error: 'Invalid or expired token', success: false }, { status: 404 });
		}

		await insertPublicKey(db, userId, xPublicKey);
		await deleteRegistrationToken(db, userId, token);

		return json({ data: { publicKey: xPublicKey }, success: true }, { status: 201 });
	} catch (error) {
		console.error('Error processing POST request:', error);
		return json({ error: 'Internal Server Error', success: false }, { status: 500 });
	}
};
