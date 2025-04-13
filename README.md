# js-odoo-rpc

**js-odoo-rpc** is a lightweight JavaScript/TypeScript library to interact with Odoo (tested on Odoo 16, 17, 18) via JSON-RPC and session-based authentication.

It works in both **Node.js** and **browser environments**, making it suitable for frontend frameworks (Svelte, Vue, React) and backend scripts.

---

## ✨ Features

- Session-based login (`/web/session/authenticate`)
- Automatic cookie handling (with `fetch-cookie` in Node)
- JSON-RPC calls to any Odoo model/method
- Simplified API with `env('model')`
- Report printing via `/report/pdf/...` (PDF download)
- Built-in context and CSRF token support
- Works with both Node.js and browser fetch

---

## Installation

### Node.js

```bash
npm install js-odoo-rpc cross-fetch fetch-cookie
```

### Browser (ESM)

Add this to your project and bundle with Vite, Webpack, etc.

---

## Usage

### 1. Connect to Odoo

```ts
import { connect, is_loged } from 'js-odoo-rpc'

await connect({
  url: 'http://localhost:8069',
  dbname: 'test',
  username: 'admin',
  password: 'admin',
  verbose: true
})

console.log(is_loged()) // true if login was successful
```

### 2. Create a record

```ts
const id = await env('res.partner').create({
  name: 'My Partner'
})
```

### 3. Update a record

```ts
await env('res.partner').write([id], { email: 'test@example.com' })
```

### 4. Search + Read

```ts
const partners = await env('res.partner')
  .search([['name', 'ilike', 'My']])
  .read(['name', 'email'])
```

### 5. Delete

```ts
await env('res.partner').unlink([id])
```

### 6. Call any method

```ts
await env('res.partner').call('default_get', [['name', 'email']])
```

### 7. Print a report (PDF)

```ts
const buffer = await env('sale.order').print('sale.report_saleorder', [7])

const blob = new Blob([buffer], { type: 'application/pdf' })
const url = URL.createObjectURL(blob)
window.open(url)
```

## Usage in REPL (Interactive Testing)

The `repl.ts` script allows you to interactively test your connection and calls to Odoo in a Node.js terminal. It acts as a live sandbox where you can run methods like `env('res.partner').search([]).read(['name'])` and immediately see results from your Odoo instance.

To use it, just run:

```bash
npx tsx repl.ts
```

Make sure you have your credentials and Odoo instance configured properly in the script before running it.
