import { authenticateRequest } from '$lib/server/auth';
import {
	deleteLoginToken,
	getTokensByUserId,
	insertLoginToken
} from '$lib/server/models/login_tokens';
import { generateLoginToken } from '$lib/server/utils';
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

		const { userId, db } = authResult.data;
		const tokens = await getTokensByUserId(db, userId!);

		return json({ data: { tokens }, success: true }, { status: 200 });
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
		const authResult = await authenticateRequest(platform, request);

		if (!authResult.success) {
			return json({ error: authResult.error, success: false }, { status: authResult.status });
		}

		const { userId, db } = authResult.data;

		const token = generateLoginToken();

		const { expiresAt } = await insertLoginToken(db, userId!, token);

		return json({ data: { token, expires_at: expiresAt }, success: true }, { status: 201 });
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

		const { userId, db, body } = authResult.data;
		const { token } = body as { token: string };

		if (!token) {
			return json({ error: 'Missing token', success: false }, { status: 400 });
		}

		const deleteResult = await deleteLoginToken(db, userId!, token);

		if (!deleteResult) {
			return json({ error: 'Token has already been deleted', success: false }, { status: 404 });
		}

		return json({ success: true }, { status: 200 });
	} catch (error) {
		console.error('Error processing DELETE request:', error);
		return json({ error: 'Internal Server Error', success: false }, { status: 500 });
	}
};
