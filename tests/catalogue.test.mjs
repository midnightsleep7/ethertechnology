import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';

const dataCode = fs.readFileSync(new URL('../dist/store-data.js', import.meta.url), 'utf8');
const appCode = fs.readFileSync(new URL('../dist/app.js', import.meta.url), 'utf8');

class Element {
  constructor(tag = 'div') {
    this.tagName = tag;
    this.children = [];
    this.dataset = {};
    this.attributes = {};
    this.listeners = {};
    this.value = '';
    this.hidden = false;
    this.isConnected = true;
    const classes = new Set();
    this.classList = {
      add: (name) => classes.add(name),
      remove: (name) => classes.delete(name),
      contains: (name) => classes.has(name),
      toggle(name, force) {
        const enabled = force ?? !classes.has(name);
        if (enabled) classes.add(name); else classes.delete(name);
        return enabled;
      }
    };
    this.style = { setProperty() {} };
  }
  append(...nodes) { this.children.push(...nodes); }
  replaceChildren(...nodes) { this.children = [...nodes]; }
  setAttribute(key, value) { this.attributes[key] = value; }
  addEventListener(name, callback) { (this.listeners[name] ??= []).push(callback); }
  dispatch(name, extra = {}) { for (const callback of this.listeners[name] ?? []) callback({ target: this, ...extra }); }
  querySelectorAll(tag) { return this.children.filter((child) => child.tagName === tag); }
  showModal() { this.open = true; }
  close() { this.open = false; this.dispatch('close'); }
  focus() { this.focused = true; }
  scrollIntoView() {}
}

function boot(time = '2026-10-17T04:00:00Z') {
  const nodes = new Map();
  const get = (selector) => {
    if (!nodes.has(selector)) nodes.set(selector, new Element());
    return nodes.get(selector);
  };
  get('#product-sort').value = 'featured';
  const brandLinks = ['HONOR', 'OPPO', 'Samsung', 'Apple', 'vivo', 'realme', 'Redmi', 'Infinix'].map((brand) => {
    const link = new Element('a'); link.dataset.brand = brand; return link;
  });
  const body = new Element('body');
  const document = { body, querySelector: get, querySelectorAll: () => brandLinks, createElement: (tag) => new Element(tag), addEventListener() {} };
  const NativeDate = Date;
  class Clock extends NativeDate { constructor(...args) { super(...(args.length ? args : [time])); } }
  const context = vm.createContext({ window: {}, document, Date: Clock, Intl, setInterval() {} });
  vm.runInContext(dataCode, context);
  vm.runInContext(appCode, context);
  const titles = () => get('#product-grid').children.map((card) => card.children[1].children[1].textContent);
  return { get, body, brandLinks, titles };
}

test('initial catalogue contains all eight brands', () => {
  const { get, titles } = boot();
  assert.equal(titles().length, 8);
  assert.equal(get('#result-count').textContent, '8 showcase models');
  assert.equal(get('#empty-state').hidden, true);
});

test('each brand filter returns only its matching phone', () => {
  const { get, titles } = boot();
  for (const filter of get('#brand-filters').children.slice(1)) {
    filter.dispatch('click');
    assert.equal(titles().length, 1);
    assert.equal(filter.attributes['aria-pressed'], 'true');
    assert.equal(get('#result-count').textContent, '1 showcase model');
  }
});

test('search ignores case and surrounding whitespace', () => {
  const { get, titles } = boot();
  get('#product-search').value = '  ReNo  ';
  get('#product-search').dispatch('input');
  assert.deepEqual(titles(), ['OPPO Reno15 5G']);
});

test('unmatched search shows an empty state and reset restores catalogue', () => {
  const { get, titles } = boot();
  get('#product-search').value = 'no-such-phone';
  get('#product-search').dispatch('input');
  assert.equal(get('#empty-state').hidden, false);
  assert.equal(get('#product-grid').hidden, true);
  get('#clear-filters').dispatch('click');
  assert.equal(titles().length, 8);
  assert.equal(get('#product-grid').hidden, false);
  assert.equal(get('#product-search').value, '');
});

test('model sorting changes presentation without changing catalogue', () => {
  const { get, titles } = boot();
  get('#product-sort').value = 'name';
  get('#product-sort').dispatch('change');
  const actual = titles();
  assert.deepEqual(actual, [...actual].sort((a, b) => a.localeCompare(b)));
  get('#product-sort').value = 'featured';
  get('#product-sort').dispatch('change');
  assert.equal(titles()[0], 'HONOR X9e Pro');
});

test('brand wordmarks clear a previous search before filtering', () => {
  const { get, brandLinks, titles } = boot();
  get('#product-search').value = 'no-such-phone';
  get('#product-search').dispatch('input');
  brandLinks.find((link) => link.dataset.brand === 'OPPO').dispatch('click');
  assert.deepEqual(titles(), ['OPPO Reno15 5G']);
  assert.equal(get('#product-search').value, '');
});

test('product detail opens with correct content and closing restores focus', () => {
  const { get, body } = boot();
  const trigger = get('#product-grid').children[0].children[0];
  trigger.dispatch('click');
  assert.equal(get('#product-dialog').open, true);
  assert.equal(get('#dialog-title').textContent, 'HONOR X9e Pro');
  assert.ok(get('#manufacturer-link').href.startsWith('https://www.honor.com/'));
  assert.equal(body.classList.contains('dialog-open'), true);
  get('#close-dialog').dispatch('click');
  assert.equal(get('#product-dialog').open, false);
  assert.equal(body.classList.contains('dialog-open'), false);
  assert.equal(trigger.focused, true);
});

test('mobile navigation tracks expanded state', () => {
  const { get } = boot();
  get('#menu-toggle').dispatch('click');
  assert.equal(get('#menu-toggle').attributes['aria-expanded'], 'true');
  get('#menu-toggle').dispatch('click');
  assert.equal(get('#menu-toggle').attributes['aria-expanded'], 'false');
});

test('opening status uses Sabah time and exact opening/closing boundaries', () => {
  assert.match(boot('2026-10-17T01:29:00Z').get('#store-status').textContent, /^Closed/);
  assert.match(boot('2026-10-17T01:30:00Z').get('#store-status').textContent, /^Open/);
  assert.match(boot('2026-10-17T11:29:00Z').get('#store-status').textContent, /^Open/);
  assert.match(boot('2026-10-17T11:30:00Z').get('#store-status').textContent, /^Closed/);
});
