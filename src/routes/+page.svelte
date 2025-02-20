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
		let storedKey = localStorage.getItem('ucan_key');

		if (storedKey) {
			keypair = ucans.EdKeypair.fromSecretKey(storedKey);
		} else {
			keypair = await ucans.EdKeypair.create({ exportable: true });
			const exportedKey = await keypair.export();
			localStorage.setItem('ucan_key', exportedKey);
		}

		serviceDID.set(keypair.did());

		// Generate a keypair for the audience
		const audienceKey = await ucans.EdKeypair.create({ exportable: true });
		audienceKeypair.set(audienceKey);
	});

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
	<button onclick={generateToken} class="cursor-pointer bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">generate UCAN Token</button>
	<p><strong>UCAN Token:</strong> {token}</p>
	<button onclick={verifyToken} disabled={!token} class="cursor-pointer bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50">verify UCAN Token</button>
	<p><strong>Result:</strong> {verificationResult}</p>
	<button onclick={challengeResponseVerification} class="cursor-pointer bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded">Challenge-Response Verification</button>
	<p><strong>Challenge:</strong> {challenge}</p>
	<p><strong>Challenge Result:</strong> {challengeResult}</p>
</div>
