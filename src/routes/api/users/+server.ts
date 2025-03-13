import { json } from '@sveltejs/kit';
import { users, publicKeys } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { getDB } from '$lib/server/db/db';
import type { D1Database } from '@cloudflare/workers-types';
import type { RequestHandler } from '@sveltejs/kit';
import { verifySignature } from '$lib/server/db/cryto.server';
import { isValidBase64 } from '$lib/base64Utils';

export const GET: RequestHandler = async ({ platform = { env: { DB: {} as D1Database } }, request }) => {
    try {
        const db = getDB(platform.env);
        const url = new URL(request.url);
        const publicKey = url.searchParams.get('public_key');

        if (!publicKey) {
            return json({ error: 'Missing public_key' }, { status: 400 });
        }

        const row = await db
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
    } catch (err) {
        console.error('Error fetching user:', err);
        return json({ error: 'Internal Server Error' }, { status: 500 });
    }
};

export const POST: RequestHandler = async ({ platform = { env: { DB: {} as D1Database } }, request }) => {
    try {
        const db = getDB(platform.env);
        const body = await request.json();
        const { name } = body;

        if (!name) {
            return json({ error: 'Missing name' }, { status: 400 });
        }

        const xPublicKey = request.headers.get('X-Public-Key');
        const xSignature = request.headers.get('X-Signature');

        if (!xPublicKey || !xSignature) {
            return json({ error: 'Missing X-Public-Key or X-Signature' }, { status: 400 });
        }

        if (!isValidBase64(xSignature)) {
            return json({ error: 'Invalid signature format' }, { status: 400 });
        }

        const isVerified = await verifySignature(JSON.stringify(body), Uint8Array.from(atob(xSignature), c => c.charCodeAt(0)), xPublicKey);

        if (!isVerified) {
            return json({ error: 'Invalid signature' }, { status: 400 });
        }

        const existingPublicKey = await db
            .select({ userId: publicKeys.userId })
            .from(publicKeys)
            .where(eq(publicKeys.publicKey, xPublicKey))
            .get();

        if (existingPublicKey) {
            return json({ data: { public_key: xPublicKey }, success: true }, { status: 200 });
        }

        const existingUser = await db
            .select({ id: users.id })
            .from(users)
            .where(eq(users.name, name))
            .get();

        let userId: number;
        if (!existingUser) {
            const insertedUser = await db.insert(users).values({ name }).returning({ id: users.id }).get();
            userId = insertedUser.id;
        } else {
            userId = existingUser.id;
        }

        await db.insert(publicKeys).values({ userId, publicKey: xPublicKey }).run();

        return json({ data: { public_key: xPublicKey }, success: true }, { status: 201 });
    } catch (e) {
        console.error('Error processing POST request:', e);
        return json({ error: 'Internal Server Error' }, { status: 500 });
    }
};
