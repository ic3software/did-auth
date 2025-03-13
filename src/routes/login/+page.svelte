<script lang="ts">
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';
    import { userPublicKey } from '$lib/store';
    import { generateKeyPair, storeKeys, getKey, signRequest, exportPublicKey } from '$lib/crypto';
  
    let name = $state('');
    let errorMessage = $state('');
    let isLoggingIn = $state(false);

    async function login() {
        isLoggingIn = true;
        try {
            let storedKey = await getKey('privateKey');
            let keypair: { publicKey: CryptoKey; privateKey: CryptoKey } | null = null;
            if (storedKey) {
                keypair = {
                    publicKey: await getKey('publicKey') as CryptoKey,
                    privateKey: storedKey
                };
            } else {
                keypair = await generateKeyPair();
                await storeKeys(keypair.publicKey, keypair.privateKey);
            }

            const payload = { name };
            const signature = await signRequest(payload, keypair.privateKey);

            const res = await fetch('/api/users', {
                method: 'POST',
                headers: {
                    "Content-Type": "application/json",
                    "X-Signature": signature,
                    "X-Public-Key": await exportPublicKey(keypair.publicKey)
                },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (res.status === 400) {
                errorMessage = 'Error: ' + data?.error;
                return;
            }

            if (data?.data?.public_key) {
                userPublicKey.set(data.data.public_key);
                localStorage.setItem('public_key', data.data.public_key);
                goto('/');
            } else {
                errorMessage = 'Error during login. Please try again.';
                return;
            }
        } catch (error) {
            console.error('Error during login:', error);
            errorMessage = 'An error occurred during login. Please try again.';
        } finally {
            isLoggingIn = false;
        }
    }
  
    onMount(() => {
        if (localStorage.getItem('public_key')) {
            goto('/');
        }
    });
</script>
  
<div class="flex h-screen items-center justify-center bg-gray-100">
    <div class="w-full max-w-sm p-6 bg-white shadow-md rounded-lg">
        <h2 class="text-2xl font-bold mb-4 text-center">Login</h2>
        <input
            type="text"
            bind:value={name}
            class="w-full p-2 border rounded-md"
            placeholder="Enter your name"
        />
        {#if errorMessage}
            <div class="text-red-500 text-sm mt-2">{errorMessage}</div>
        {/if}
        <button
            class="mt-4 w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-700"
            onclick={login}
            disabled={isLoggingIn}
        >
            {isLoggingIn ? 'Logging in...' : 'Login'}
        </button>
    </div>
</div>