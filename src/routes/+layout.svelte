<script lang="ts">
	import '../app.css';

	let { children } = $props();

	let darkMode = $state(false);

	$effect(() => {
		if (typeof window !== 'undefined') {
			darkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;

			const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
			const handleChange = (e: MediaQueryListEvent) => {
				darkMode = e.matches;
			};

			mediaQuery.addEventListener('change', handleChange);

			document.documentElement.classList.toggle('dark', darkMode);

			return () => {
				mediaQuery.removeEventListener('change', handleChange);
			};
		}
	});
</script>

<div
	class="min-h-screen bg-white text-gray-900 transition-colors duration-200 dark:bg-gray-900 dark:text-gray-100"
>
	{@render children()}
</div>
