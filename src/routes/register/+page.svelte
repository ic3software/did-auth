<script lang="ts">
	import { goto } from '$app/navigation';
	import { fetchKeys, fetchUsers } from '$lib/api';
	import { onMount } from 'svelte';

	let name = $state('');
	let errorMessage = $state('');
	let isRegistering = $state(false);

	async function register() {
		if (!name.trim()) {
			errorMessage = 'Please enter your name';
			return;
		}

		try {
			isRegistering = true;
			const { success, error } = await fetchUsers('POST', { name });
			if (!success) {
				errorMessage = `Error: ${error}`;
				return;
			}
			goto('/');
		} catch (error) {
			console.error('Error during registration:', error);
			errorMessage = 'An error occurred during registration';
		} finally {
			isRegistering = false;
		}
	}

	onMount(async () => {
		try {
			const { success } = await fetchKeys('GET');
			if (success) {
				goto('/', {
					state: { message: 'You have already signed in' },
					replaceState: true
				});
			}
		} catch (error) {
			errorMessage = 'An unexpected error occurred while verifying login status. Error: ' + error;
			console.error('Error verifying login status:', error);
		}
	});
</script>

<div class="flex h-screen items-center justify-center bg-gray-100 dark:bg-gray-900">
	<div class="w-full max-w-sm rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
		<h2 class="mb-4 text-center text-2xl font-bold dark:text-white">Register</h2>
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
			onclick={register}
			disabled={isRegistering}
		>
			{isRegistering ? 'Registering...' : 'Register'}
		</button>
	</div>
</div>
