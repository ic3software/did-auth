import * as uint8arrays from 'uint8arrays';

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
export async function generateKeyPair(): Promise<CryptoKeyPair> {
	const keyPair = (await crypto.subtle.generateKey(
		{
			name: 'Ed25519'
		},
		false,
		['sign', 'verify']
	)) as CryptoKeyPair;

	return keyPair;
}

/**
 * Stores the generated key pair securely in IndexedDB.
 */
export async function storeKeys(publicKey: CryptoKey, privateKey: CryptoKey): Promise<void> {
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
export async function getKey(keyName: 'publicKey' | 'privateKey'): Promise<CryptoKey | null> {
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
export async function signRequest(payload: unknown, privateKey: CryptoKey): Promise<string> {
	try {
		// For empty payloads, use an empty object string
		const data = payload === undefined || payload === null ? '{}' : JSON.stringify(payload);
		const signature = await crypto.subtle.sign(
			{
				name: 'Ed25519'
			},
			privateKey,
			new TextEncoder().encode(data)
		);
		return uint8arrays.toString(new Uint8Array(signature), 'base58btc');
	} catch (error) {
		console.error('Error signing request:', error);
		throw new Error('Failed to sign request');
	}
}

/**
 * Exports the public key as a base58btc string.
 */
export async function exportPublicKey(publicKey: CryptoKey): Promise<string> {
	try {
		const exported = await crypto.subtle.exportKey('raw', publicKey);
		return uint8arrays.toString(new Uint8Array(exported), 'base58btc');
	} catch (error) {
		console.error('Error exporting public key:', error);
		throw new Error('Failed to export public key');
	}
}

export function isValidSignature(signature: string): boolean {
	return /^[1-9A-HJ-NP-Za-km-z]+$/.test(signature);
}
