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
				errorMessage = `${error}`;
				return;
			}
			goto('/', {
				state: {
					message:
						'Your account has been created. Try closing and reopening the browser. You will be logged in automatically!'
				},
				replaceState: true
			});
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
	<div class="w-full max-w-lg rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
		{#if errorMessage}
			<div class="mb-4 rounded-md bg-red-200 p-4 text-red-800 dark:bg-red-700 dark:text-red-200">
				{errorMessage}
			</div>
		{/if}
		<h2 class="text-center text-2xl font-bold dark:text-white">Create Account</h2>
		<div class="my-4">Enter a username to identify you on this website.</div>
		<div class="my-4">
			Your username will be linked to the key pair that was created and stored in your browser.
		</div>
		<input
			type="text"
			bind:value={name}
			class="mb-2 w-full rounded-md border p-2 dark:bg-gray-700 dark:text-white"
			placeholder="Enter your name"
		/>
		<button
			class="mt-4 mb-2 w-full rounded-md bg-blue-500 py-2 text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-800"
			onclick={register}
			disabled={isRegistering}
		>
			{isRegistering ? 'Registering...' : 'Register'}
		</button>
	</div>
</div>
