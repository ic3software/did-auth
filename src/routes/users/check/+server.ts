import type { RequestEvent } from '@sveltejs/kit';
import { db } from '$lib/server/db/db';
import { json } from '@sveltejs/kit';
import { users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(event: RequestEvent) {
	const url = new URL(event.request.url);
	const name = url.searchParams.get('name');

	if (!name) {
		return json({ error: 'Missing name' }, { status: 400 });
	}

	const row = db
		.select({ id: users.id })
		.from(users)
		.where(eq(users.name, name))
		.get();

	if (row) {
		return json({ exist: true });
	} else {
		return json({ exist: false });
	}
}
