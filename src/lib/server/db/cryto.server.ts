import crypto from 'crypto';

/**
 * Verifies a signature using the stored public key in a Node.js environment.
 */
export async function verifySignature(
	data: string,
	signature: Uint8Array,
	exportedPublicKeyString: string
): Promise<boolean> {
	try {
		const publicKeyBuffer = Buffer.from(exportedPublicKeyString, 'base64');

		const publicKey = crypto.createPublicKey({
			key: publicKeyBuffer,
			format: 'der',
			type: 'spki',
		});

		return crypto.verify(
			'RSA-SHA256',
			Buffer.from(data, 'utf-8'),
			publicKey,
			Buffer.from(signature)
		);
	} catch (error) {
		console.error('Error verifying signature:', error);
		return false;
	}
}
