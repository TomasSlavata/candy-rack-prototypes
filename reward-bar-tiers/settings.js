// Settings shared by all parts of this feature.
// Admin parts edit and save them, storefront parts display them.

// Reward types a tier can unlock. Texts mark bold parts with **…** (see shared/custom/RichTextField.jsx).
// The texts can't be edited yet, so every tier of a type uses the type's default texts (Figma annotations).
// The gift product and the discount value can't be set yet – these placeholders stand in for them.
export const REWARD_TYPES = {
  freeShipping: {
    label: 'Free shipping',
    summary: 'Free shipping',
    textBefore: "You're **{{amount}}** away from **free shipping**",
    textAfter: "You've got **free shipping**",
    rewardTitle: '**Free shipping**',
  },
  freeGift: {
    label: 'Free gift',
    summary: 'Free gift',
    giftProduct: 'Herschel Classic Backpack',
    textBefore: "You're **{{amount}}** away from a **free gift**",
    textAfter: "You've got a **free gift**",
    rewardTitle: '**Free gift**',
  },
  orderDiscount: {
    label: 'Order discount',
    summary: 'Order discount',
    textBefore: "You're **{{amount}}** away from a **discount**",
    textAfter: "You've got a **discount**",
    rewardTitle: '**Discount**',
  },
};

// Max lengths of the texts (Figma annotations).
export const TEXT_MAX_LENGTH = 70;
export const REWARD_TITLE_MAX_LENGTH = 30;

export const CURRENCY = 'USD';

// Amounts are stored as typed or formatted, e.g. "1,050.00" – commas separate thousands (USD format).
// Returns a number, or null for a blank amount (a lone "." counts as blank).
export function parseAmount(value) {
  const amount = Number.parseFloat(value.replace(/,/g, ''));
  return Number.isNaN(amount) ? null : amount;
}

// "1050" → "1,050.00" – how the field shows an amount after editing, and how the tier badge shows it.
export function formatAmount(value) {
  const amount = parseAmount(value);
  return amount === null
    ? value
    : amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export const DEFAULT_SETTINGS = {
  enabled: false,
  tiers: [{ id: 'tier-1', rewardType: 'freeShipping', minimumAmount: '50.00' }],
  // Markets the merchant adjusted, by market id – see "Markets" below.
  markets: {},
  // How the bar looks in the slide cart – see "Appearance" below.
  appearance: {
    showRewardTitle: true,
    showAmount: false,
    hideWhenOneTier: true,
    textFontSize: 14,
    rewardTitleFontSize: 12,
    // Hex codes without "#", as the color fields show them.
    backgroundColor: 'F8F8F8',
    textColor: '282A2C',
    progressColor: '282A2C',
    barColor: 'DCDCDC',
    sticky: true,
  },
};

// Tiers ordered from the lowest minimum purchase amount up – applied when the settings are saved,
// so a merchant can reorder tiers just by changing their amounts. Amounts that aren't numbers go last.
export function sortTiersByAmount(settings) {
  const amount = (tier) => parseAmount(tier.minimumAmount) ?? Infinity;
  return { ...settings, tiers: [...settings.tiers].sort((a, b) => amount(a) - amount(b)) };
}

// Checks the tiers before saving. Returns a list of errors, one per tier, each with:
//   tierId   – the tier (its Minimum purchase amount field shows `field`)
//   message  – text for the error banner
//   field    – text under the Minimum purchase amount field
// The field only accepts numbers, so an amount is either blank or a number – 0 is fine
// (e.g. a free gift with any order).
export function validateTiers(tiers) {
  const label = (tier) => `Tier #${tiers.indexOf(tier) + 1}`;
  const amountOf = (tier) => parseAmount(tier.minimumAmount);

  const errors = [];
  for (const tier of tiers) {
    const amount = amountOf(tier);
    let field = null;
    if (amount === null) {
      field = "Minimum purchase amount can't be blank";
    } else {
      const sameAsOther = tiers.some((other) => other !== tier && amountOf(other) === amount);
      if (sameAsOther) field = 'Minimum purchase amount must be different from other tiers';
    }
    if (field) errors.push({ tierId: tier.id, message: `${label(tier)}: ${field}`, field });
  }
  return errors;
}

// ——— Markets ———
// The store's Shopify markets (placeholder data), in alphabetical order like the Shopify admin lists them.
// Shopify has no primary market – the tier amounts are in the store currency, and markets in that
// currency use them as they are (Default). In the others each tier's amount is converted with Shopify's
// exchange rate (Converted). In any market the merchant can set amounts manually or hide tiers (Customized).
// Rates are rough placeholders.
export const MARKETS = [
  { id: 'at', name: 'Austria', currency: 'EUR', rate: 0.86 },
  { id: 'cz', name: 'Czechia', currency: 'CZK', rate: 21.5 },
  { id: 'ec', name: 'Ecuador', currency: 'USD', rate: 1 },
  { id: 'sv', name: 'El Salvador', currency: 'USD', rate: 1 },
  { id: 'fr', name: 'France', currency: 'EUR', rate: 0.86 },
  { id: 'de', name: 'Germany', currency: 'EUR', rate: 0.86 },
  { id: 'hu', name: 'Hungary', currency: 'HUF', rate: 345 },
  { id: 'pl', name: 'Poland', currency: 'PLN', rate: 3.7 },
  { id: 'pr', name: 'Puerto Rico', currency: 'USD', rate: 1 },
  { id: 'ro', name: 'Romania', currency: 'RON', rate: 4.35 },
  { id: 'sk', name: 'Slovakia', currency: 'EUR', rate: 0.86 },
  { id: 'es', name: 'Spain', currency: 'EUR', rate: 0.86 },
  { id: 'gb', name: 'United Kingdom', currency: 'GBP', rate: 0.75 },
  { id: 'us', name: 'United States', currency: 'USD', rate: 1 },
];

// A market in the store currency – its amounts are the tiers' own, nothing to convert.
export const isDefaultMarket = (market) => market.currency === CURRENCY;

// What the merchant changed in one market (stored in settings.markets[marketId]):
//   amounts      – { tierId: "50.00" } amounts typed for tiers, a blank amount means the tier's own
//                  amount (Default market) or the converted one (other markets)
//   hiddenTiers  – ids of tiers that don't show in this market
export const EMPTY_MARKET = { amounts: {}, hiddenTiers: [] };

export const marketLabel = (market) => `${market.name} (${market.currency})`;

// A tier's amount converted to the market currency, rounded to whole units like Shopify's price rounding.
// A Default market takes the tier's amount as it is.
export function convertedAmount(tier, market) {
  if (isDefaultMarket(market)) return formatAmount(tier.minimumAmount);
  const amount = parseAmount(tier.minimumAmount);
  return amount === null ? '' : formatAmount(String(Math.round(amount * market.rate)));
}

// Drops changes that don't count – blank amounts and tiers deleted since.
export function cleanMarket(changes, tiers) {
  const ids = new Set(tiers.map((tier) => tier.id));
  const amounts = Object.fromEntries(
    Object.entries(changes?.amounts ?? {}).filter(([id, value]) => ids.has(id) && parseAmount(value) !== null),
  );
  const hiddenTiers = (changes?.hiddenTiers ?? []).filter((id) => ids.has(id));
  return { amounts, hiddenTiers };
}

export function isMarketCustomized(changes, tiers) {
  const { amounts, hiddenTiers } = cleanMarket(changes, tiers);
  return Object.keys(amounts).length > 0 || hiddenTiers.length > 0;
}

// Every tier as it applies in the market: { tier, amount, custom, hidden }, in the market's own order –
// shown tiers from the lowest amount up (like the tiers after saving), hidden tiers after them.
// Tier numbers in a market follow this order.
export function marketTiers(market, tiers, changes) {
  const { amounts, hiddenTiers } = cleanMarket(changes, tiers);
  const entries = tiers.map((tier) => ({
    tier,
    amount: amounts[tier.id] ?? convertedAmount(tier, market),
    custom: tier.id in amounts,
    hidden: hiddenTiers.includes(tier.id),
  }));
  const value = (entry) => (entry.hidden ? 1 : 0) * 1e15 + (parseAmount(entry.amount) ?? 1e14);
  return entries.sort((a, b) => value(a) - value(b));
}

// Checks the amounts typed in a market before they're applied – same rule as for the tiers themselves:
// shown tiers can't share an amount. Returns { tierId: error text }.
export function validateMarket(market, tiers, changes) {
  const shown = marketTiers(market, tiers, changes).filter((entry) => !entry.hidden);
  const errors = {};
  for (const entry of shown) {
    const amount = parseAmount(entry.amount);
    if (amount === null) continue;
    if (shown.some((other) => other !== entry && parseAmount(other.amount) === amount)) {
      errors[entry.tier.id] = 'Minimum purchase amount must be different from other tiers';
    }
  }
  return errors;
}

// ——— Appearance ———
// Both font sizes (Figma annotations).
export const FONT_SIZE = { min: 10, max: 20, step: 1 };

// ——— Storefront ———
// The market the storefront and the admin preview show – the store's own (USD), so they use the tiers'
// amounts as they are, without hidden tiers or amounts set for that market.
export const STORE_MARKET = MARKETS.find((market) => market.id === 'us');

// What the rewards bar shows for a cart total:
//   tiers    – shown tiers from the lowest amount up: { tier, amount, progress (0–1 of its own part of the bar) }
//   text     – the next tier's "Text before reward" with {{amount}} = what's left to spend,
//              or the last tier's "Text after reward" once every tier is unlocked
//   missing  – what's left to spend for the next tier (null once all are unlocked)
// Tiers without a valid amount are left out (they can't be saved anyway). Null when no tier is left.
export function rewardsBarState(settings, cartTotal, market = STORE_MARKET) {
  const tiers = marketTiers(market, settings.tiers, settings.markets?.[market.id])
    .filter((entry) => !entry.hidden && parseAmount(entry.amount) !== null)
    .map((entry) => ({ tier: entry.tier, amount: parseAmount(entry.amount) }));
  if (tiers.length === 0) return null;

  // Each tier fills its part of the bar from the previous tier's amount up to its own.
  const withProgress = tiers.map((entry, index) => {
    const from = index === 0 ? 0 : tiers[index - 1].amount;
    const span = entry.amount - from;
    const progress = span > 0 ? (cartTotal - from) / span : cartTotal >= entry.amount ? 1 : 0;
    return { ...entry, progress: Math.min(1, Math.max(0, progress)) };
  });

  const next = tiers.find((entry) => cartTotal < entry.amount);
  const reward = (entry) => REWARD_TYPES[entry.tier.rewardType];
  return {
    tiers: withProgress,
    text: next ? reward(next).textBefore : reward(tiers.at(-1)).textAfter,
    missing: next ? next.amount - cartTotal : null,
  };
}
