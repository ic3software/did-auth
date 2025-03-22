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
	let currentPublicKey = $state<string>('');
	let publicKeyList = $state<string[]>([]);
	let errorMessage = $state('');
	let userName = $state('');
	let tokens = $state<RegistrationToken[]>([]);
	let isGeneratingLink = $state(false);
	let tokenInfoMessage = $state('');
	let tokenErrorMessage = $state('');
	let publicKeyInfoMessage = $state('');
	let publicKeyErrorMessage = $state('');

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
		tokenErrorMessage = '';

		try {
			const { data, success } = await fetchTokens('POST');
			if (success) {
				tokens = [
					{
						token: data.token,
						expiresAt: new Date(data.expires_at),
						expiresIn: Math.floor((new Date(data.expires_at).getTime() - Date.now()) / 1000)
					},
					...tokens
				];
				tokenInfoMessage =
					'A token was generated. Copy the link and open it in a browser on another device to access your account.';
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

	async function deleteToken(token: string) {
		tokenInfoMessage = '';
		tokenErrorMessage = '';

		try {
			const { success, error } = await fetchTokens('DELETE', { token });
			if (success) {
				tokens = tokens.filter((t) => t.token !== token);
				tokenInfoMessage = 'The access token has been deleted.';
			} else {
				tokenErrorMessage = error || 'Failed to delete token.';
				console.error(tokenErrorMessage);
			}
		} catch (error) {
			tokenErrorMessage = 'An unexpected error occurred while deleting token. Error: ' + error;
			console.error('Error deleting token:', error);
		}
	}

	function copyLinkToClipboard(token: string) {
		navigator.clipboard.writeText(`${window.location.origin}/access?token=${token}`).then(() => {
			alert('Link copied!');
		});
	}

	async function deletePublicKey(publicKey: string) {
		publicKeyInfoMessage = '';
		publicKeyErrorMessage = '';

		try {
			const { success, error } = await fetchKeys('DELETE', { publicKey });
			if (success) {
				publicKeyList = publicKeyList.filter((key) => key !== publicKey);
				publicKeyInfoMessage = 'The public key has been deleted.';
			} else {
				publicKeyErrorMessage = error || 'Failed to delete public key.';
				console.error(publicKeyErrorMessage);
			}
		} catch (error) {
			publicKeyErrorMessage =
				'An unexpected error occurred while deleting public key. Error: ' + error;
			console.error('Error deleting public key:', error);
		}
	}

	onMount(async () => {
		try {
			const userResult = await fetchUsers('GET');

			if (userResult.success) {
				userName = userResult.data?.name || '';

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
						keysResult.data?.publicKeys?.map((item: { publicKey: string }) => item.publicKey) || [];
					currentPublicKey = keysResult.data?.currentPublicKey || '';
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
				errorMessage = '';
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
			tokens = tokens.map((token) => {
				const expiresIn = Math.floor((new Date(token.expiresAt).getTime() - Date.now()) / 1000);
				return { ...token, expiresIn };
			});
		}, 1000);
	}
</script>

<div class="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900">
	<div class="my-4 w-full max-w-4xl rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
		<h1 class="text-2xl font-bold text-gray-900 dark:text-white">
			<code class="font-mono">did:key</code> Authentication
		</h1>
		<div class="font-serif text-lg"><em>(Look Ma, No Passwords!)</em></div>
		{#if typedPage?.state?.message}
			<div
				class="my-4 rounded-md bg-green-200 p-4 text-green-800 dark:bg-green-700 dark:text-green-200"
			>
				{typedPage.state.message}
			</div>
		{/if}
		{#if errorMessage}
			<div class="my-4 rounded-md bg-red-200 p-4 text-red-800 dark:bg-red-700 dark:text-red-200">
				{#if errorMessage && errorMessage.includes('Algorithm: Unrecognized name')}
					Chrome and Chromium browsers do not support the Ed25519 algorithm by default. Here's how
					to enable it:
					<ol class="list-decimal pl-4">
						<li>
							Open a new browser window and type <code class="font-mono">chrome://flags</code> in the
							address bar and press Enter.
						</li>
						<li>
							In the search box at the top of the <code class="font-mono">chrome://flags</code> page,
							type "Experimental Web Platform features".
						</li>
						<li>Find the "Experimental Web Platform features" flag.</li>
						<li>Click the dropdown menu next to it and select "Enabled".</li>
						<li>After enabling the flag, you will be prompted to restart the browser.</li>
						<li>Click "Relaunch" to restart and try loading this page again.</li>
					</ol>
				{:else}
					{errorMessage}
				{/if}
			</div>
		{/if}
		{#if !userName}
			{#if !errorMessage.includes('Algorithm: Unrecognized name')}
				<div class="mt-8">
					When you loaded this website, a public/private key pair was generated and stored safely in
					your browser.
				</div>
				<div class="my-4">Click the button below to create an account.</div>
				<div class="my-4">You will then be able to identify yourself here using this key pair.</div>
				<div class="mt-8 mb-2">
					<a
						href="/register"
						class="rounded-md bg-blue-500 px-4 py-2 text-center text-lg text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-800"
					>
						Register
					</a>
				</div>
			{/if}
		{:else}
			<div class="mt-8">
				<h2 class="text-xl font-semibold text-gray-900 dark:text-white">Welcome, {userName}!</h2>
			</div>
			<h2 class="mt-8 text-xl font-semibold text-gray-900 dark:text-white">
				{publicKeyList.length > 1 ? 'Your Public Keys' : 'Your Public Key'}
			</h2>
			{#if publicKeyList.length > 1}
				<div class="my-4">
					These are your public keys. You can disassociate keys from your other devices by deleting
					them, except for the key pair on this device.
				</div>
			{/if}
			{#if publicKeyList.length === 1}
				<div class="my-4">
					This is your public key. You can add other public keys to enable access to your account
					from other devices.
				</div>
			{/if}
			<div class="mt-2 rounded-md bg-gray-200 p-4 dark:bg-gray-700">
				<div class="flex w-full items-center justify-between">
					<ul class="mt-2 w-full list-inside list-decimal">
						{#each publicKeyList as publicKey, index}
							<li
								class="mb-2 flex w-full flex-col items-center justify-between font-mono break-all text-gray-900 dark:text-white"
							>
								<div
									class="flex w-full flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
								>
									<div class="w-full sm:flex-1">
										did:key:z{publicKey}
									</div>
									{#if publicKey !== currentPublicKey}
										<button
											class="w-full rounded-md bg-red-500 px-4 py-2 text-white hover:bg-red-700 sm:w-auto dark:bg-red-600 dark:hover:bg-red-800"
											onclick={() => deletePublicKey(publicKey)}
										>
											Delete
										</button>
									{:else}
										<button
											class="w-full cursor-not-allowed rounded-md bg-gray-500 px-4 py-2 text-white sm:w-auto"
											disabled
										>
											Current
										</button>
									{/if}
								</div>
								{#if index < publicKeyList.length - 1}
									<hr class="mt-4 mb-2 w-full border-2 border-gray-300 dark:border-gray-600" />
								{/if}
							</li>
						{/each}
					</ul>
				</div>
			</div>
			{#if publicKeyInfoMessage}
				<div class="mt-2 text-green-500">{publicKeyInfoMessage}</div>
			{/if}
			{#if publicKeyErrorMessage}
				<div class="mt-2 text-red-500">{publicKeyErrorMessage}</div>
			{/if}
			<h2 class="mt-8 text-xl font-semibold text-gray-900 dark:text-white">
				{tokens.length > 1 ? 'Access Tokens' : 'Access Token'}
			</h2>
			<div class="my-4">
				Generate an access token to sign in to your account from another device.
			</div>
			<div class="mt-2 rounded-md bg-gray-200 p-4 dark:bg-gray-700">
				{#if tokens.length === 0}
					<p class="text-left text-gray-900 dark:text-white">No token available.</p>
				{:else}
					<ul class="mt-2">
						{#each tokens as { token, expiresIn }, index}
							<li class="flex flex-col break-all text-gray-900 dark:text-white">
								<div class="grid grid-cols-1 items-center gap-4 sm:grid-cols-[1fr_auto_auto]">
									<div>
										<div class="flex items-center">
											<span class="whitespace-nowrap">Token:</span>
											<span class="ml-2 truncate">{token}</span>
										</div>
										<div class="flex items-center">
											<span class="whitespace-nowrap">Expires in:</span>
											{#if expiresIn > 0}
												<span class="ml-2 whitespace-nowrap">{expiresIn} seconds</span>
											{:else}
												<span class="ml-2 whitespace-nowrap text-red-500">Expired</span>
											{/if}
										</div>
									</div>
									<div class="flex flex-col gap-2 sm:flex-row sm:gap-4">
										{#if expiresIn > 0}
											<button
												class="w-full rounded-md bg-green-500 px-4 py-2 whitespace-nowrap text-white hover:bg-green-700 sm:w-auto dark:bg-green-600 dark:hover:bg-green-800"
												onclick={() => copyLinkToClipboard(token)}
											>
												Copy Link
											</button>
										{:else}
											<div></div>
										{/if}
										<button
											class="w-full rounded-md bg-red-500 px-4 py-2 whitespace-nowrap text-white hover:bg-red-700 sm:w-auto dark:bg-red-600 dark:hover:bg-red-800"
											onclick={() => deleteToken(token)}
										>
											Delete Token
										</button>
									</div>
								</div>
								{#if index < tokens.length - 1}
									<hr class="my-4 border-t border-gray-300 dark:border-gray-600" />
								{/if}
							</li>
						{/each}
					</ul>
				{/if}
			</div>
			<div class="mt-4">
				{#if tokens.length === 0}
					<button
						class="rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-800"
						onclick={generateLink}
						disabled={isGeneratingLink}
					>
						{isGeneratingLink ? 'Generating...' : 'Generate Access Token'}
					</button>
				{/if}
				{#if tokenInfoMessage}
					<div class="mt-2 text-green-500">{tokenInfoMessage}</div>
				{/if}
				{#if tokenErrorMessage}
					<div class="mt-2 text-red-500">{tokenErrorMessage}</div>
				{/if}
			</div>
			<h2 class="mt-8 text-xl font-semibold text-gray-900 dark:text-white">Your Email</h2>
			<div class="my-4">
				{#if publicKeyList.length > 1}
					Add an email address to reset access to your account if you accidentally erase all of your
					key pairs from your devices.
				{/if}
				{#if publicKeyList.length === 1}
					Add an email address to reset access to your account if you accidentally erase your key
					pair from this device.
				{/if}
			</div>
			<div class="mt-2 rounded-md bg-gray-200 p-4 dark:bg-gray-700">
				{#if emailList.length === 0}
					<div class="flex flex-col items-center justify-between gap-2 sm:flex-row sm:gap-0">
						<input
							type="email"
							bind:value={email}
							class="w-full rounded-md border p-2 text-gray-900 sm:w-3/4 dark:bg-gray-600 dark:text-white"
							placeholder="Enter your email"
						/>
						<button
							class="w-full rounded-md bg-green-500 px-4 py-2 text-white hover:bg-green-700 sm:w-auto dark:bg-green-600 dark:hover:bg-green-800"
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
		{/if}
	</div>
</div>
