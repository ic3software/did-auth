import { isValidBase58btc } from '$lib/base58btcUtils';
import { verifySignature } from '$lib/server/db/crypto.server';
import { getDB } from '$lib/server/db/db';
import { getUserIdByPublicKey, insertPublicKey } from '$lib/server/models/publicKey';
import { getNameByUserId, getUserIdByName, insertUser } from '$lib/server/models/user';
import type { D1Database } from '@cloudflare/workers-types';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
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
		const userName = await getNameByUserId(db, userId);

		return json({ data: userName, success: true }, { status: 200 });
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
		const { name } = body;

		if (!name) {
			return json({ error: 'Missing name', success: false }, { status: 400 });
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

		const [userIdByName, userIdByPublicKey] = await Promise.all([
			getUserIdByName(db, name),
			getUserIdByPublicKey(db, xPublicKey)
		]);

		if (userIdByName) {
			if (userIdByPublicKey?.userId === userIdByName.id) {
				return json({ data: { public_key: xPublicKey }, success: true }, { status: 200 });
			}
			return json({ error: 'User already exists', success: false }, { status: 403 });
		}

		if (userIdByPublicKey) {
			return json(
				{ error: 'Public key already exists, please reset your keypairs', success: false },
				{ status: 403 }
			);
		}

		const insertedUser = await insertUser(db, name);
		await insertPublicKey(db, insertedUser.id, xPublicKey);

		return json({ data: { public_key: xPublicKey }, success: true }, { status: 201 });
	} catch (error) {
		console.error('Error processing POST request:', error);
		return json({ error: 'Internal Server Error', success: false }, { status: 500 });
	}
};
