import type { RequestEvent } from '@sveltejs/kit';
import { db } from '$lib/server/db/db';
import { json } from '@sveltejs/kit';
import { users, publicKeys } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(event: RequestEvent) {
    const url = new URL(event.request.url);
    const publicKey = url.searchParams.get('public_key');

    if (!publicKey) {
        return json({ error: 'Missing public_key' }, { status: 400 });
    }

    const row = db
        .select({
            id: users.id,
            name: users.name,
        })
        .from(users)
        .innerJoin(publicKeys, eq(users.id, publicKeys.userId))
        .where(eq(publicKeys.publicKey, publicKey))
        .get();

    if (row) {
        return json({ user: row }, { status: 200 });
    } else {
        return json({ user: null }, { status: 200 });
    }
}

export async function POST(event: RequestEvent) {
    try {
        const body = await event.request.json();
        const { public_key: publicKey, name } = body;

        if (!publicKey || !name) {
            return json({ error: 'Missing public_key or name' }, { status: 400 });
        }

        const existingPublicKey = await db
            .select({ id: publicKeys.id })
            .from(publicKeys)
            .where(eq(publicKeys.publicKey, publicKey))
            .get();

        if (existingPublicKey) {
            return json({ error: 'Public key already exists' }, { status: 400 });
        }

        const existingUser = db
            .select({ id: users.id })
            .from(users)
            .where(eq(users.name, name))
            .get();

        let userId: number;
        if (!existingUser) {
            const insertedUser = db.insert(users).values({ name }).run();
            userId = insertedUser.lastInsertRowid as number;
        } else {
            userId = existingUser.id;
        }

        db.insert(publicKeys).values({ userId, publicKey }).run();

        return json({ success: true }, { status: 201 });
    } catch (e) {
        return json({ error: (e as Error).message }, { status: 500 });
    }
}
