# Ether Technology Sdn Bhd

A responsive, HONOR-inspired multi-brand phone-store showcase for Ether Technology Sdn Bhd, Keningau, Sabah. Plain HTML, CSS, and JavaScript: no npm dependencies or build step.

## Shop information

- **Address:** Lot 2-27, 2nd Floor, Keningau Mall, Keningau, Sabah, Malaysia
- **Opening hours:** Every day, 9:30 AM–7:30 PM (Asia/Kuching)
- **Brands:** OPPO, HONOR, Infinix, realme, vivo, Redmi, Samsung, and iPhone
- **Accessories:** Cases, screen protectors, audio, chargers, and cables

The phones are explicitly labeled example models. Current stock, colours, pricing, and purchases are handled in store. No checkout or customer-data collection is implemented. A contact number was not supplied, so there is no WhatsApp or call button yet.

## Edit the site

| File | What to change |
| --- | --- |
| `dist/index.html` | Page text, hero, address, visible hours, FAQ, and search-engine metadata |
| `dist/store-data.js` | Example phone catalogue, brands, product descriptions, photos, official product links, map link, and time-zone-aware opening status |
| `dist/styles.css` | Colours, typography, spacing, desktop and mobile layout |
| `dist/assets/` | Product images, favicon, and font |
| `dist/app.js` | Search, filters, sorting, product dialog, navigation, and opening status |

For a phone, edit an existing object in `products` or add one with a unique `id`. Images use paths relative to `dist/`, such as `assets/new-phone.png`. Keep each product's `brand` in the `brands` array. The current validator expects PNG product photos. Update `index.html` as well as `store-data.js` when changing the address or hours; the former provides the visible content and structured data, and the latter controls interactive behaviour.

## Preview locally

Open `dist/index.html` in a modern browser. All page assets are local and the site also works under a GitHub Pages project subdirectory.

For a local web server, from this folder run:

```bash
python -m http.server 8000 --directory dist
```

Then open http://localhost:8000.

## Validate

Install Node.js 22 or later, then run:

```bash
node scripts/validate.mjs
node --test tests/catalogue.test.mjs
```

Validation checks JavaScript syntax, referenced assets, anchors, unique IDs, catalogue structure, and structured data. The nine interaction checks cover filters, search, empty-state recovery, sorting, brand shortcuts, product dialogs, navigation state, and opening/closing boundaries in Sabah time. They run in a small DOM test harness; they do not replace a real-browser visual/accessibility review.

## GitHub repository and editing

Repository: https://github.com/midnightsleep7/ethertechnology

Open a file in the repository, click the pencil button, make your changes, and commit to `main`. Product names, descriptions, and images are configured in `dist/store-data.js`. Page text and visible shop information are in `dist/index.html`. The workflow checks each push before deployment.

To work locally:

```bash
git clone https://github.com/midnightsleep7/ethertechnology.git
cd ethertechnology
```

## Enable GitHub Pages

1. Open https://github.com/midnightsleep7/ethertechnology/settings/pages.
2. Under **Build and deployment → Source**, select **GitHub Actions**.
3. Open **Actions → Validate and publish website → Run workflow**, select `main`, and run it.
4. Once deployment succeeds, GitHub will show the live URL. The expected project address is `https://midnightsleep7.github.io/ethertechnology/`; it is not live until GitHub confirms deployment.

The repository is private. GitHub Pages for private repositories requires a supported paid GitHub plan. On GitHub Free, Pages is available for public repositories. Do not change repository visibility unless you intend to publish the source code publicly. The existing hosted preview remains available at https://ether-technology.bloomydell34.chatgpt.site.

The workflow always runs validation and interaction checks. When Pages is unavailable or not enabled, it records the publishing setup instructions and skips deployment. After enabling Pages, future pushes to `main` validate and publish automatically. Pull requests run checks without deploying.

GitHub's official guide: https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages

## Image credits

See `ASSET-SOURCES.md`. Product names and images belong to their respective brands. Accessories are original illustrative SVG/CSS compositions representing categories. Replace showcase models with the shop's confirmed catalogue and approved supplier images when ready.
