import { getDB } from '$lib/server/db/db';
import type { D1Database } from '@cloudflare/workers-types';
import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const GET: RequestHandler = async ({ platform = { env: { DB: {} as D1Database } }, request }) => {
	try {
		const db = getDB(platform.env);
		const url = new URL(request.url);
		const name = url.searchParams.get('name');

		if (!name) {
			return json({ error: 'Missing name' }, { status: 400 });
		}

		const row = await db
			.select({ id: users.id })
			.from(users)
			.where(eq(users.name, name))
			.get();

		if (row) {
			return json({ exist: true });
		} else {
			return json({ exist: false });
		}
	} catch (err) {
		console.error('Error checking user existence:', err);
		return json({ error: 'Internal Server Error' }, { status: 500 });
	}
};
