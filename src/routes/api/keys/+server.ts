import { isValidBase58btc } from '$lib/base58btcUtils';
import { verifySignature } from '$lib/server/db/crypto.server';
import { getDB } from '$lib/server/db/db';
import {
	deletePublicKey,
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
		const xTimer = request.headers.get('X-Timer');
		const xTimerSignature = request.headers.get('X-Timer-Signature');

		if (!xPublicKey) {
			return json({ error: 'Missing X-Public-Key', success: false }, { status: 400 });
		}

		// If no signature is provided, this is a new user
		if (!xSignature) {
			return json({ error: 'User not found', success: false }, { status: 404 });
		}

		if (!isValidBase58btc(xSignature) || !isValidBase58btc(xTimerSignature!)) {
			return json({ error: 'Invalid signature format', success: false }, { status: 400 });
		}

		const isVerified = await verifySignature(
			`{}`,
			xSignature,
			xPublicKey,
			xTimer!,
			xTimerSignature!
		);

		if (!isVerified.success) {
			return json({ error: isVerified.error, success: false }, { status: 400 });
		}

		const userByPublicKey = await getUserIdByPublicKey(db, xPublicKey);

		if (!userByPublicKey) {
			return json({ error: 'User not found', success: false }, { status: 404 });
		}

		const userId = userByPublicKey.userId;
		const userPublicKeys = await getPublicKeysByUserId(db, userId);

		return json(
			{ data: { publicKeys: userPublicKeys, currentPublicKey: xPublicKey }, success: true },
			{ status: 200 }
		);
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
		const xTimer = request.headers.get('X-Timer');
		const xTimerSignature = request.headers.get('X-Timer-Signature');

		if (!xPublicKey || !xSignature) {
			return json(
				{ error: 'Missing X-Public-Key or X-Signature', success: false },
				{ status: 400 }
			);
		}

		if (!isValidBase58btc(xSignature) || !isValidBase58btc(xTimerSignature!)) {
			return json({ error: 'Invalid signature format', success: false }, { status: 400 });
		}

		const isVerified = await verifySignature(
			JSON.stringify(body),
			xSignature,
			xPublicKey,
			xTimer!,
			xTimerSignature!
		);

		if (!isVerified.success) {
			return json({ error: isVerified.error, success: false }, { status: 400 });
		}

		const userId = await isTokenValidAndGetUserId(db, token);

		if (!userId) {
			return json({ error: 'Invalid or expired token', success: false }, { status: 404 });
		}

		const existingPublicKey = await getUserIdByPublicKey(db, xPublicKey);

		if (existingPublicKey) {
			return json(
				{ error: 'You have already linked this key to another account.', success: false },
				{ status: 409 }
			);
		}

		await insertPublicKey(db, userId, xPublicKey);
		await deleteRegistrationToken(db, userId, token);

		return json({ data: { publicKey: xPublicKey }, success: true }, { status: 201 });
	} catch (error) {
		console.error('Error processing POST request:', error);
		return json({ error: 'Internal Server Error', success: false }, { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({
	platform = { env: { DB: {} as D1Database } },
	request
}) => {
	try {
		const db = getDB(platform.env);
		const body = await request.json();
		const { publicKey } = body;

		if (!publicKey) {
			return json({ error: 'Missing publicKey', success: false }, { status: 400 });
		}

		const xPublicKey = request.headers.get('X-Public-Key');
		const xSignature = request.headers.get('X-Signature');
		const xTimer = request.headers.get('X-Timer');
		const xTimerSignature = request.headers.get('X-Timer-Signature');

		if (!xPublicKey || !xSignature) {
			return json(
				{ error: 'Missing X-Public-Key or X-Signature', success: false },
				{ status: 400 }
			);
		}

		if (!isValidBase58btc(xSignature) || !isValidBase58btc(xTimerSignature!)) {
			return json({ error: 'Invalid signature format', success: false }, { status: 400 });
		}

		const isVerified = await verifySignature(
			JSON.stringify(body),
			xSignature,
			xPublicKey,
			xTimer!,
			xTimerSignature!
		);

		if (!isVerified.success) {
			return json({ error: isVerified.error, success: false }, { status: 400 });
		}

		const userByPublicKey = await getUserIdByPublicKey(db, xPublicKey);

		if (!userByPublicKey) {
			return json({ error: 'User not found', success: false }, { status: 404 });
		}

		if (xPublicKey === publicKey) {
			return json(
				{ error: 'Cannot delete the current public key', success: false },
				{ status: 400 }
			);
		}

		const userId = userByPublicKey.userId;
		const deleteResult = await deletePublicKey(db, userId, publicKey);

		if (!deleteResult) {
			return json(
				{ error: 'Public key has already been deleted', success: false },
				{ status: 404 }
			);
		}

		return json({ success: true }, { status: 200 });
	} catch (error) {
		console.error('Error processing DELETE request:', error);
		return json({ error: 'Internal Server Error', success: false }, { status: 500 });
	}
};
