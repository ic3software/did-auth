import { isValidBase58btc } from '$lib/base58btcUtils';
import { verifySignature } from '$lib/server/db/crypto.server';
import { getDB } from '$lib/server/db/db';
import {
	checkEmailExists,
	deleteEmail,
	getEmailByUserIdAndEmail,
	getEmailsByUserId,
	insertEmail
} from '$lib/server/models/email';
import { getUserIdByPublicKey } from '$lib/server/models/publicKey';
import type { D1Database } from '@cloudflare/workers-types';
import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import * as uint8arrays from 'uint8arrays';

export const GET: RequestHandler = async ({
	platform = { env: { DB: {} as D1Database } },
	request
}) => {
	try {
		const db = getDB(platform.env);
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

		const publicKeyBytes = uint8arrays.fromString(xPublicKey, 'base58btc');
		const isVerified = verifySignature(
			`{}`,
			xSignature,
			publicKeyBytes
		);

		if (!isVerified) {
			return json({ error: 'Invalid signature', success: false }, { status: 400 });
		}

		const userByPublicKey = await getUserIdByPublicKey(db, xPublicKey);

		if (!userByPublicKey) {
			return json({ error: 'User not found', success: false }, { status: 404 });
		}

		const userId = userByPublicKey.userId;
		const userEmails = await getEmailsByUserId(db, userId);

		return json({ data: userEmails, success: true }, { status: 200 });
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
		const { email } = body;

		if (!email) {
			return json({ error: 'Missing email', success: false }, { status: 400 });
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

		const publicKeyBytes = uint8arrays.fromString(xPublicKey, 'base58btc');
		const isVerified = verifySignature(
			JSON.stringify(body),
			xSignature,
			publicKeyBytes
		);

		if (!isVerified) {
			return json({ error: 'Invalid signature', success: false }, { status: 400 });
		}

		const userByPublicKey = await getUserIdByPublicKey(db, xPublicKey);

		if (!userByPublicKey) {
			return json({ error: 'User not found', success: false }, { status: 404 });
		}

		const userId = userByPublicKey.userId;

		const existingEmail = await checkEmailExists(db, email);
		if (existingEmail) {
			return json(
				{ error: 'Email already exists, cannot bind again', success: false },
				{ status: 409 }
			);
		}

		await insertEmail(db, userId, email);

		return json({ data: { email }, success: true }, { status: 201 });
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
		const { email } = body;

		if (!email) {
			return json({ error: 'Missing email', success: false }, { status: 400 });
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

		const publicKeyBytes = uint8arrays.fromString(xPublicKey, 'base58btc');
		const isVerified = verifySignature(
			JSON.stringify(body),
			xSignature,
			publicKeyBytes
		);

		if (!isVerified) {
			return json({ error: 'Invalid signature', success: false }, { status: 400 });
		}

		const userByPublicKey = await getUserIdByPublicKey(db, xPublicKey);

		if (!userByPublicKey) {
			return json({ error: 'User not found', success: false }, { status: 404 });
		}

		const userId = userByPublicKey.userId;

		const existingEmail = await getEmailByUserIdAndEmail(db, userId, email);

		if (!existingEmail) {
			return json({ error: 'Email not found', success: false }, { status: 404 });
		}

		await deleteEmail(db, existingEmail.id);

		return json({ data: { email }, success: true }, { status: 200 });
	} catch (error) {
		console.error('Error processing DELETE request:', error);
		return json({ error: 'Internal Server Error', success: false }, { status: 500 });
	}
};
