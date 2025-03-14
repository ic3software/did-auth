import { json } from '@sveltejs/kit';
import { getDB } from '$lib/server/db/db';
import type { D1Database } from '@cloudflare/workers-types';
import type { RequestHandler } from '@sveltejs/kit';
import { verifySignature } from '$lib/server/db/cryto.server';
import { isValidBase64 } from '$lib/base64Utils';
import { getUserByName, insertUser } from '$lib/server/models/user';
import { getUserIdByPublicKey, insertPublicKey } from '$lib/server/models/publicKey';

export const POST: RequestHandler = async ({ platform = { env: { DB: {} as D1Database } }, request }) => {
    try {
        const db = getDB(platform.env);
        const body = await request.json();
        const { name } = body;

        if (!name) {
            return json({ error: 'Missing name', success: false }, { status: 400 });
        }

        const xPublicKey = request.headers.get('X-Public-Key');
        const xSignature = request.headers.get('X-Signature');

        if (!xPublicKey || !xSignature) {
            return json({ error: 'Missing X-Public-Key or X-Signature', success: false }, { status: 400 });
        }

        if (!isValidBase64(xSignature)) {
            return json({ error: 'Invalid signature format', success: false }, { status: 400 });
        }

        const isVerified = await verifySignature(JSON.stringify(body), Uint8Array.from(atob(xSignature), c => c.charCodeAt(0)), xPublicKey);

        if (!isVerified) {
            return json({ error: 'Invalid signature', success: false }, { status: 400 });
        }

        const [userByName, userByPublicKey] = await Promise.all([
            getUserByName(db, name),
            getUserIdByPublicKey(db, xPublicKey),
        ]);

        if (userByName) {
            if (userByPublicKey?.userId === userByName.id) {
                return json({ data: { public_key: xPublicKey }, success: true }, { status: 200 });
            }
            return json({ error: 'Public key mismatch', success: false }, { status: 403 });
        }

        if (userByPublicKey) {
            return json({ error: 'Public key already exists, please reset your keypairs', success: false }, { status: 403 });
        }

        const insertedUser = await insertUser(db, name);
        await insertPublicKey(db, insertedUser.id, xPublicKey);

        return json({ data: { public_key: xPublicKey }, success: true }, { status: 201 });
    } catch (e) {
        console.error('Error processing POST request:', e);
        return json({ error: 'Internal Server Error' }, { status: 500 });
    }
};
