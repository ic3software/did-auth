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
 * Generates an ECC key pair using Web Crypto API.
 */
export async function generateKeyPair(): Promise<CryptoKeyPair> {
	const keyPair = await window.crypto.subtle.generateKey(
		{
			name: 'ECDSA',
			namedCurve: 'P-256' // Using P-256 curve for ECDSA
		},
		false, // Private key is not extractable, ensuring it cannot be exported
		['sign', 'verify']
	);

	return keyPair;
}

/**
 * Stores the generated key pair securely in IndexedDB.
 */
export async function storeKeys(publicKey: CryptoKey, privateKey: CryptoKey): Promise<void> {
	const db = await openDatabase();
	const transaction = db.transaction('keys', 'readwrite');
	const store = transaction.objectStore('keys');

	// Store the public key.
	store.put(publicKey, 'publicKey');

	// Store the private key reference.
	// The private key is stored as a CryptoKey object but remains non-extractable.
	// It can be used for operations but cannot be exported or viewed.
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
 * Signs a request payload using the provided private key with ECDSA.
 */
export async function signRequest(payload: object, privateKey: CryptoKey): Promise<string> {
	const encoder = new TextEncoder();
	const dataBuffer = encoder.encode(JSON.stringify(payload));

	const signature = await window.crypto.subtle.sign(
		{
			name: 'ECDSA',
			hash: { name: 'SHA-256' }
		},
		privateKey,
		dataBuffer
	);

	return btoa(String.fromCharCode(...new Uint8Array(signature))); // Convert signature to base64 string
}

/**
 * Exports the public key as a base64 string.
 */
export async function exportPublicKey(publicKey: CryptoKey): Promise<string> {
	try {
		const exportedKey = await window.crypto.subtle.exportKey('spki', publicKey);
		const publicKeyString = new Uint8Array(exportedKey);

		// Convert to base58btc
		const base58Key = uint8arrays.toString(publicKeyString, 'base58btc');
		return base58Key;
	} catch (error) {
		console.error('Error exporting public key:', error);
		throw new Error('Failed to export public key.');
	}
}
