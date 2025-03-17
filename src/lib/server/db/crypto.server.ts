import crypto from 'crypto';

/**
 * Verifies a signature using the provided public key in a Node.js environment.
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
			type: 'spki' // Using SPKI format for public key (ECDSA with P-256 curve)
		});

		return crypto.verify(
			'sha256', // Using SHA-256 hash algorithm with ECDSA
			Buffer.from(data, 'utf-8'),
			{
				key: publicKey,
				dsaEncoding: 'ieee-p1363' // This is the encoding format used by Web Crypto API for ECDSA
			},
			Buffer.from(signature)
		);
	} catch (error) {
		console.error('Error verifying signature:', error);
		return false;
	}
}
