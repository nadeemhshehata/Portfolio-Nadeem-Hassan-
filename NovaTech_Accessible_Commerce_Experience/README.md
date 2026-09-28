# NovaTech E-Commerce Website — Task 1

NovaTech is a responsive, multi-page e-commerce demonstration built with HTML, CSS, and JavaScript and designed for public hosting on GitHub Pages.

> **Academic demo:** The cart is functional, but checkout and newsletter submission are intentionally simulated. The site does not collect personal or payment data.

## Live Demo

**[Launch the NovaTech storefront](https://nadeemhshehata.github.io/novatech-commerce-experience/)**

Source repository: [nadeemhshehata/novatech-commerce-experience](https://github.com/nadeemhshehata/novatech-commerce-experience)

## Group Members

| Name | Username | Student ID |
|---|---|---:|
| Nadeem Hassan | Hass3285 | 169093285 |
| Elias Zubaidi | Zuba5051 | 169065051 |
| Awale Hussein | Huss8976 | 169038976 |
| Hasan Muhammad | Hasa9724 | 169099724 |
| Omeed Attayi | atta0147 | 169060147 |

## Assignment Checklist

- **Platform selection:** GitHub Pages, using a custom static storefront with client-side e-commerce interactions.
- **Home page:** Hero, store benefits, featured products, project values, and newsletter demo.
- **Blog page:** Five complete introductory articles—one from every group member—covering the website purpose, customer experience, privacy, product discovery, cart design, and roadmap.
- **About page:** Mission, story, and profiles for all five group members.
- **Product page:** Six products with category filters, live search, prices, descriptions, and add-to-cart controls.
- **Privacy implementation:** Accurate policy, no analytics or third-party assets, local-only cart storage, and a working “Clear saved cart” control.
- **E-commerce support:** Persistent shopping cart, quantity controls, shipping calculation, order total, and safe demo checkout.
- **Responsive and accessible:** Mobile navigation, keyboard focus, skip link, semantic headings, form labels, live status messages, and reduced-motion support.

## Files

```text
ecommerce-site/
├── index.html
├── products.html
├── blog.html
├── about.html
├── privacy.html
├── cart.html
├── css/style.css
├── js/main.js
├── scripts/validate-site.mjs
├── .nojekyll
└── README.md
```

## Run Locally

No installation or build step is required. From this folder, start any static server, for example:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Validate

Run the dependency-free site check before submission:

```bash
node scripts/validate-site.mjs
```

The check confirms that required pages and local links exist, the six products are present, group details match the roster, JavaScript parses, IDs are unique, and no remote page assets are used.

It also verifies that the Blog contains five individually authored posts matching the complete group roster.

## GitHub Pages Deployment

This project is published from the repository’s `main` branch using GitHub Pages. Future changes deploy by committing and pushing to `main`.

- Live site: `https://nadeemhshehata.github.io/novatech-commerce-experience/`
- Public source: `https://github.com/nadeemhshehata/novatech-commerce-experience`

## Privacy Design

The only saved value is `novatech_cart` in the visitor’s own browser local storage. Newsletter input is validated and immediately discarded; checkout is a visible demonstration; no analytics, cookies, external fonts, or remote images are loaded by the site.
