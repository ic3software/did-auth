import * as uint8arrays from 'uint8arrays';
import { isValidBase58btc } from '$lib/base58btcUtils';

/**
 * Verifies a signature using the provided public key in a Node.js environment.
 */
export async function verifySignature(
	data: string,
	signature: string,
	publicKey: string,
	xTimer: string,
	xTimerSignature: string
): Promise<boolean> {
	try {
		// First validate that the signatures and public key are in base58btc format
		if (
			!isValidBase58btc(signature) ||
			!isValidBase58btc(publicKey) ||
			!isValidBase58btc(xTimerSignature)
		) {
			console.error('Invalid base58btc format for signature or public key');
			return false;
		}

		// Check if timestamp exists and is within 1 minute
		if (!xTimer || typeof xTimer !== 'string') {
			console.error('Missing or invalid timestamp');
			return false;
		}
		const currentTime = Math.floor(Date.now());
		const timeDiff = Math.abs(currentTime - parseInt(xTimer));
		if (Math.abs(timeDiff) > 60000) {
			console.error('Timestamp is too old or too far in the future');
			// TODO: Return the boolean along with an error message so the client can display it.
			// For example, if the timestamp is too old, return:
			//  {
			//    "success": false,
			//    "error": "Timestamp is too old or too far in the future - Please check your system clock."
			//  }
			return false;
		}

		// For empty payloads, use an empty object string
		const payloadString = data === '{}' ? '{}' : data;

		const publicKeyBytes = uint8arrays.fromString(publicKey, 'base58btc');
		const importedKey = await crypto.subtle.importKey('raw', publicKeyBytes, 'Ed25519', false, [
			'verify'
		]);
		const signatureBytes = uint8arrays.fromString(signature, 'base58btc');
		const dataBuffer = new TextEncoder().encode(payloadString);
		const xTimerSignatureBytes = uint8arrays.fromString(xTimerSignature, 'base58btc');
		const xTimerDataBuffer = new TextEncoder().encode(xTimer);

		const isValidTimer = await crypto.subtle.verify(
			{
				name: 'Ed25519'
			},
			importedKey,
			xTimerSignatureBytes,
			xTimerDataBuffer
		);

		const isValid = await crypto.subtle.verify(
			{
				name: 'Ed25519'
			},
			importedKey,
			signatureBytes,
			dataBuffer
		);

		return isValidTimer && isValid;
	} catch (error) {
		console.error('Error verifying signature:', error);
		return false;
	}
}
