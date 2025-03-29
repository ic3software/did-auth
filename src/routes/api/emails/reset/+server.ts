import { PRIVATE_RESEND_KEY } from '$env/static/private';
import { authenticateRequest } from '$lib/server/auth';
import { getUserIdByEmail } from '$lib/server/models/email';
import { insertRegistrationToken } from '$lib/server/models/registrationToken';
import { getByUserId } from '$lib/server/models/user';
import { generateRegistrationToken } from '$lib/server/utils';
import type { D1Database } from '@cloudflare/workers-types';
import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { Resend } from 'resend';

if (!PRIVATE_RESEND_KEY) {
	throw new Error('PRIVATE_RESEND_KEY is not set');
}

const resend = new Resend(PRIVATE_RESEND_KEY);

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

		const { db, body } = authResult.data;
		const { email } = body as { email: string };

		if (!email) {
			return json({ error: 'Missing email', success: false }, { status: 400 });
		}

		const userId = await getUserIdByEmail(db, email);
		if (!userId) {
			return json({ error: 'Email not found', success: false }, { status: 400 });
		}

		const user = await getByUserId(db, userId);
		if (!user || !user.emailReset) {
			return json(
				{ error: 'Email reset not enabled for this user', success: false },
				{ status: 400 }
			);
		}

		const token = generateRegistrationToken();
		const resetLink = new URL(`/access?token=${token}`, request.url).toString();

		const { error } = await resend.emails.send({
			from: 'DONOTREPLY <onboarding@ic3.dev>',
			to: [email],
			subject: 'Password Reset',
			html: `<strong>Click the link to reset your password: <a href="${resetLink}">${resetLink}</a></strong>`
		});

		if (error) {
			return json({ error: 'Failed to send email', success: false }, { status: 500 });
		}

		await insertRegistrationToken(db, userId, token);

		return json({ data: { email }, success: true }, { status: 200 });
	} catch (error) {
		console.error('Error processing POST request:', error);
		return json({ error: 'Internal Server Error', success: false }, { status: 500 });
	}
};
