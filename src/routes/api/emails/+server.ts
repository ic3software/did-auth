import { getDB } from "$lib/server/db/db";
import type { D1Database } from "@cloudflare/workers-types";
import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import { isValidBase64 } from "$lib/base64Utils";
import { verifySignature } from "$lib/server/db/cryto.server";
import { getUserIdByPublicKey } from "$lib/server/models/publicKey";
import { getEmailByUserIdAndEmail, getEmailsByUserId, insertEmail, deleteEmail, checkEmailExists } from "$lib/server/models/email";

export const GET: RequestHandler = async ({ platform = { env: { DB: {} as D1Database } }, request }) => {
    try {
        const db = getDB(platform.env);
        const xPublicKey = request.headers.get('X-Public-Key');
        const xSignature = request.headers.get('X-Signature');

        if (!xPublicKey || !xSignature) {
            return json({ error: 'Missing X-Public-Key or X-Signature', success: false }, { status: 400 });
        }

        if (!isValidBase64(xSignature)) {
            return json({ error: 'Invalid signature format', success: false }, { status: 400 });
        }

        const isVerified = await verifySignature(`{}`, Uint8Array.from(atob(xSignature), c => c.charCodeAt(0)), xPublicKey);

        if (!isVerified) {
            return json({ error: 'Invalid signature', success: false }, { status: 400 });
        }

        const userByPublicKey = await getUserIdByPublicKey(db, xPublicKey);

        if (!userByPublicKey) {
            return json({ error: 'User not found', success: false }, { status: 404 });
        }

        const userId = userByPublicKey.userId;
        const userEmails = await getEmailsByUserId(db, userId);

        return json({ data: userEmails, success: true }, { status: 200 });
    } catch (e) {
        console.error('Error processing GET request:', e);
        return json({ error: 'Internal Server Error', success: false }, { status: 500 });
    }
};

export const POST: RequestHandler = async ({ platform = { env: { DB: {} as D1Database } }, request }) => {
    try {
        const db = getDB(platform.env);
        const body = await request.json();
        const { email } = body;

        if (!email) {
            return json({ error: 'Missing email', success: false }, { status: 400 });
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

        const userByPublicKey = await getUserIdByPublicKey(db, xPublicKey);

        if (!userByPublicKey) {
            return json({ error: 'User not found', success: false }, { status: 404 });
        }

        const userId = userByPublicKey.userId;

        const existingEmail = await checkEmailExists(db, email);
        if (existingEmail) {
            return json({ error: 'Email already exists, cannot bind again', success: false }, { status: 409 });
        }

        await insertEmail(db, userId, email);

        return json({ data: { email }, success: true }, { status: 201 });
    } catch (e) {
        console.error('Error processing POST request:', e);
        return json({ error: 'Internal Server Error', success: false }, { status: 500 });
    }
};

export const DELETE: RequestHandler = async ({ platform = { env: { DB: {} as D1Database } }, request }) => {
    try {
        const db = getDB(platform.env);
        const body = await request.json();
        const { email } = body;

        if (!email) {
            return json({ error: 'Missing email', success: false }, { status: 400 });
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

        const userByPublicKey = await getUserIdByPublicKey(db, xPublicKey);

        if (!userByPublicKey) {
            return json({ error: 'User not found', success: false }, { status: 404 });
        }

        const userId = userByPublicKey.userId;

        const existingEmail = await getEmailByUserIdAndEmail(db, userId, email);

        if (!existingEmail) {
            return json({ error: 'Email not found', success: false }, { status: 404 });
        }

        await deleteEmail(db, existingEmail.id);

        return json({ data: { email }, success: true }, { status: 200 });
    } catch (e) {
        console.error('Error processing DELETE request:', e);
        return json({ error: 'Internal Server Error', success: false }, { status: 500 });
    }
};
