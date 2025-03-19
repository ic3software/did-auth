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
					state: { message: 'You have already signed in' },
					replaceState: true
				});
			} else {
				errorMessage = error || 'An error occurred';
			}
		} catch (err) {
			errorMessage = 'Key generation failed';
		}
	});
</script>

<div class="flex h-screen items-center justify-center bg-gray-100 dark:bg-gray-900">
	<div class="w-full max-w-md rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
		{#if errorMessage}
			<p class="mb-4 text-sm text-red-500 dark:text-red-400">{errorMessage}</p>
		{/if}
		<a
			class="block w-full rounded-md bg-blue-500 px-4 py-2 text-center text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-800"
			href="/"
		>
			Go to Home
		</a>
	</div>
</div>
