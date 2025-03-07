# Svelte UCAN

## 1. Install dependencies

```bash
pnpm install
```

## 2. Setup Drizzle and SQLite

1. Generate the schema

    ```bash
    pnpm db:generate
    ```

2. Push the migrations

    ```bash
    pnpm db:migrate
    ```

## 3. Run the app

```bash
pnpm dev
```
