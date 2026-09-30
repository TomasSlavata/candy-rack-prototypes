# Candy Rack Prototypes

Interactive prototypes of the Candy Rack Shopify app (upsell/cross-sell, slide cart) – admin and storefront.
The user is a product designer, not a developer, and is still learning Git.

## Language

- Communicate with the user in Czech.
- Everything in the repo and on GitHub is in English: code, comments, UI texts, commit messages,
  PR titles and PR descriptions. The team includes developers who don't speak Czech.

## Structure

Each feature has a folder in the repo root with one or more parts in it. Each part is a separate page
(`index.html` + `main.jsx`) and shows up on the overview page automatically.

```
reward-bar/                  feature
  settings.js                default settings shared by all parts of the feature
  admin-slide-cart/          part = one screen
  storefront-slide-cart/
shared/
  admin/AdminShell.jsx       Polaris setup – admin and theme-editor parts start with renderAdmin()
  storefront/                StorefrontShell.jsx + storefront.css (--sf-… tokens)
  usePersistentState.js      saving to localStorage; useFeatureSettings() shares settings between a feature's parts
_template/                   sample feature – a new prototype = copy this folder
```

- Folders starting with `_` are local only: visible in `npm run dev`, not published.
- The admin part saves settings via `useFeatureSettings`, the storefront part reads them – open tabs stay in sync.

### Part glossary

Only use part folder names from this list. Add a new screen to it after agreeing with the user
(and add its label to `PART_LABELS` in `index.jsx`).

| Folder | Screen | Built from |
|---|---|---|
| `admin-dashboard` | Dashboard (list of offers) | Polaris React |
| `admin-edit-offer` | Create / Edit offer | Polaris React |
| `admin-slide-cart` | Slide cart settings (SC admin) | Polaris React |
| `admin-customization` | Customization | Polaris React |
| `admin-analytics` | Analytics | Polaris React |
| `theme-editor` | App block settings in the Shopify theme editor | Polaris React |
| `storefront-product-page` | Product page (pop-up, embedded block) | custom markup |
| `storefront-slide-cart` | Slide cart | custom markup |
| `storefront-thank-you` | Thank you / Order status page | custom markup |

In Shopify, checkout and post-purchase are built from checkout extension components – before the first
part for them is created, discuss with the user how to prototype them.

## Admin UI (`admin-…`)

- Build all admin UI from Polaris React components (`@shopify/polaris`, latest v13).
- Icons only from `@shopify/polaris-icons`.
- Handle layout and spacing with Polaris components (BlockStack, InlineStack, Box, Layout, Grid).
- Don't use Polaris Web Components (`<s-button>` etc.) yet, the switch is planned for later.
- Candy Rack runs in the Shopify admin via App Bridge. Elements that App Bridge renders in production
  (modal, contextual save bar, title bar, toast) don't work outside the admin – build them from the closest
  Polaris React component (e.g. `Modal`, `Page` with `primaryAction`) and mark them with a comment
  `// APP BRIDGE: <what it is in production>`, e.g. `// APP BRIDGE: contextual save bar`.

### When Polaris isn't enough

If something can't be built purely from Polaris components (the component doesn't exist or doesn't support
the needed behavior), **don't build a custom solution without approval**:
1. Stop and describe the problem: what Polaris can't do and why.
2. Propose options, always including a "pure Polaris" option (even with a UX compromise), and recommend one.
3. Wait for the user's decision.

If a custom solution is approved:
- Colors, spacing, radii, shadows, typography and animations only via Polaris tokens
  (CSS variables `--p-…`, e.g. `var(--p-space-400)`, `var(--p-color-bg-surface)`), never hard-coded.
- Compose it from Polaris components where possible (Box, Text, Icon…), custom markup only where necessary.
- Put reusable custom components in `shared/custom/`, keep one-off ones in the part's folder.
- Mark it in the code with a comment `// CUSTOM: <why Polaris isn't enough>`.

## Theme editor (`theme-editor`)

- Imitates the Shopify theme editor (Online Store → Customize) with Polaris React components.
- Design app block settings only from field types supported by the theme app extension Liquid schema
  (checkbox, select, radio, range, number, text, textarea, color, product, collection…).
  Nothing the schema can't do – developers couldn't build it.

## Storefront (`storefront-…`)

- No Polaris – we imitate what the customer sees in the store.
- Styles only via `--sf-…` tokens from `shared/storefront/storefront.css`, no hard-coded values.
- A part's styles go to `styles.css` in the part's folder.

## Git workflow

- Don't work directly in `main`. Every change on its own branch, then a pull request:
  `prototype/<feature>` for prototypes, `setup/…` for project changes, `fix/…` for fixes.
- Claude runs Git (branches, commit, push, pull, opening PRs). Before each such action, briefly ask
  the user (what and why) and wait for approval. Don't give the user terminal commands.
- The user only approves and merges pull requests on GitHub. After a merge, pull the latest `main`.
- Clean up after a merge (approved as standard, no need to ask): PRs are squash-merged, so
  `git branch -d` reports the branch as not merged. Check that `git diff origin/<branch> main` is empty,
  then delete the branch with `-D` locally and on GitHub.
- Check `npm run build` before committing.
