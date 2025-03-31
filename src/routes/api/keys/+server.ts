import { authenticateRequest } from '$lib/server/auth';
import { deleteLoginToken, isTokenValidAndGetUserId } from '$lib/server/models/login_tokens';
import {
	deletePublicKey,
	getPublicKeysByUserId,
	getUserIdByPublicKey,
	insertPublicKey
} from '$lib/server/models/publicKey';
import type { D1Database } from '@cloudflare/workers-types';
import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';

export const GET: RequestHandler = async ({
	platform = { env: { DB: {} as D1Database } },
	request
}) => {
	try {
		const authResult = await authenticateRequest(platform, request);

		if (!authResult.success) {
			return json({ error: authResult.error, success: false }, { status: authResult.status });
		}

		const { userId, db, xPublicKey } = authResult.data;
		const userPublicKeys = await getPublicKeysByUserId(db, userId!);

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
		const authResult = await authenticateRequest(platform, request, {
			parseBody: true,
			requiredUserId: false
		});

		if (!authResult.success) {
			return json({ error: authResult.error, success: false }, { status: authResult.status });
		}

		const { db, xPublicKey, body } = authResult.data;
		const { token } = body as { token: string };

		if (!token) {
			return json({ error: 'Missing token', success: false }, { status: 400 });
		}

		const userId = await isTokenValidAndGetUserId(db, token);

		if (!userId) {
			return json({ error: 'Invalid or expired token', success: false }, { status: 404 });
		}

		const existingPublicKey = await getUserIdByPublicKey(db, xPublicKey);

		if (existingPublicKey) {
			return json(
				{ error: 'You have already linked this public key to another account', success: false },
				{ status: 409 }
			);
		}

		await insertPublicKey(db, userId, xPublicKey);
		await deleteLoginToken(db, userId, token);

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
		const authResult = await authenticateRequest(platform, request, { parseBody: true });

		if (!authResult.success) {
			return json({ error: authResult.error, success: false }, { status: authResult.status });
		}

		const { userId, db, xPublicKey, body } = authResult.data;
		const { publicKey } = body as { publicKey: string };

		if (!publicKey) {
			return json({ error: 'Missing public key', success: false }, { status: 400 });
		}

		if (xPublicKey === publicKey) {
			return json(
				{ error: 'Cannot delete the current public key', success: false },
				{ status: 400 }
			);
		}

		const deleteResult = await deletePublicKey(db, userId!, publicKey);

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
