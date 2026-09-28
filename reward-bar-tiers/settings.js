// Settings shared by all parts of this feature.
// Admin parts edit and save them, storefront parts display them.

// Reward types a tier can unlock. Texts mark bold parts with **…** (see shared/custom/RichTextField.jsx).
// The gift product and the discount value can't be set yet – these placeholders stand in for them.
export const REWARD_TYPES = {
  freeShipping: {
    label: 'Free shipping',
    summary: 'Free shipping',
    textBefore: "You're **{{amount}}** away from **free shipping**",
    textAfter: "You've got **free shipping**",
  },
  freeGift: {
    label: 'Free gift',
    summary: 'Free gift',
    giftProduct: 'Herschel Classic Backpack',
    textBefore: "You're **{{amount}}** away from a **free gift**",
    textAfter: "You've got a **free gift**",
  },
  orderDiscount: {
    label: 'Order discount',
    summary: '10% off order',
    textBefore: "You're **{{amount}}** away from **10% off** your order",
    textAfter: "You've got **10% off** your order",
  },
};

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
