<script lang="ts">
	import { goto } from '$app/navigation';
	import { fetchKeys } from '$lib/api';
	import { onMount } from 'svelte';

	let token;
	let errorMessage = '';

	onMount(async () => {
		const params = new URLSearchParams(window.location.search);
		token = params.get('token');

		if (!token) {
			errorMessage = 'Invalid invitation link';
			return;
		}

		try {
			const { success, error } = await fetchKeys('POST', { token });

			if (success) {
				goto('/', {
					state: { message: 'You are now signed in to your account from this device.' },
					replaceState: true
				});
			} else {
				errorMessage = error || 'An error occurred';
			}
		} catch (error) {
			console.error('Error posting key:', error);
			errorMessage = 'Key linking failed';
		}
	});
</script>

<div class="flex h-screen items-center justify-center bg-gray-100 dark:bg-gray-900">
	<div class="w-full max-w-md rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
		{#if errorMessage}
			<div class="mb-4 rounded-md bg-red-200 p-4 text-red-800 dark:bg-red-700 dark:text-red-200">
				{errorMessage}
			</div>
		{/if}
		<a
			class="block w-full rounded-md bg-blue-500 px-4 py-2 text-center text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-800"
			href="/"
		>
			Go to Home
		</a>
	</div>
</div>
