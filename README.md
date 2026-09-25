# Candy Rack Prototypes

Interactive prototypes for [Candy Rack](https://apps.shopify.com/candyrack) – admin screens built with real
[Shopify Polaris](https://polaris-react.shopify.com/) components, plus storefront parts like the slide cart.

## Getting started

```bash
npm install   # once, after cloning
npm run dev   # starts a local server at http://localhost:5173
```

## Structure

```
reward-bar/                  a feature
  settings.js                default settings shared by all its parts
  admin-slide-cart/          a part = one screen (index.html + main.jsx)
  storefront-slide-cart/
shared/
  admin/                     Polaris setup for admin parts
  storefront/                base styles and tokens for storefront parts
  usePersistentState.js      saving to the browser (localStorage)
_template/                   starter feature – local only, not published
```

Admin parts save settings, storefront parts of the same feature read them – open both in two tabs and they stay in sync.

Part names (`admin-edit-offer`, `storefront-slide-cart`, …) are listed in [CLAUDE.md](CLAUDE.md).

## Adding a prototype

1. Create a branch: `git switch -c prototype/my-feature`
2. Copy the template: `cp -r _template my-feature`
3. Edit the parts – the feature shows up on the overview page automatically
4. Commit, push, open a pull request
