/**
 * Generates an ECC key pair using Web Crypto API.
 * Uses the P-256 curve for ECDSA.
 * The private key is marked as non-extractable, ensuring it cannot be exported.
 */
export async function generateKeyPair(): Promise<CryptoKeyPair> {
	const keyPair = await window.crypto.subtle.generateKey(
		{
			name: 'ECDSA',
			namedCurve: 'P-256'
		},
		false,
		['sign', 'verify']
	);
	
	console.log('ECC key pair generated with non-extractable private key.');
	
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
 * The private key is stored as a CryptoKey object but remains non-extractable.
 * This means the key can be used for operations but cannot be exported or viewed.
 */
export async function storeKeys(publicKey: CryptoKey, privateKey: CryptoKey): Promise<void> {
	const db = await openDatabase();
	const transaction = db.transaction('keys', 'readwrite');
	const store = transaction.objectStore('keys');

	// Store the public key
	store.put(publicKey, 'publicKey');
	
	// Store the private key reference
	// Even though the key is non-extractable, the CryptoKey object itself can be stored
	// The browser ensures that the key material cannot be extracted
	store.put(privateKey, 'privateKey');

	return new Promise((resolve, reject) => {
		transaction.oncomplete = () => {
			console.log('ECC keys successfully stored in IndexedDB. Private key is non-extractable.');
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
 * Signs data using the stored private key with ECDSA.
 */
export async function signData(data: string): Promise<Uint8Array> {
	const privateKey = await getKey('privateKey');
	if (!privateKey) throw new Error('Private key not found in IndexedDB.');

	console.log('privateKey', privateKey);

	const encoder = new TextEncoder();
	const dataBuffer = encoder.encode(data);

	const signature = await window.crypto.subtle.sign(
		{
			name: 'ECDSA',
			hash: { name: 'SHA-256' }
		},
		privateKey,
		dataBuffer
	);

	return new Uint8Array(signature);
}

/**
 * Signs a request payload using the provided private key with ECDSA.
 * 
 * @param payload - The request payload to be signed.
 * @param privateKey - The private key to sign the payload with.
 * @returns A promise that resolves to the signed payload as a base64 string.
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

	return btoa(String.fromCharCode(...new Uint8Array(signature)));
}

/**
 * Exports the public key as a base64 string.
 * 
 * @param publicKey - The public key to be exported.
 * @returns A promise that resolves to the exported public key as a base64 string.
 */
export async function exportPublicKey(publicKey: CryptoKey): Promise<string> {
	try {
		const exportedKey = await window.crypto.subtle.exportKey('spki', publicKey);
		const publicKeyString = btoa(String.fromCharCode(...new Uint8Array(exportedKey)));
		return publicKeyString;
	} catch (error) {
		console.error('Error exporting public key:', error);
		throw new Error('Failed to export public key.');
	}
}

/**
 * Verifies a signature using ECDSA with the provided public key.
 */
export async function verifySignature(
	data: string,
	signature: Uint8Array,
	exportedPublicKeyString: string
): Promise<boolean> {
	try {
		const exportedKeyBuffer = Uint8Array.from(atob(exportedPublicKeyString), (c) => c.charCodeAt(0));
		const publicKey = await window.crypto.subtle.importKey(
			'spki',
			exportedKeyBuffer,
			{
				name: 'ECDSA',
				namedCurve: 'P-256'
			},
			true,
			['verify']
		);

		const encoder = new TextEncoder();
		const dataBuffer = encoder.encode(data);

		return await window.crypto.subtle.verify(
			{
				name: 'ECDSA',
				hash: { name: 'SHA-256' }
			},
			publicKey,
			signature,
			dataBuffer
		);
	} catch (error) {
		console.error('Verification error:', error);
		return false;
	}
}
