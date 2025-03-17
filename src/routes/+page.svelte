<script lang="ts">
	import { onMount } from 'svelte';
	import { fetchEmails, fetchUsers } from '$lib/api';

	let email = $state('');
	let emailList = $state<string[]>([]);
	let errorMessage = $state('');
	let publicKey = $state<string | null>('');
	let userNotFound = $state(false);
	let userName = $state('');
	let copyButtonText = $state('Copy');
	let infoMessage = $derived(
		userNotFound
			? 'Click Register to create an account.'
			: emailList.length === 0
				? 'No email found. Add your email above.'
				: ''
	);

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
		try {
			const { success, data, error } = await fetchEmails('GET');
			if (success) {
				emailList = data?.map((item: { email: string }) => item.email) || [];
			} else {
				if (error === 'User not found') {
					userNotFound = true;
				} else {
					errorMessage = 'Failed to fetch email: ' + error;
					console.error(errorMessage);
				}
			}
		} catch (error) {
			errorMessage = 'An unexpected error occurred while fetching emails. Error: ' + error;
			console.error('Error fetching emails:', error);
		}

		try {
			const { success, data, error } = await fetchUsers('GET');
			if (success) {
				userName = data?.name || '';
				userNotFound = false;
			} else {
				if (error === 'User not found') {
					userNotFound = true;
				} else {
					errorMessage = 'Failed to fetch user name: ' + error;
					console.error(errorMessage);
				}
			}
		} catch (error) {
			errorMessage = 'An unexpected error occurred while fetching user name. Error: ' + error;
			console.error('Error fetching user name:', error);
		}

		publicKey = localStorage.getItem('public_key');
	});
</script>

<div class="container mx-auto px-4 py-4 break-words">
	<h1 class="text-2xl font-bold text-gray-900 dark:text-white">
		<code class="font-mono">did:key</code>
		<span class="font-serif">Authentication <em>(Look Ma, No Passwords!)</em></span>
	</h1>
	{#if !userName}
		<div class="mt-4">
			<a
				href="/register"
				class="mt-8 rounded-md bg-blue-500 px-4 py-2 text-center text-lg text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-800"
			>
				Register
			</a>
		</div>
	{:else}
		<div class="mt-8">
			<h2 class="text-xl font-semibold text-gray-900 dark:text-white">Welcome, {userName}!</h2>
		</div>
		<h2 class="mt-8 text-xl font-semibold text-gray-900 dark:text-white">Your Public Key</h2>
		<div class="mt-2 rounded-md bg-gray-200 p-4 dark:bg-gray-800">
			<div class="flex items-center justify-between">
				<p class="overflow-x-auto font-mono text-gray-900 dark:text-white">{publicKey}</p>
				<button
					class="ml-2 rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-800"
					onclick={() => {
						if (publicKey) {
							navigator.clipboard.writeText(publicKey);
							copyButtonText = 'Copied!';
							setTimeout(() => {
								copyButtonText = 'Copy';
							}, 2000);
						}
					}}
				>
					{copyButtonText}
				</button>
			</div>
		</div>
		<h2 class="mt-8 text-xl font-semibold text-gray-900 dark:text-white">Your Email</h2>
		<div class="mt-2 rounded-md bg-gray-200 p-4 dark:bg-gray-800">
			{#if emailList.length === 0}
				<div class="flex items-center justify-between">
					<input
						type="email"
						bind:value={email}
						class="rounded-md border p-2 text-gray-900 sm:w-md dark:bg-gray-700 dark:text-white"
						placeholder="Enter your email"
					/>
					<button
						class="rounded-md bg-green-500 px-4 py-2 text-white hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-800"
						onclick={addEmail}
					>
						Add Email
					</button>
				</div>
			{:else}
				<ul>
					{#each emailList as email, index}
						<li class="flex items-center justify-between text-gray-900 dark:text-white">
							<span>{email}</span>
							<button
								class="rounded-md bg-red-500 px-4 py-2 text-white hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-800"
								onclick={() => removeEmail(index)}
							>
								Delete
							</button>
						</li>
					{/each}
				</ul>
			{/if}
		</div>
		{#if errorMessage}
			<div class="mt-2 text-red-500">{errorMessage}</div>
		{/if}
		{#if infoMessage}
			<div class="mt-2 text-blue-500">{infoMessage}</div>
		{/if}
	{/if}
</div>
