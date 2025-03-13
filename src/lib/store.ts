import { writable } from "svelte/store";

export const userPublicKey = writable<string | null>(null);
