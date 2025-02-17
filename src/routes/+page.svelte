<script lang="ts">
  import { onMount } from 'svelte';
  import { writable } from 'svelte/store';
  import * as ucans from "@ucans/ucans";

  const serviceDID = writable<string | null>(null);

  onMount(async () => {
    let storedKey = localStorage.getItem("ucan_key");
    let keypair;

    if (storedKey) {
      keypair = await ucans.EdKeypair.fromSecretKey(storedKey);
    } else {
      keypair = await ucans.EdKeypair.create({ exportable: true });
      const exportedKey = await keypair.export();
      console.log('exportedKey', exportedKey);
      localStorage.setItem("ucan_key", exportedKey);
    }

    serviceDID.set(keypair.did());
  });
</script>

<h1>Welcome to SvelteKit</h1>
<p>Visit <a href="https://svelte.dev/docs/kit">svelte.dev/docs/kit</a> to read the documentation</p>
<p>Service DID: {$serviceDID}</p>
