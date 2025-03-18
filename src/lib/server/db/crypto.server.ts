import * as uint8arrays from 'uint8arrays';

/**
 * Verifies a signature using the provided public key in a Node.js environment.
 */
export async function verifySignature(
	data: string,
	signature: string,
	publicKey: string
): Promise<boolean> {
	try {
		// First validate that the signature and public key are in base58btc format
		if (!/^[1-9A-HJ-NP-Za-km-z]+$/.test(signature) || !/^[1-9A-HJ-NP-Za-km-z]+$/.test(publicKey)) {
			console.error('Invalid base58btc format for signature or public key');
			return false;
		}

		// For empty payloads, use an empty object string
		const payload = data === '{}' ? '{}' : data;

		const signatureBytes = uint8arrays.fromString(signature, 'base58btc');
		const publicKeyBytes = uint8arrays.fromString(publicKey, 'base58btc');
		const dataBuffer = new TextEncoder().encode(payload);
		const importedKey = await crypto.subtle.importKey('raw', publicKeyBytes, 'Ed25519', false, [
			'verify'
		]);

		const isValid = await crypto.subtle.verify(
			{
				name: 'Ed25519'
			},
			importedKey,
			signatureBytes,
			dataBuffer
		);

		return isValid;
	} catch (error) {
		console.error('Error verifying signature:', error);
		return false;
	}
}
