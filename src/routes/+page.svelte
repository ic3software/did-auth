<script lang="ts">
	import { page } from '$app/state';
	import { fetchEmails, fetchKeys, fetchTokens, fetchUsers } from '$lib/api';
	import type { Page } from '@sveltejs/kit';
	import { onMount } from 'svelte';

	interface CustomPageState extends Page {
		state: {
			message?: string;
		};
	}

	interface RegistrationToken {
		token: string;
		expiresAt: Date;
		expiresIn: number;
	}

	let typedPage = page as unknown as CustomPageState;

	let email = $state('');
	let emailList = $state<string[]>([]);
	let publicKeyList = $state<string[]>([]);
	let errorMessage = $state('');
	let userNotFound = $state(false);
	let userName = $state('');
	let infoMessage = $derived(
		userNotFound
			? 'Click Register to create an account.'
			: emailList.length === 0
				? 'No email found. Add your email above.'
				: ''
	);
	let tokens = $state<RegistrationToken[]>([]);
	let isGeneratingLink = $state(false);
	let tokenInfoMessage = $state('');
	let tokenErrorMessage = $state('');

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

	async function generateLink() {
		isGeneratingLink = true;
		tokenInfoMessage = '';
		try {
			const { data, success } = await fetchTokens('POST');
			if (success) {
				tokens = [
					...tokens,
					{
						token: data.token,
						expiresAt: new Date(data.expires_at),
						expiresIn: Math.floor((new Date(data.expires_at).getTime() - Date.now()) / 1000)
					}
				];
				tokenInfoMessage = 'Token has been generated.';
			} else {
				tokenErrorMessage = 'Failed to generate token.';
			}
		} catch (error) {
			tokenErrorMessage = 'An unexpected error occurred. Error: ' + error;
			console.error('Error generating token:', error);
		} finally {
			isGeneratingLink = false;
		}
	}

	function copyLinkToClipboard(token: string) {
		navigator.clipboard.writeText(`${window.location.origin}/setup?token=${token}`).then(() => {
			alert('Link copied!');
		});
	}

	onMount(async () => {
		try {
			const userResult = await fetchUsers('GET');

			if (userResult.success) {
				userName = userResult.data?.name || '';
				userNotFound = false;

				const [emailsResult, keysResult, tokensResult] = await Promise.all([
					fetchEmails('GET'),
					fetchKeys('GET'),
					fetchTokens('GET')
				]);

				if (emailsResult.success) {
					emailList = emailsResult.data?.map((item: { email: string }) => item.email) || [];
				} else {
					errorMessage = 'Failed to fetch email: ' + emailsResult.error;
					console.error(errorMessage);
				}

				if (keysResult.success) {
					publicKeyList =
						keysResult.data?.map((item: { publicKey: string }) => item.publicKey) || [];
				} else {
					errorMessage = 'Failed to fetch keys: ' + keysResult.error;
					console.error(errorMessage);
				}

				if (tokensResult.success) {
					tokens = tokensResult.data?.tokens || [];
					startTokenCountdown();
				} else {
					errorMessage = 'Failed to fetch tokens: ' + tokensResult.error;
					console.error(errorMessage);
				}
			} else if (userResult.error === 'User not found') {
				errorMessage = 'User not found';
				userNotFound = true;
			} else {
				console.error('Error fetching user:', userResult.error);
				errorMessage = 'Failed to fetch user name: ' + userResult.error;
			}
		} catch (error) {
			console.error('Error in onMount:', error);
			errorMessage = 'An unexpected error occurred. Error: ' + error;
		}
	});

	function startTokenCountdown() {
		setInterval(() => {
			tokens = tokens.map(token => {
				const expiresIn = Math.floor((new Date(token.expiresAt).getTime() - Date.now()) / 1000);
				return { ...token, expiresIn };
			});
		}, 1000);
	}
</script>

<div class="container mx-auto px-4 py-4 break-words">
	<h1 class="text-2xl font-bold text-gray-900 dark:text-white">
		<code class="font-mono">did:key</code>
		<span class="font-serif">Authentication <em>(Look Ma, No Passwords!)</em></span>
	</h1>
	{#if typedPage?.state?.message}
		<div
			class="mt-4 rounded-md bg-green-200 p-4 text-green-800 dark:bg-green-700 dark:text-green-200"
		>
			{typedPage.state.message}
		</div>
	{/if}
	{#if errorMessage && errorMessage.includes('Algorithm: Unrecognized name')}
		<div class="my-4 rounded-md bg-red-200 p-4 text-red-800 dark:bg-red-700 dark:text-red-200">
			Chrome and Chromium browsers do not support the Ed25519 algorithm by default. Here's how to
			enable it:
			<ol class="mt-2 list-decimal pl-4">
				<li>
					Open a new browser window and type <code class="font-mono">chrome://flags</code> in the address
					bar and press Enter.
				</li>
				<li>
					In the search box at the top of the <code class="font-mono">chrome://flags</code> page, type
					"Experimental Web Platform features".
				</li>
				<li>Find the "Experimental Web Platform features" flag.</li>
				<li>Click the dropdown menu next to it and select "Enabled".</li>
				<li>After enabling the flag, you will be prompted to restart the browser.</li>
				<li>Click "Relaunch" to restart and try loading this page again.</li>
			</ol>
		</div>
	{/if}
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
		<h2 class="mt-8 text-xl font-semibold text-gray-900 dark:text-white">
			{publicKeyList.length > 1 ? 'Your Public Keys' : 'Your Public Key'}
		</h2>
		<div class="mt-2 rounded-md bg-gray-200 p-4 dark:bg-gray-800">
			<div class="flex items-center justify-between">
				<ul class="mt-2 list-inside list-decimal">
					{#each publicKeyList as publicKey}
						<li class="mb-2 break-all">{publicKey}</li>
					{/each}
				</ul>
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
		<div class="mt-8">
			<button
				class="rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-800"
				onclick={generateLink}
				disabled={isGeneratingLink}
			>
				{isGeneratingLink ? 'Generating...' : 'Generate Registration Link'}
			</button>
			{#if tokenInfoMessage}
				<div class="mt-2 text-green-500">{tokenInfoMessage}</div>
			{/if}
			{#if tokenErrorMessage}
				<div class="mt-2 text-red-500">{tokenErrorMessage}</div>
			{/if}
		</div>
		<div class="mt-8">
			<h2 class="text-xl font-semibold text-gray-900 dark:text-white">Your Tokens</h2>
			<div class="mt-2 rounded-md bg-gray-200 p-4 dark:bg-gray-800">
				{#if tokens.length === 0}
					<p class="text-left text-gray-900 dark:text-white">No tokens available.</p>
				{:else}
					<ul>
						{#each tokens as { token, expiresIn }, index}
							<li class="mb-4 flex flex-col break-all text-gray-900 dark:text-white">
								<div class="flex items-start">
									<span>Token:</span>
									<span class="ml-2">{token}</span>
								</div>
								<div class="flex items-start mt-1">
									<span>Expires in:</span>
									{#if expiresIn > 0}
										<span class="ml-2">{expiresIn} seconds</span>
									{:else}
										<span class="ml-2 text-red-500">Expired</span>
									{/if}
								</div>
								{#if expiresIn > 0}
									<button
										class="mt-2 rounded-md bg-green-500 px-4 py-2 text-white hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-800"
										onclick={() => copyLinkToClipboard(token)}
									>
										Copy Link
									</button>
								{/if}
								{#if index < tokens.length - 1}
									<hr class="my-4 border-t border-gray-300 dark:border-gray-700" />
								{/if}
							</li>
						{/each}
					</ul>
				{/if}
			</div>
		</div>
	{/if}
</div>
