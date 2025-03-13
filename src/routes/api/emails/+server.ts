import { getDB } from "$lib/server/db/db";
import type { D1Database } from "@cloudflare/workers-types";
import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import { eq, and } from "drizzle-orm";
import { emails, publicKeys } from "$lib/server/db/schema";
import { isValidBase64 } from "$lib/base64Utils";
import { verifySignature } from "$lib/server/db/cryto.server";

export const GET: RequestHandler = async ({ platform = { env: { DB: {} as D1Database } }, request }) => {
    try {
        const db = getDB(platform.env);
        const xPublicKey = request.headers.get('X-Public-Key');
        const xSignature = request.headers.get('X-Signature');

        if (!xPublicKey || !xSignature) {
            return json({ error: 'Missing X-Public-Key or X-Signature' }, { status: 400 });
        }

        if (!isValidBase64(xSignature)) {
            return json({ error: 'Invalid signature format' }, { status: 400 });
        }

        const isVerified = await verifySignature(`{}`, Uint8Array.from(atob(xSignature), c => c.charCodeAt(0)), xPublicKey);

        if (!isVerified) {
            return json({ error: 'Invalid signature' }, { status: 400 });
        }

        const existingPublicKey = await db
            .select({ userId: publicKeys.userId })
            .from(publicKeys)
            .where(eq(publicKeys.publicKey, xPublicKey))
            .get();

        if (!existingPublicKey) {
            return json({ error: 'User not found', success: false }, { status: 404 });
        }

        const userId = existingPublicKey.userId;

        const userEmails = await db
            .select({ email: emails.email })
            .from(emails)
            .where(eq(emails.userId, userId))
            .all();

        return json({ data: userEmails, success: true }, { status: 200 });
    } catch (e) {
        console.error('Error processing GET request:', e);
        return json({ error: 'Internal Server Error' }, { status: 500 });
    }
};


export const POST: RequestHandler = async ({ platform = { env: { DB: {} as D1Database } }, request }) => {
    try {
        const db = getDB(platform.env);
        const body = await request.json();
        const { email } = body;

        if (!email) {
            return json({ error: 'Missing email' }, { status: 400 });
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

        if (!existingPublicKey) {
            return json({ error: 'User not found', success: false }, { status: 404 });
        }

        const userId = existingPublicKey.userId;

        await db.insert(emails).values({ userId, email }).run();

        return json({ data: { email }, success: true }, { status: 201 });
    } catch (e) {
        console.error('Error processing POST request:', e);
        return json({ error: 'Internal Server Error' }, { status: 500 });
    }
};

export const DELETE: RequestHandler = async ({ platform = { env: { DB: {} as D1Database } }, request }) => {
    try {
        const db = getDB(platform.env);
        const body = await request.json();
        const { email } = body;

        if (!email) {
            return json({ error: 'Missing email' }, { status: 400 });
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

        if (!existingPublicKey) {
            return json({ error: 'User not found', success: false }, { status: 404 });
        }

        const userId = existingPublicKey.userId;

        const existingEmail = await db
            .select({ id: emails.id })
            .from(emails)
            .where(and(eq(emails.email, email), eq(emails.userId, userId)))
            .get();

        if (!existingEmail) {
            return json({ error: 'Email not found', success: false }, { status: 404 });
        }

        await db.delete(emails).where(eq(emails.id, existingEmail.id)).run();

        return json({ data: { email }, success: true }, { status: 200 });
    } catch (e) {
        console.error('Error processing DELETE request:', e);
        return json({ error: 'Internal Server Error' }, { status: 500 });
    }
};
