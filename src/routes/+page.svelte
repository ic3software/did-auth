<script lang="ts">
	import { onMount } from 'svelte';
	import { writable } from 'svelte/store';
	import * as ucans from '@ucans/ucans';

	const serviceDID = writable<string | null>(null);

	let token = $state('');
	let verificationResult = $state('');
	let keypair = $state<ucans.EdKeypair | null>(null);

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

		const ucan = await ucans.build({
			audience: $serviceDID ?? '',
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

		const result = await ucans.verify(token, {
			audience: $serviceDID ?? '',
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
</script>

<div class="px-4 py-4">
	<h1>Welcome to SvelteKit</h1>
	<p>Visit <a href="https://svelte.dev/docs/kit">svelte.dev/docs/kit</a> to read the documentation</p>
	<p>Service DID: {$serviceDID}</p>

	<button onclick={generateToken} class="cursor-pointer bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">generate UCAN Token</button>
	<p><strong>UCAN Token:</strong> {token}</p>
	<button onclick={verifyToken} disabled={!token} class="cursor-pointer bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50">verify UCAN Token</button>
	<p><strong>Result:</strong> {verificationResult}</p>
</div>
