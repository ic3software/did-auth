import { authenticateRequest } from '$lib/server/auth';
import {
	checkEmailExists,
	deleteEmail,
	getEmailByUserIdAndEmail,
	getEmailsByUserId,
	insertEmail
} from '$lib/server/models/email';
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
		const userEmails = await getEmailsByUserId(db, userId!);

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
		const authResult = await authenticateRequest(platform, request, { parseBody: true });

		if (!authResult.success) {
			return json({ error: authResult.error, success: false }, { status: authResult.status });
		}

		const { userId, db, body } = authResult.data;
		const { email } = body as { email: string };

		if (!email) {
			return json({ error: 'Missing email', success: false }, { status: 400 });
		}

		const existingEmail = await checkEmailExists(db, email);
		if (existingEmail) {
			return json({ error: 'Email already exists', success: false }, { status: 409 });
		}

		await insertEmail(db, userId!, email);

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
		const authResult = await authenticateRequest(platform, request, { parseBody: true });

		if (!authResult.success) {
			return json({ error: authResult.error, success: false }, { status: authResult.status });
		}

		const { userId, db, body } = authResult.data;
		const { email } = body as { email: string };

		if (!email) {
			return json({ error: 'Missing email', success: false }, { status: 400 });
		}

		const existingEmail = await getEmailByUserIdAndEmail(db, userId!, email);

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
