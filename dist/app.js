'use strict';

(() => {
  const store = window.ETHER_STORE;
  if (!store || !Array.isArray(store.products)) return;
  const query = (selector) => document.querySelector(selector);
  const grid = query('#product-grid');
  const filterGroup = query('#brand-filters');
  const search = query('#product-search');
  const sort = query('#product-sort');
  const dialog = query('#product-dialog');
  let activeBrand = 'All';
  let lastProductButton = null;

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function closeDialog() {
    dialog.close();
    document.body.classList.remove('dialog-open');
  }

  function openProduct(product, trigger) {
    lastProductButton = trigger;
    query('#dialog-title').textContent = product.name;
    query('#dialog-brand').textContent = product.brand + ' · PRODUCT SHOWCASE';
    query('#dialog-description').textContent = product.description;
    const image = query('#dialog-product-image');
    image.src = product.image;
    image.alt = product.imageAlt;
    query('.dialog-image').style.background = product.background;
    query('#manufacturer-link').href = product.url;
    dialog.showModal();
    document.body.classList.add('dialog-open');
    query('#close-dialog').focus();
  }

  function productCard(product) {
    const article = element('article', 'product-card');
    article.style.setProperty('--product-bg', product.background);
    const imageButton = element('button', 'product-image-button');
    imageButton.type = 'button';
    imageButton.setAttribute('aria-label', 'View ' + product.name + ' details');
    const badge = element('span', 'product-badge', 'Example model');
    const image = element('img');
    image.src = product.image;
    image.alt = product.imageAlt;
    image.loading = 'lazy';
    image.width = 250;
    image.height = 290;
    image.style.objectFit = product.imageFit || 'contain';
    image.style.objectPosition = product.imagePosition || 'center';
    imageButton.append(badge, image);
    imageButton.addEventListener('click', () => openProduct(product, imageButton));
    const info = element('div', 'product-info');
    const brand = element('p', 'product-brand', product.brand.toUpperCase());
    const heading = element('h3', '', product.name);
    const family = element('p', 'product-family', product.family);
    const bottom = element('div', 'product-card-bottom');
    const availability = element('span', '', 'Enquire in store');
    const details = element('button', 'details-button', 'Explore ');
    details.type = 'button';
    details.setAttribute('aria-label', 'Explore ' + product.name);
    const arrow = element('span', '', '↗');
    arrow.setAttribute('aria-hidden', 'true');
    details.append(arrow);
    details.addEventListener('click', () => openProduct(product, details));
    bottom.append(availability, details);
    info.append(brand, heading, family, bottom);
    article.append(imageButton, info);
    return article;
  }

  function renderProducts() {
    const term = search.value.trim().toLowerCase();
    let matches = store.products.filter((product) =>
      (activeBrand === 'All' || product.brand === activeBrand) &&
      [product.name, product.brand, product.family].some((value) => value.toLowerCase().includes(term))
    );
    if (sort.value === 'brand') matches.sort((a, b) => a.brand.localeCompare(b.brand));
    if (sort.value === 'name') matches.sort((a, b) => a.name.localeCompare(b.name));
    grid.replaceChildren(...matches.map(productCard));
    query('#empty-state').hidden = matches.length > 0;
    grid.hidden = matches.length === 0;
    query('#result-count').textContent = matches.length + ' showcase model' + (matches.length === 1 ? '' : 's');
    for (const button of filterGroup.querySelectorAll('button')) {
      button.setAttribute('aria-pressed', String(button.dataset.brand === activeBrand));
    }
  }

  function selectBrand(brand) {
    activeBrand = brand;
    search.value = '';
    renderProducts();
  }

  for (const brand of ['All', ...store.brands]) {
    const button = element('button', 'brand-filter', brand === 'All' ? 'All phones' : brand === 'Apple' ? 'iPhone' : brand);
    button.type = 'button';
    button.dataset.brand = brand;
    button.setAttribute('aria-pressed', String(brand === activeBrand));
    button.addEventListener('click', () => selectBrand(brand));
    filterGroup.append(button);
  }

  for (const link of document.querySelectorAll('#brand-strip [data-brand]')) {
    link.addEventListener('click', () => {
      selectBrand(link.dataset.brand);
      const selected = [...filterGroup.querySelectorAll('button')].find((button) => button.dataset.brand === activeBrand);
      selected?.scrollIntoView({ behavior: 'auto', block: 'nearest', inline: 'center' });
    });
  }

  search.addEventListener('input', renderProducts);
  sort.addEventListener('change', renderProducts);
  query('#clear-filters').addEventListener('click', () => {
    activeBrand = 'All';
    search.value = '';
    sort.value = 'featured';
    renderProducts();
    search.focus();
  });
  query('#search-toggle').addEventListener('click', () => {
    query('#phones').scrollIntoView({ behavior: 'auto' });
    search.focus({ preventScroll: true });
  });
  query('#close-dialog').addEventListener('click', closeDialog);
  query('#dialog-visit').addEventListener('click', closeDialog);
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) {
      const bounds = dialog.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) closeDialog();
    }
  });
  dialog.addEventListener('close', () => {
    document.body.classList.remove('dialog-open');
    if (lastProductButton?.isConnected) lastProductButton.focus({ preventScroll: true });
  });

  const menu = query('#menu-toggle');
  const navigation = query('#navigation');
  function closeMenu() {
    navigation.classList.remove('is-open');
    menu.setAttribute('aria-expanded', 'false');
    menu.setAttribute('aria-label', 'Open menu');
  }
  menu.addEventListener('click', () => {
    const isOpen = navigation.classList.toggle('is-open');
    menu.setAttribute('aria-expanded', String(isOpen));
    menu.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
  });
  for (const link of navigation.querySelectorAll('a')) link.addEventListener('click', closeMenu);
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeMenu(); });
  document.addEventListener('click', (event) => { if (!event.target.closest('.site-header')) closeMenu(); });

  function updateStoreStatus() {
    const parts = new Intl.DateTimeFormat('en-GB', { timeZone: store.timeZone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date());
    const hour = Number(parts.find((part) => part.type === 'hour').value);
    const minute = Number(parts.find((part) => part.type === 'minute').value);
    const toMinutes = (time) => { const [h, m] = time.split(':').map(Number); return h * 60 + m; };
    const isOpen = hour * 60 + minute >= toMinutes(store.opensAt) && hour * 60 + minute < toMinutes(store.closesAt);
    const status = query('#store-status');
    status.textContent = isOpen ? 'Open now · Closes at 7:30 PM' : 'Closed now · Opens at 9:30 AM';
    status.classList.toggle('is-closed', !isOpen);
  }

  query('#directions-link').href = store.mapsUrl;
  query('#copyright-year').textContent = new Date().getFullYear();
  updateStoreStatus();
  setInterval(updateStoreStatus, 60000);
  renderProducts();
})();
