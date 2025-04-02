# DID Auth

This is a simple implementation that illustrates using public/private key pairs for authentication to a web service. It leverages the Web Crypto API built into all modern web browsers to securely store a private key and use it to authenticate a user.

When a user creates an account, the service stores the user's public key. Each request to the service is signed by the user's private key so that the service can authenticate each request made to it and confirm it is actually made by the user who holds the private key.

Feel free to try it out here: <https://did-auth.ic3.dev>

This example uses Cloudflare as the deployment environment. Specifically, it deploys using Pages, data is stored in D1, and [rate limiting](#setup-rate-limiting) is implemented through a domain's security rules.

## Database Schema Diagram

<https://dbdiagram.io/d/DID%2FUCAN-67cae800263d6cf9a096e5dd>

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

## Setup Rate Limiting

To prevent against brute force attacks on the login tokens page and other pages, implement rate limiting. Here's how to do it from the Cloudflare dashboard.

- Go to domain where the app is hosted
- Select _Security > Security rules_
- Click _Create rule_ then select _Rate limiting rules_
  - Add a name ("_Rate limit all pages_")
  - Field = _URI path_
  - Operator = _wildcard_
  - Value = _/*_
  - _30_ requests per _10_ seconds
  - Action = _Block_
- Click _Deploy_

Any browser that exceeds these limits will be shown a rate limiting error page from Cloudflare.
