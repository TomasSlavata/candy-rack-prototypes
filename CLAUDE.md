# Candy Rack Prototypes

Interaktivní prototypy Shopify appky Candy Rack (upsell/cross-sell, slide cart) – admin i storefront.
Uživatel je product designer, ne vývojář, a Git se teprve učí.

## Struktura

Každá funkce má složku v kořeni repa, v ní jednu nebo více částí. Každá část je samostatná stránka
(`index.html` + `main.jsx`) a na přehledové stránce se objeví automaticky.

```
reward-bar/                  funkce
  settings.js                sdílené výchozí nastavení všech částí funkce
  admin-slide-cart/          část = jedna obrazovka
  storefront-slide-cart/
shared/
  admin/AdminShell.jsx       Polaris setup – admin a theme-editor části začínají renderAdmin()
  storefront/                StorefrontShell.jsx + storefront.css (tokeny --sf-…)
  usePersistentState.js      ukládání do localStorage; useFeatureSettings() sdílí nastavení mezi částmi funkce
_template/                   vzorová funkce – nový prototyp = zkopírovat tuhle složku
```

- Složky začínající `_` jsou jen lokální: vidět v `npm run dev`, nepublikují se.
- Admin část ukládá nastavení přes `useFeatureSettings`, storefront část ho čte – otevřené záložky se synchronizují.

### Slovník částí

Názvy složek částí používej jen z tohoto seznamu. Novou obrazovku do něj přidej po dohodě
s uživatelem (a doplň popisek do `PART_LABELS` v `index.jsx`).

| Složka | Obrazovka | Postaveno z |
|---|---|---|
| `admin-dashboard` | Dashboard (seznam nabídek) | Polaris React |
| `admin-edit-offer` | Create / Edit offer | Polaris React |
| `admin-slide-cart` | Nastavení slide cartu (SC admin) | Polaris React |
| `admin-customization` | Customization | Polaris React |
| `admin-analytics` | Analytics | Polaris React |
| `theme-editor` | Nastavení app bloku v Shopify theme editoru | Polaris React |
| `storefront-product-page` | Produktová stránka (pop-up, embedded blok) | vlastní markup |
| `storefront-slide-cart` | Slide cart | vlastní markup |
| `storefront-thank-you` | Thank you / Order status stránka | vlastní markup |

Checkout a post-purchase se v Shopify staví z komponent checkout extensions – než pro ně vznikne
první část, probrat s uživatelem, jak je prototypovat.

## Admin UI (`admin-…`)

- Všechno admin UI stav z komponent Polaris React (`@shopify/polaris`, nejnovější v13).
- Ikony jen z `@shopify/polaris-icons`.
- Layout a mezery řeš Polaris komponentami (BlockStack, InlineStack, Box, Layout, Grid).
- Polaris Web Components (`<s-button>` apod.) zatím nepoužívej, přechod plánujeme později.
- Candy Rack běží v Shopify adminu přes App Bridge. Prvky, které v produkci vykresluje App Bridge
  (modal, contextual save bar, title bar), mimo admin nefungují – stav je z nejbližší Polaris React
  komponenty (např. `Modal`, `Page` s `primaryAction`) a označ komentářem
  `// APP BRIDGE: <co to je v produkci>`, např. `// APP BRIDGE: contextual save bar`.

### Když Polaris nestačí

Pokud něco nejde postavit čistě z Polaris komponent (komponenta neexistuje nebo nepodporuje
potřebné chování), **nestav vlastní řešení bez souhlasu**:
1. Zastav se a popiš problém: co Polaris neumí a proč.
2. Navrhni možnosti, vždy včetně varianty „čistě Polaris“ (i s kompromisem v UX), a doporuč jednu.
3. Počkej na rozhodnutí uživatele.

Pokud je vlastní řešení schválené:
- Barvy, mezery, rádiusy, stíny, typografie a animace jen přes Polaris tokeny
  (CSS proměnné `--p-…`, např. `var(--p-space-400)`, `var(--p-color-bg-surface)`), nikdy natvrdo.
- Skládej ho z Polaris komponent, kde to jde (Box, Text, Icon…), vlastní markup jen tam, kde je nutný.
- Znovupoužitelné vlastní komponenty dej do `shared/custom/`, jednorázové nech ve složce části.
- Označ ho v kódu komentářem `// CUSTOM: <proč Polaris nestačí>`.

## Theme editor (`theme-editor`)

- Napodobuje Shopify theme editor (Online Store → Customize) z Polaris React komponent.
- Nastavení app bloku navrhuj jen z typů polí, které podporuje Liquid schema theme app extension
  (checkbox, select, radio, range, number, text, textarea, color, product, collection…).
  Nic, co schema neumí – vývojáři by to nemohli postavit.

## Storefront (`storefront-…`)

- Polaris se nepoužívá – imitujeme to, co vidí zákazník v obchodě.
- Styly jen přes tokeny `--sf-…` ze `shared/storefront/storefront.css`, žádné natvrdo zapsané hodnoty.
- Styly části do `styles.css` ve složce části.

## Git workflow

- Nepracuj přímo v `main`. Každá změna na vlastní větvi, pak pull request:
  `prototype/<funkce>` pro prototypy, `setup/…` pro změny projektu, `fix/…` pro opravy.
- Uživatel se Git učí: u každého příkazu vysvětli česky, co dělá. Commit, push a merge
  nech na něm, pokud výslovně neřekne jinak.
- Před commitem ověř `npm run build`.
