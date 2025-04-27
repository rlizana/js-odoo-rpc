// build.mjs
import { build } from 'esbuild'

const commonOptions = {
  entryPoints: ['src/index.ts'],
  bundle: true,
  minify: true,
  sourcemap: false,
  external: ['cross-fetch', 'fetch-cookie']
}

// Build for Node.js
await build({
  ...commonOptions,
  platform: 'node',
  format: 'esm',
  target: ['node16'],
  outfile: 'dist/odoo-rpc.node.js'
})

// Build for browser
await build({
  ...commonOptions,
  platform: 'browser',
  format: 'esm',
  target: ['es2018'],
  outfile: 'dist/odoo-rpc.browser.js'
})
