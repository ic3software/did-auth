<script lang="ts">
	import { onMount } from 'svelte';
	import { writable } from 'svelte/store';
	import * as ucans from '@ucans/ucans';

	const serviceDID = writable<string | null>(null);
	const audienceKeypair = writable<ucans.EdKeypair | null>(null);

	let token = $state('');
	let verificationResult = $state('');
	let keypair = $state<ucans.EdKeypair | null>(null);
	let challenge = $state('');
	let challengeResult = $state('');

	onMount(async () => {
		let storedKey = await getFromIndexedDB('ucan_key');

		if (storedKey) {
			keypair = storedKey;
			serviceDID.set(keypair.did());
		}

		// Generate a keypair for the audience
		const audienceKey = await ucans.EdKeypair.create({ exportable: true });
		audienceKeypair.set(audienceKey);
	});

	const DB_NAME = "UCAN_DB";
	const STORE_NAME = "UCAN_KEYS";

	// IndexDB
	async function openDB(): Promise<IDBDatabase> {
		return new Promise((resolve, reject) => {
			const request = indexedDB.open(DB_NAME, 1);

			request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
				const db = (event.target as IDBOpenDBRequest).result;
				if (!db.objectStoreNames.contains(STORE_NAME)) {
					db.createObjectStore(STORE_NAME);
				}
			};

			request.onsuccess = () => {
				resolve(request.result);
			};

			request.onerror = (event) => {
				console.error("IndexedDB open failed", (event.target as IDBRequest).error);
				reject(new Error("IndexedDB open failed"));
			};
		});
	}

	async function saveToIndexedDB(key: string, value: ucans.EdKeypair): Promise<void> {
		const db = await openDB();
		const exportedKey = await value.export();
		return new Promise((resolve, reject) => {
			const tx = db.transaction(STORE_NAME, "readwrite");
			const store = tx.objectStore(STORE_NAME);
			store.put(exportedKey, key);
			tx.oncomplete = () => resolve();
			tx.onerror = (event) => reject((event.target as IDBRequest).error);
		});
	}

	async function getFromIndexedDB(key: string): Promise<ucans.EdKeypair | null> {
		const db = await openDB(); 
		return new Promise((resolve, reject) => {
			const tx = db.transaction(STORE_NAME, "readonly");
			const store = tx.objectStore(STORE_NAME);
			const getRequest = store.get(key);

			getRequest.onsuccess = async () => {
				if (getRequest.result) {
					const importedKey = await ucans.EdKeypair.fromSecretKey(getRequest.result);
					resolve(importedKey);
				} else {
					resolve(null);
				}
			};
			getRequest.onerror = (event) => reject((event.target as IDBRequest).error);
		});
	}

	async function generateKeypair() {
		let storedKey = await getFromIndexedDB('ucan_key');

		if (storedKey) {
			keypair = storedKey;
		} else {
			keypair = await ucans.EdKeypair.create({ exportable: true });
			await saveToIndexedDB('ucan_key', keypair);
		}

		serviceDID.set(keypair.did());
	}

	async function generateToken() {
		if ($serviceDID === null) {
			console.error('serviceDID is not set');
			return;
		}
		if (keypair === null) {
			console.error('keypair is not set');
			return;
		}
		if ($audienceKeypair === null) {
			console.error('audienceKeypair is not set');
			return;
		}

		const ucan = await ucans.build({
			audience: $audienceKeypair.did(),
			issuer: keypair,
			capabilities: [
				{
					with: { scheme: 'mailto', hierPart: 'test@example.com' },
					can: { namespace: 'msg', segments: ['SEND'] }
				}
			]
		});

		token = ucans.encode(ucan);
	}

	async function verifyToken() {
        if ($serviceDID === null) {
			console.error('serviceDID is not set');
			return;
		}
		if (token === '') {
			console.error('token is not set');
			return;
		}
        if ($audienceKeypair === null) {
			console.error('audienceKeypair is not set');
			return;
		}

		const result = await ucans.verify(token, {
			audience: $audienceKeypair.did(),
			requiredCapabilities: [
				{
					capability: { can: { namespace: 'msg', segments: ['SEND'] }, with: { scheme: 'mailto', hierPart: 'test@example.com' } },
					rootIssuer: $serviceDID ?? ''
				}
			],
			isRevoked: async () => false
		});

		verificationResult = result.ok ? 'success' : 'failure';
	}

	async function challengeResponseVerification() {
		if (keypair === null) {
			console.error('keypair is not set');
			return;
		}

		challenge = crypto.randomUUID();

		const payload: ucans.UcanPayload<string> = {
			iss: $serviceDID ?? '',
			aud: $audienceKeypair?.did() ?? '',
			exp: Math.floor(Date.now() / 1000) + 60 * 5,
			nnc: challenge,
			att: [],
			prf: []
		};

		const signedChallenge = await ucans.signWithKeypair(
			payload,
			keypair
		);

		try {
			const result = await ucans.validate(ucans.encode(signedChallenge));
			console.log('result', result);
			if (result.payload.nnc === challenge) {
				challengeResult = 'validation success';
			} else {
				challengeResult = 'validation failed, nnc mismatch';
			}
		} catch (error) {
			console.error('error', error);
			challengeResult = 'validation failed';
		}
	}
</script>

<div class="px-4 py-4">
	<h1>Welcome to SvelteKit</h1>
	<p>Visit <a href="https://svelte.dev/docs/kit">svelte.dev/docs/kit</a> to read the documentation</p>
	<p>Service DID: {$serviceDID}</p>
	<p>Audience DID: {$audienceKeypair?.did()}</p>
	<button onclick={generateKeypair} disabled={$serviceDID !== null} class="cursor-pointer bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50">Generate EdKeypair</button>
	<button onclick={generateToken} class="cursor-pointer bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Generate UCAN Token</button>
	<p><strong>UCAN Token:</strong> {token}</p>
	<button onclick={verifyToken} disabled={!token} class="cursor-pointer bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50">Verify UCAN Token</button>
	<p><strong>Result:</strong> {verificationResult}</p>
	<button onclick={challengeResponseVerification} class="cursor-pointer bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded">Challenge-Response Verification</button>
	<p><strong>Challenge:</strong> {challenge}</p>
	<p><strong>Challenge Result:</strong> {challengeResult}</p>
</div>
