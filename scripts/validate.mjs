import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const html = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(dist, 'styles.css'), 'utf8');
const app = fs.readFileSync(path.join(dist, 'app.js'), 'utf8');
const context = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(dist, 'store-data.js'), 'utf8'), context);
const store = context.window.ETHER_STORE;

for (const file of ['store-data.js', 'app.js', 'scripts/validate.mjs', 'tests/catalogue.test.mjs']) {
  const filename = file.endsWith('.js') ? path.join(dist, file) : path.join(root, file);
  const result = spawnSync(process.execPath, ['--check', filename], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
}
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
assert.equal(ids.length, new Set(ids).size, 'HTML IDs must be unique.');
for (const match of html.matchAll(/\bhref="#([^"]+)"/g)) assert.ok(ids.includes(match[1]), `Missing anchor #${match[1]}`);
for (const match of app.matchAll(/query\('#([^']+)'\)/g)) assert.ok(ids.includes(match[1]), `Missing app element #${match[1]}`);
for (const match of html.matchAll(/\b(?:src|href)="([^"#]+)"/g)) {
  const value = match[1];
  if (/^(?:https?:|data:)/.test(value)) continue;
  assert.ok(fs.existsSync(path.join(dist, value)), `Missing referenced file: ${value}`);
}
for (const match of css.matchAll(/url\(['"]?([^)'"\s]+)['"]?\)/g)) assert.ok(fs.existsSync(path.join(dist, match[1])), `Missing CSS asset: ${match[1]}`);
for (const match of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) JSON.parse(match[1]);
assert.ok(html.includes('name="viewport"'), 'Responsive viewport is required.');
assert.ok(html.includes('<html lang="en">'), 'Document language is required.');
assert.ok(css.includes('prefers-reduced-motion'), 'Respect reduced motion.');
assert.ok(css.includes(':focus-visible'), 'Keyboard focus styles are required.');
assert.ok(html.includes('9:30 AM') && html.includes('7:30 PM'), 'Opening times must be visible.');
assert.equal(store.name, 'Ether Technology Sdn Bhd');
assert.equal(store.timeZone, 'Asia/Kuching');
assert.equal(new Set(store.products.map((product) => product.id)).size, store.products.length, 'Product IDs must be unique.');
assert.equal(store.brands.length, 8);
for (const product of store.products) {
  assert.ok(store.brands.includes(product.brand), `Unknown brand: ${product.brand}`);
  for (const key of ['id', 'name', 'family', 'image', 'imageAlt', 'description', 'url']) assert.ok(typeof product[key] === 'string' && product[key].trim(), `Missing ${key} on ${product.id}`);
  assert.equal(new URL(product.url).protocol, 'https:');
  const data = fs.readFileSync(path.join(dist, product.image));
  assert.equal(data.subarray(1, 4).toString(), 'PNG', `Invalid PNG: ${product.image}`);
}
assert.ok(!/codex-preview|TODO|lorem ipsum|cliff-workbench/i.test(html + app + css), 'Remove placeholder content.');
console.log(`Validation passed: ${store.products.length} products, ${store.brands.length} brands, ${ids.length} anchors, local assets, structured data, and JavaScript syntax.`);
