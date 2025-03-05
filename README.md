# Svelte UCAN

## Install dependencies

```bash
pnpm install
```

## Setup Drizzle and SQLite

1. Generate the schema

    ```bash
    pnpm exec drizzle-kit generate
    ```

2. Push the migrations

    ```bash
    pnpm exec drizzle-kit push
    ```

## Error: Could not locate the bindings file

If you encounter the error message "Error: Could not locate the bindings file. Tried:", you can resolve it by following these steps:

1. Navigate to the `better-sqlite3` directory within `node_modules`:

    ```bash
    cd node_modules/better-sqlite3
    ```

2. Run the build-release script:

    ```bash
    pnpm install
    cd ../..
    ```

## Run the app

```bash
pnpm dev
```
