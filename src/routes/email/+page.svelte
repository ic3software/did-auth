<script lang="ts">
	import { fetchEmailReset } from '$lib/api';

	let email = '';
	let validEmail = false;
	let successMessage = '';
	let errorMessage = '';
	let isLoading = false;

	const validateEmail = (email: string) => {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return emailRegex.test(email);
	};

	$: validEmail = validateEmail(email);

	const handleSubmit = async () => {
		if (isLoading) return;

		successMessage = '';
		errorMessage = '';
		isLoading = true;

		try {
			const { success, error } = await fetchEmailReset('POST', { email });
			if (success) {
				successMessage = 'Email submitted successfully!';
			} else {
				errorMessage = error || 'Failed to submit email.';
				console.error(errorMessage);
			}
		} catch (error) {
			console.error('Error submitting email:', error);
			errorMessage = 'An error occurred while submitting the email.';
		} finally {
			isLoading = false;
		}
	};
</script>

<div class="flex h-screen items-center justify-center bg-gray-100 dark:bg-gray-900">
	<div class="w-full max-w-md rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
		{#if successMessage}
			<div
				class="mb-4 rounded-md bg-green-200 p-4 text-green-800 dark:bg-green-700 dark:text-green-200"
			>
				{successMessage}
			</div>
		{/if}
		{#if errorMessage}
			<div class="mb-4 rounded-md bg-red-200 p-4 text-red-800 dark:bg-red-700 dark:text-red-200">
				{errorMessage}
			</div>
		{/if}
		<form onsubmit={handleSubmit} class="space-y-4">
			<label class="block text-gray-700 dark:text-gray-300">
				Email:
				<input
					type="email"
					bind:value={email}
					class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300"
				/>
			</label>
			{#if email && !validEmail}
				<p class="text-red-500 dark:text-red-400">Invalid email format</p>
			{/if}

			<button
				type="submit"
				disabled={!validEmail || isLoading}
				class="w-full rounded-md bg-indigo-600 px-4 py-2 font-semibold text-white shadow-md hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-600"
			>
				{#if isLoading}
					Loading...
				{:else}
					Submit Email
				{/if}
			</button>
		</form>
	</div>
</div>
