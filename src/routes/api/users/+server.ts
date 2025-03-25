import { isValidBase58btc } from '$lib/base58btcUtils';
import { authenticateRequest } from '$lib/server/auth';
import { verifySignature } from '$lib/server/db/crypto.server';
import { getDB } from '$lib/server/db/db';
import { getUserIdByPublicKey, insertPublicKey } from '$lib/server/models/publicKey';
import {
	doesNameExist,
	getNameByUserId,
	getUserIdByName,
	insertUser
} from '$lib/server/models/user';
import type { D1Database } from '@cloudflare/workers-types';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({
	platform = { env: { DB: {} as D1Database } },
	request
}) => {
	try {
		const authResult = await authenticateRequest(platform, request);

		if (!authResult.success) {
			return json({ error: authResult.error, success: false }, { status: authResult.status });
		}

		const { userId, db } = authResult.data;
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

		const alphanumericRegex = /^[a-zA-Z0-9]+$/;

		if (!alphanumericRegex.test(name)) {
			return json({ error: 'Name must be alphanumeric', success: false }, { status: 400 });
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

		if (!isValidBase58btc(xSignature)) {
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

		const nameExists = await doesNameExist(db, name);

		if (nameExists) {
			return json(
				{ error: 'Name already exists, please choose another name', success: false },
				{ status: 403 }
			);
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
