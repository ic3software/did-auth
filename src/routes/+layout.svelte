<script lang="ts">
	import '../app.css';
	let { children } = $props();

	// Check if user prefers dark mode
	let darkMode = $state(false);

	$effect(() => {
		// Check for system dark mode preference
		if (typeof window !== 'undefined') {
			// Initial check
			darkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;

			// Listen for changes
			const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
			const handleChange = (e: MediaQueryListEvent) => {
				darkMode = e.matches;
			};

			mediaQuery.addEventListener('change', handleChange);

			// Ensure dark mode is applied immediately
			document.documentElement.classList.toggle('dark', darkMode);

			return () => {
				mediaQuery.removeEventListener('change', handleChange);
			};
		}
	});

	// Update the class when darkMode changes
	$effect(() => {
		if (typeof window !== 'undefined') {
			document.documentElement.classList.toggle('dark', darkMode);
		}
	});
</script>

<div
	class="min-h-screen bg-white text-gray-900 transition-colors duration-200 dark:bg-gray-900 dark:text-gray-100"
>
	{@render children()}
</div>
