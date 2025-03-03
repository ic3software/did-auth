// src/lib/crypto.ts

/**
 * Generates an RSA key pair using Web Crypto API.
 * The private key is marked as non-extractable, ensuring it cannot be exported.
 */
export async function generateKeyPair(): Promise<CryptoKeyPair> {
	const keyPair = await window.crypto.subtle.generateKey(
		{
			name: 'RSASSA-PKCS1-v1_5',
			modulusLength: 2048,
			publicExponent: new Uint8Array([1, 0, 1]),
			hash: { name: 'SHA-256' }
		},
		false,
		['sign', 'verify']
	);

	console.log('Key pair generated:', keyPair);
	return keyPair;
}

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
 * Stores the generated keys securely in IndexedDB.
 * The private key is stored but remains non-extractable.
 */
export async function storeKeys(publicKey: CryptoKey, privateKey: CryptoKey): Promise<void> {
	const db = await openDatabase();
	const transaction = db.transaction('keys', 'readwrite');
	const store = transaction.objectStore('keys');

	store.put(publicKey, 'publicKey');
	store.put(privateKey, 'privateKey');

	return new Promise((resolve, reject) => {
		transaction.oncomplete = () => {
			console.log('Keys successfully stored in IndexedDB.');
			resolve();
		};
		transaction.onerror = () => reject(transaction.error);
	});
}

/**
 * Retrieves a stored key (either public or private) from IndexedDB.
 * Ensures the object store exists before accessing.
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
 * Signs data using the stored private key.
 * The private key remains protected and cannot be extracted.
 */
export async function signData(data: string): Promise<Uint8Array> {
	const privateKey = await getKey('privateKey');
	if (!privateKey) throw new Error('Private key not found in IndexedDB.');

	console.log('privateKey', privateKey);

	const encoder = new TextEncoder();
	const dataBuffer = encoder.encode(data);

	const signature = await window.crypto.subtle.sign(
		{ name: 'RSASSA-PKCS1-v1_5' },
		privateKey,
		dataBuffer
	);

	return new Uint8Array(signature);
}

/**
 * Verifies a signature using the stored public key.
 */
export async function verifySignature(
	data: string,
	signature: Uint8Array,
	exportedPublicKeyString: string
): Promise<boolean> {
	const exportedKeyBuffer = Uint8Array.from(atob(exportedPublicKeyString), (c) => c.charCodeAt(0));
	const publicKey = await window.crypto.subtle.importKey(
		'spki',
		exportedKeyBuffer,
		{ name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
		true,
		['verify']
	);

	const encoder = new TextEncoder();
	const dataBuffer = encoder.encode(data);

	return await window.crypto.subtle.verify(
		{ name: 'RSASSA-PKCS1-v1_5' },
		publicKey,
		signature,
		dataBuffer
	);
}
