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

export const DEFAULT_SETTINGS = {
  enabled: false,
  tiers: [{ id: 'tier-1', rewardType: 'freeShipping', minimumAmount: '50.00' }],
};
