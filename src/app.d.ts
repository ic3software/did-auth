declare global {
	namespace App {
		interface Platform {
			env: {
				DB: D1Database;
			};
			context: {
				waitUntil(promise: Promise<unknown>): void;
			};
			caches: CacheStorage & { default: Cache };
		}
	}

	interface CryptoKeyPair {
		privateKey: CryptoKey;
		publicKey: CryptoKey;
	}
}

export {};
