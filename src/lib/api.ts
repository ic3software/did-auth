import { exportPublicKey, generateKeyPair, getKey, signRequest, storeKeys } from './crypto';

type ApiPayload = Record<string, string | number | boolean | null | undefined>;

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

async function fetchApi(method: string, endpoint: string, payload: ApiPayload = {}) {
	try {
		await loadKeyPair();
		const signature = await signRequest(payload, keypair!.privateKey);
		const res = await fetch(endpoint, {
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
		console.error(`Error during ${method} ${endpoint} request:`, error);
		throw error;
	}
}

export async function fetchUsers(method: string, payload: ApiPayload = {}) {
	return await fetchApi(method, '/api/users', payload);
}

export async function fetchEmails(method: string, payload: ApiPayload = {}) {
	return await fetchApi(method, '/api/emails', payload);
}

export async function fetchKeys(method: string, payload: ApiPayload = {}) {
	return await fetchApi(method, '/api/keys', payload);
}
