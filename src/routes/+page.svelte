<script lang="ts">
	import { onMount } from 'svelte';
	import { fetchEmails } from '$lib/api';

	let email = $state('');
	let emailList = $state<string[]>([]);

	async function addEmail() {
		if (!email) return;
		const data = await fetchEmails('POST', { email });
		if (data?.success) {
			emailList = [...emailList, email];
			email = '';
		} else {
			console.error('Failed to add email.');
		}
	}

	async function removeEmail(index: number) {
		const emailToRemove = emailList[index];
		const data = await fetchEmails('DELETE', { email: emailToRemove });
		if (data?.success) {
			emailList = emailList.filter((_, i) => i !== index);
		} else {
			console.error('Failed to remove email.');
		}
	}

	onMount(async () => {
		const data = await fetchEmails('GET');
		if (data?.success) {
			emailList = data.data.map((item: { email: string }) => item.email);
		}
	});
</script>

<div class="container mx-auto px-4 py-4 break-words">
	<h1 class="text-2xl font-bold dark:text-white">Web Crypto API + IndexedDB</h1>
	<div class="mt-4">
		<a
			href="/login"
			class="mt-4 rounded-md bg-blue-500 px-4 py-2 text-center text-lg text-white hover:bg-blue-700"
		>
			Login
		</a>
	</div>

	<div class="mt-8">
		<h2 class="text-xl font-semibold dark:text-white">Your Email List</h2>
		<div class="mt-4">
			<input
				type="email"
				bind:value={email}
				class="w-md rounded-md border p-2"
				placeholder="Enter your email"
			/>
			<button
				class="mt-2 rounded-md bg-green-500 px-4 py-2 text-white hover:bg-green-700"
				onclick={addEmail}
			>
				Add Email
			</button>
		</div>
		<ul class="mt-4">
			{#each emailList as email, index}
				<li class="flex items-center justify-between border-b p-2">
					<span>{email}</span>
					<button
						class="rounded-md bg-red-500 px-2 py-1 text-white hover:bg-red-700"
						onclick={() => removeEmail(index)}
					>
						Delete
					</button>
				</li>
			{/each}
		</ul>
	</div>
</div>
