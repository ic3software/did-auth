// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}

	// Add Web Crypto API types if they're not already defined
	interface CryptoKeyPair {
		privateKey: CryptoKey;
		publicKey: CryptoKey;
	}
}

export {};
