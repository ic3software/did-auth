import * as uint8arrays from 'uint8arrays';
import { generateKeyPair as generateEd25519KeyPair, sign } from '@stablelib/ed25519';
import { isValidBase58btc } from './base58btcUtils';

/**
 * Opens IndexedDB and ensures the object store exists.
 */
function openDatabase(): Promise<IDBDatabase> {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open('cryptoKeysDB', 1);

		request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
			const db = (event.target as IDBOpenDBRequest).result;
			if (!db.objectStoreNames.contains('keys')) {
				db.createObjectStore('keys');
			}
		};

		request.onsuccess = (event: Event) => resolve((event.target as IDBOpenDBRequest).result);
		request.onerror = () => reject(request.error);
	});
}

/**
 * Generates an Ed25519 key pair.
 */
export async function generateKeyPair(): Promise<{ publicKey: Uint8Array; privateKey: Uint8Array }> {
	const keyPair = generateEd25519KeyPair();
	return {
		publicKey: keyPair.publicKey,
		privateKey: keyPair.secretKey
	};
}

/**
 * Stores the generated key pair securely in IndexedDB.
 */
export async function storeKeys(publicKey: Uint8Array, privateKey: Uint8Array): Promise<void> {
	const db = await openDatabase();
	const transaction = db.transaction('keys', 'readwrite');
	const store = transaction.objectStore('keys');

	// Store the public key
	store.put(publicKey, 'publicKey');

	// Store the private key
	store.put(privateKey, 'privateKey');

	return new Promise((resolve, reject) => {
		transaction.oncomplete = () => {
			resolve();
		};
		transaction.onerror = () => reject(transaction.error);
	});
}

/**
 * Retrieves a stored key (either public or private) from IndexedDB.
 */
export async function getKey(keyName: 'publicKey' | 'privateKey'): Promise<Uint8Array | null> {
	const db = await openDatabase();
	const transaction = db.transaction('keys', 'readonly');
	const store = transaction.objectStore('keys');

	return new Promise((resolve, reject) => {
		const request = store.get(keyName);
		request.onsuccess = () => resolve(request.result || null);
		request.onerror = () => reject(request.error);
	});
}

/**
 * Signs a request payload using the provided private key with Ed25519.
 */
export function signRequest(payload: unknown, privateKey: Uint8Array): string {
	const data = JSON.stringify(payload);
	const signature = sign(privateKey, new TextEncoder().encode(data));
	return uint8arrays.toString(signature, 'base58btc');
}

/**
 * Exports the public key as a base58btc string.
 */
export async function exportPublicKey(publicKey: Uint8Array): Promise<string> {
	try {
		return uint8arrays.toString(publicKey, 'base58btc');
	} catch (error) {
		console.error('Error exporting public key:', error);
		throw new Error('Failed to export public key.');
	}
}

export function isValidSignature(signature: string): boolean {
	return isValidBase58btc(signature);
}
