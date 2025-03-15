<script lang="ts">
	import { onMount } from 'svelte';
	import { fetchEmails, fetchUsers } from '$lib/api';

	let email = $state('');
	let emailList = $state<string[]>([]);
	let hasPublicKey = $state(false);
	let errorMessage = $state('');
	let userName = $state('');

	async function addEmail() {
		if (!email) return;
		try {
			const { success, error } = await fetchEmails('POST', { email });
			if (success) {
				emailList = [...emailList, email];
				email = '';
				errorMessage = '';
			} else {
				errorMessage = error || 'Failed to add email.';
				console.error(errorMessage);
			}
		} catch (error) {
			errorMessage = 'An unexpected error occurred. Error: ' + error;
			console.error('Error adding email:', error);
		}
	}

	async function removeEmail(index: number) {
		try {
			const emailToRemove = emailList[index];
			const { success, error } = await fetchEmails('DELETE', { email: emailToRemove });
			if (success) {
				emailList = emailList.filter((_, i) => i !== index);
				errorMessage = '';
			} else {
				errorMessage = error || 'Failed to remove email.';
				console.error(errorMessage);
			}
		} catch (error) {
			errorMessage = 'An unexpected error occurred while removing email. Error: ' + error;
			console.error('Error removing email:', error);
		}
	}

	onMount(async () => {
		// try fetch user name here
		try {
			const { success, data, error } = await fetchUsers('GET');
			if (success) {
				userName = data?.name || '';
			} else {
				errorMessage = error || 'Failed to fetch user name.';
				console.error(errorMessage);
			}
		} catch (error) {
			errorMessage = 'An unexpected error occurred while fetching user name. Error: ' + error;
			console.error('Error fetching user name:', error);
		}

		try {
			const { success, data, error } = await fetchEmails('GET');
			if (success) {
				emailList = data?.map((item: { email: string }) => item.email) || [];
			} else {
				errorMessage = error || 'Failed to fetch emails.';
				console.error(errorMessage);
			}
		} catch (error) {
			errorMessage = 'An unexpected error occurred while fetching emails. Error: ' + error;
			console.error('Error fetching emails:', error);
		}

		hasPublicKey = !!localStorage.getItem('public_key');
	});
</script>

<div class="container mx-auto px-4 py-4 break-words">
	<h1 class="text-2xl font-bold text-gray-900 dark:text-white">
		<code>did:key</code> Authentication <em>(Look Ma, No Passwords!)</em>
	</h1>
	{#if !hasPublicKey}
		<div class="mt-4">
			<a
				href="/register"
				class="mt-4 rounded-md bg-blue-500 px-4 py-2 text-center text-lg text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-800"
			>
				Register
			</a>
		</div>
	{/if}
	{#if userName}
		<div class="mt-4">
			<h2 class="text-xl font-semibold text-gray-900 dark:text-white">Welcome, {userName}!</h2>
		</div>
		<div class="mt-8">
			<h2 class="text-xl font-semibold text-gray-900 dark:text-white">Your Email List</h2>
			{#if errorMessage}
				<div class="mt-2 text-red-500">{errorMessage}</div>
			{/if}
			<div class="mt-4">
				<input
					type="email"
					bind:value={email}
					class="w-md rounded-md border p-2 text-gray-900 dark:bg-gray-700 dark:text-white"
					placeholder="Enter your email"
				/>
				<button
					class="mt-2 rounded-md bg-green-500 px-4 py-2 text-white hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-800"
					onclick={addEmail}
				>
					Add Email
				</button>
			</div>
			<ul class="mt-4">
				{#each emailList as email, index}
					<li class="flex items-center justify-between border-b p-2 text-gray-900 dark:text-white">
						<span>{email}</span>
						<button
							class="rounded-md bg-red-500 px-2 py-1 text-white hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-800"
							onclick={() => removeEmail(index)}
						>
							Delete
						</button>
					</li>
				{/each}
			</ul>
		</div>
	{/if}
</div>
