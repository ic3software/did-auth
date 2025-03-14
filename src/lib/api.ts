import { getKey, generateKeyPair, storeKeys, signRequest, exportPublicKey } from './crypto';

let keypair: { publicKey: CryptoKey; privateKey: CryptoKey } | null = null;

async function loadKeyPair() {
	if (!keypair) {
		const storedPrivateKey = await getKey('privateKey');
		if (storedPrivateKey) {
			keypair = {
				publicKey: (await getKey('publicKey')) as CryptoKey,
				privateKey: storedPrivateKey
			};
		} else {
			keypair = await generateKeyPair();
			await storeKeys(keypair.publicKey, keypair.privateKey);
		}
	}
}

export async function fetchUsers(method: string, payload: Record<string, any> = {}) {
	try {
		await loadKeyPair();
		const signature = await signRequest(payload, keypair!.privateKey);
		const res = await fetch('/api/users', {
			method,
			headers: {
				'Content-Type': 'application/json',
				'X-Signature': signature,
				'X-Public-Key': await exportPublicKey(keypair!.publicKey)
			},
			body: method !== 'GET' ? JSON.stringify(payload) : undefined
		});
		return res.json();
	} catch (error) {
		console.error(`Error during fetchUsers ${method} request:`, error);
		throw error;
	}
}

export async function fetchEmails(method: string, payload: Record<string, any> = {}) {
	try {
		await loadKeyPair();
		const signature = await signRequest(payload, keypair!.privateKey);
		const res = await fetch('/api/emails', {
			method,
			headers: {
				'Content-Type': 'application/json',
				'X-Signature': signature,
				'X-Public-Key': await exportPublicKey(keypair!.publicKey)
			},
			body: method !== 'GET' ? JSON.stringify(payload) : undefined
		});
		return res.json();
	} catch (error) {
		console.error(`Error during fetchEmails ${method} request:`, error);
		throw error;
	}
}
