# Svelte UCAN

## Setup Drizzle and SQLite

1. Generate the schema

    ```bash
    npx drizzle-kit generate
    ```

2. Push the migrations

    ```bash
    npx drizzle-kit push
    ```

## Error: Could not locate the bindings file

If you encounter the error message "Error: Could not locate the bindings file. Tried:", you can resolve it by following these steps:

1. Navigate to the `better-sqlite3` directory within `node_modules`:

    ```bash
    cd node_modules/better-sqlite3
    ```

2. Run the build-release script:

    ```bash
    pnpm run build-release
    ```

For more information, you can refer to the issue on GitHub: [WiseLibs/better-sqlite3#146](https://github.com/WiseLibs/better-sqlite3/issues/146)
