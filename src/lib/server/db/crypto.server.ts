import { verify } from '@stablelib/ed25519';
import * as uint8arrays from 'uint8arrays';
import { isValidBase58btc } from '$lib/base58btcUtils';

/**
 * Verifies a signature using the provided public key in a Node.js environment.
 */
export function verifySignature(data: string, signature: string, publicKey: Uint8Array): boolean {
	if (!isValidBase58btc(signature)) {
		return false;
	}

	try {
		const signatureBytes = uint8arrays.fromString(signature, 'base58btc');
		return verify(publicKey, new TextEncoder().encode(data), signatureBytes);
	} catch (error) {
		console.error('Error verifying signature:', error);
		return false;
	}
}
