import { authenticateRequest } from '$lib/server/auth';
import { updateUserEmailReset } from '$lib/server/models/user';
import type { D1Database } from '@cloudflare/workers-types';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

export const PATCH: RequestHandler = async ({
	platform = { env: { DB: {} as D1Database } },
	request
}) => {
	try {
		const authResult = await authenticateRequest(platform, request, {
			parseBody: true,
			requiredUserId: true
		});

		if (!authResult.success) {
			return json({ error: authResult.error, success: false }, { status: authResult.status });
		}

		const { db, userId, body } = authResult.data;
		const { emailReset } = body as { emailReset: boolean };

		if (typeof emailReset !== 'boolean') {
			return json({ error: 'Invalid emailReset value', success: false }, { status: 400 });
		}

		await updateUserEmailReset(db, userId!, emailReset);

		return json({ success: true }, { status: 200 });
	} catch (error) {
		console.error('Error processing PATCH request:', error);
		return json({ error: 'Internal Server Error', success: false }, { status: 500 });
	}
};
