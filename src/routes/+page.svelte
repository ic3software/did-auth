<script lang="ts">
	import { generateKeyPair, storeKeys, getKey, signData, verifySignature } from '$lib/crypto';
	import { onMount } from 'svelte';

	let keypair = $state<CryptoKeyPair | null>(null);
	let message = "Hello, secure world!";
	let signature: Uint8Array | null = $state(null);
	let signatureVerificationResult: boolean | null = $state(null);
	let keyExists: boolean = $state(false);
	let publicKeyString: string | null = $state(null);

	async function checkStoredKey() {
		let storedKey = await getKey('privateKey');
		keyExists = !!storedKey;
		if (keyExists) {
			keypair = { publicKey: await getKey('publicKey') as CryptoKey, privateKey: storedKey as CryptoKey };
		}
	}

	async function generateKeypair() {
		if (!keyExists) {
			keypair = await generateKeyPair();
			await storeKeys(keypair.publicKey, keypair.privateKey);
			keyExists = true;
		}
	}

	async function handleSignData() {
		signature = await signData(message);
		console.log('signature', signature);

		if (keypair && keypair.publicKey) {
			const exportedKey = await window.crypto.subtle.exportKey('spki', keypair.publicKey);
			publicKeyString = btoa(String.fromCharCode(...new Uint8Array(exportedKey)));
			console.log('publicKey', publicKeyString);
		}
	}

	async function handleVerifySignature() {
		if (!signature) {
			alert("No signature available for verification.");
			return;
		}
		if (!publicKeyString) {
			alert("No public key available for verification.");
			return;
		}
		
		signatureVerificationResult = await verifySignature(message, signature, publicKeyString);
	}

	onMount(() => {
		checkStoredKey();
	});
</script>

<div class="container mx-auto px-4 py-4 break-words">
	<h1 class="text-2xl font-bold">Web Crypto API + IndexedDB</h1>
	{#if keyExists}
		<p class="text-green-500 font-bold">Key pair already exists.</p>
	{:else}
		<button onclick={generateKeypair} class="cursor-pointer bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50">Generate Keypair</button>
	{/if}
	<p><strong>Message to sign:</strong> {message}</p>
	<button onclick={handleSignData} class="cursor-pointer bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded">Sign Message</button>
	<p><strong>Signature:</strong> <span style="word-wrap: break-word;">{signature?.toString()}</span></p>
	<p><strong>Public Key:</strong> <span style="word-wrap: break-word;">{publicKeyString}</span></p>
	<button onclick={handleVerifySignature} class="cursor-pointer bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">Verify Signature</button>
	<p><strong>Verification Result:</strong> {signatureVerificationResult ? "Valid ✅" : "Invalid ❌"}</p>
</div>
