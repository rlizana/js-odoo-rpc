# js-odoo-rpc

**js-odoo-rpc** is a lightweight JavaScript/TypeScript library to interact with Odoo (tested on Odoo 16, 17, 18) via JSON-RPC and session-based authentication.

It works in both **Node.js** and **browser environments**, making it suitable for frontend frameworks (Svelte, Vue, React) and backend scripts.

---

## Features

- Works with both Node.js and browser fetch
- Automatic cookie handling (with `fetch-cookie` in Node)
- Session-based login (`/web/session/authenticate`)
- JSON-RPC calls to any Odoo model/method
- Simplified API with `env('model')`
- Report printing via `/report/pdf/...` (PDF download)
- Built-in context and CSRF token support

# How it works

Same code for Node.js and browser. The library uses `fetch` for HTTP requests, and in Node.js, it uses `fetch-cookie` to handle cookies automatically.

```js
import { Odoo } from 'js-odoo-rpc'

const odoo = new Odoo('http://localhost:8069', 'test')
await odoo.login('admin', 'admin')

// Search and partners and read their names
let partners = await odoo
  .env('res.partner')
  .search([['name', 'ilike', 'Azure%']])
  .read(['name'])

// Modify a partner
let result = await odoo
  .env('res.partner')
  .write([partners[0].id], { name: 'New name' })

// Create a partner
let partner_id = await odoo
  .env('res.partner')
  .create({ name: 'New name' })

// Remove a partner
let result = await odoo
  .env('res.partner')
  .unlink([partner_id])

// Call any method
let names = await odoo
  .env('res.partner')
  .call('name_search', ['Azure%'], 0, 10)



```

---

## Installation

### Node.js

```bash
npm install js-odoo-rpc cross-fetch fetch-cookie
```

### Browser (ESM)

Use a bundler like Vite, Webpack or Rollup and import the browser version:

```js
import { Odoo } from 'js-odoo-rpc'

const odoo = new Odoo('http://localhost:8069', 'test')
await odoo.login('admin', 'admin')

```

---

## Usage

### 1. Connect to Odoo

```ts
import { Odoo } from 'js-odoo-rpc'

const odoo = new Odoo('http://localhost:8069', 'test')
await odoo.login('admin', 'admin')

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

Or can use `npm` to run the script:

```bash
npm run shell
```

This will start a REPL session where you can type in your Odoo commands and see the results in real-time. It's a great way to test out different methods and see how they work without needing to write a full script.
You can also use the REPL to test out different models and methods, making it a powerful tool for exploring the Odoo API.
