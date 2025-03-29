import { authenticateRequest } from '$lib/server/auth';
import { getUserIdByPublicKey, insertPublicKey } from '$lib/server/models/publicKey';
import { doesNameExist, getByUserId, getUserIdByName, insertUser } from '$lib/server/models/user';
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
		const userModel = await getByUserId(db, userId!);

		return json({ data: userModel, success: true }, { status: 200 });
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
		const { name } = body as { name: string };

		if (!name) {
			return json({ error: 'Missing username', success: false }, { status: 400 });
		}

		const alphanumericRegex = /^[a-zA-Z0-9]+$/;

		if (!alphanumericRegex.test(name)) {
			return json({ error: 'Username must be alphanumeric', success: false }, { status: 400 });
		}

		const nameExists = await doesNameExist(db, name);

		if (nameExists) {
			return json(
				{ error: 'Username already exists, please choose another username', success: false },
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
				{ error: 'Public key already exists, please reset your key pairs', success: false },
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
