# DID Auth

## Local Development

### 1. Install dependencies

```bash
pnpm install
```

The project uses Husky and lint-staged to enforce code quality checks before each commit. These are automatically set up when you run `pnpm install` thanks to the `prepare` script.

When you try to commit changes, the following checks will run automatically on staged files:

- Prettier formatting check
- ESLint with zero warnings allowed

If any checks fail, the commit will be blocked until you fix the issues.

### 2. Setup Drizzle and SQLite

1. Generate the schema

   ```bash
   pnpm db:generate
   ```

2. Push the migrations

   ```bash
   pnpm db:migrate
   ```

### 3. Run the app

```bash
pnpm dev
```

## Database Schema Diagram

<https://dbdiagram.io/d/DID%2FUCAN-67cae800263d6cf9a096e5dd>

## IndexedDB Console Commands

You can use JavaScript to view and delete the key pair stored in IndexedDB.

```javascript
// Show the key pair
let dbRequest = indexedDB.open('cryptoKeysDB', 1);
dbRequest.onsuccess = function (e) {
  const db = e.target.result;
  const transaction = db.transaction('keys', 'readonly');
  const objectStore = transaction.objectStore('keys');
  const request = objectStore.getAll();
  request.onsuccess = function () {
    console.log(request.result);
  };
};

// Delete the database
indexedDB.deleteDatabase('cryptoKeysDB');
```

The last command is useful if you want to remove the current key pair.

To avoid having to delete key pairs repeatedly when you are testing, just use private browsing windows.
