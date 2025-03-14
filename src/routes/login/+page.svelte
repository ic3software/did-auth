<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { fetchUsers } from '$lib/api';

	let name = $state('');
	let errorMessage = $state('');
	let isLoggingIn = $state(false);

	async function login() {
        if (!name.trim()) {
			errorMessage = 'Please enter your name';
			return;
		}

		isLoggingIn = true;
		const { success, error, data } = await fetchUsers('POST', { name });
		if (!success) {
			errorMessage = `Error: ${error}`;
		}
		if (data?.public_key) {
			localStorage.setItem('public_key', data.public_key);
		}
		isLoggingIn = false;
        goto('/');
	}

	onMount(() => {
		if (localStorage.getItem('public_key')) {
			goto('/');
		}
	});
</script>

<div class="flex h-screen items-center justify-center bg-gray-100 dark:bg-gray-900">
	<div class="w-full max-w-sm rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
		<h2 class="mb-4 text-center text-2xl font-bold dark:text-white">Login</h2>
		<input
			type="text"
			bind:value={name}
			class="w-full rounded-md border p-2 dark:bg-gray-700 dark:text-white"
			placeholder="Enter your name"
		/>
		{#if errorMessage}
			<div class="mt-2 text-sm text-red-500 dark:text-red-400">{errorMessage}</div>
		{/if}
		<button
			class="mt-4 w-full rounded-md bg-blue-500 py-2 text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-800"
			onclick={login}
			disabled={isLoggingIn}
		>
			{isLoggingIn ? 'Logging in...' : 'Login'}
		</button>
	</div>
</div>
