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
) {
	try {
		// First validate that the signatures and public key are in base58btc format
		if (
			!isValidBase58btc(signature) ||
			!isValidBase58btc(publicKey) ||
			!isValidBase58btc(xTimerSignature)
		) {
			return { success: false, error: 'Invalid base58btc format for signature or public key' };
		}

		// Check if timestamp exists and is within 1 minute
		if (!xTimer || typeof xTimer !== 'string') {
			return { success: false, error: 'Missing or invalid timestamp' };
		}
		const currentTime = Math.floor(Date.now());
		const timeDiff = Math.abs(currentTime - parseInt(xTimer));
		if (Math.abs(timeDiff) > 60000) {
			return {
				success: false,
				error: 'Timestamp is too old or too far in the future - Please check your system clock.'
			};
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

		if (!isValidTimer) {
			return { success: false, error: 'Invalid x-timer signature' };
		}

		const isValid = await crypto.subtle.verify(
			{
				name: 'Ed25519'
			},
			importedKey,
			signatureBytes,
			dataBuffer
		);

		if (!isValid) {
			return { success: false, error: 'Invalid signature for data payload' };
		}

		return { success: true };
	} catch (error) {
		console.error('Error verifying signature:', error);
		return { success: false, error: 'Error verifying signature' };
	}
}
