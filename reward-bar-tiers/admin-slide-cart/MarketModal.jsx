import { useState } from 'react';
import { BlockStack, Box, Button, InlineStack, Modal, Text, TextField, Tooltip } from '@shopify/polaris';
import { HideIcon, ViewIcon } from '@shopify/polaris-icons';
import {
  EMPTY_MARKET,
  REWARD_TYPES,
  cleanMarket,
  convertedAmount,
  formatAmount,
  isMarketCustomized,
  marketLabel,
  marketTiers,
  validateMarket,
} from '../settings.js';
import { TierBadge, toAmountInput } from './common.jsx';

// One tier's row.
function TierAmount({ entry, value, number, currency, placeholder, error, onChange, onBlur, onToggleHidden }) {
  const { tier, amount, hidden } = entry;
  const reward = REWARD_TYPES[tier.rewardType];
  const toggleLabel = hidden ? 'Show tier' : 'Hide tier';

  return (
    <BlockStack gap="100">
      <InlineStack align="space-between" blockAlign="end" gap="200" wrap={false}>
        {/* minWidth 0 lets a long badge end with "…" instead of pushing out of the modal. */}
        <Box minWidth="0">
          <InlineStack align="start" gap="200" blockAlign="center">
            <Text as="span" tone={hidden ? 'disabled' : undefined}>
              Tier #{number}
            </Text>
            <Box minWidth="0">
              <TierBadge info={reward.giftProduct} disabled={hidden}>
                {currency} {formatAmount(amount)} → {reward.summary}
              </TierBadge>
            </Box>
          </InlineStack>
        </Box>
        <Tooltip content={toggleLabel}>
          <InlineStack>
            <Button
              variant="tertiary"
              size="micro"
              icon={hidden ? HideIcon : ViewIcon}
              accessibilityLabel={`${toggleLabel} #${number}`}
              onClick={onToggleHidden}
            />
          </InlineStack>
        </Tooltip>
      </InlineStack>
      {/* Polaris doesn't grey out the prefix of a disabled field – as Text it gets the disabled color. */}
      <TextField
        label={`Tier #${number} minimum purchase amount`}
        labelHidden
        prefix={
          <Text as="span" tone={hidden ? 'disabled' : 'subdued'}>
            {currency}
          </Text>
        }
        inputMode="decimal"
        autoComplete="off"
        placeholder={placeholder}
        disabled={hidden}
        value={value}
        error={error}
        onChange={onChange}
        onBlur={onBlur}
      />
    </BlockStack>
  );
}

// APP BRIDGE: modal – in production a Shopify admin modal (ui-modal), here the Polaris Modal.
// Amounts of all tiers in one market. A blank field uses the tier's own amount (Default market)
// or the converted one (other markets) – shown as the placeholder.
// Save hands the changes back to the page – they're saved with its save bar.
// Tiers keep the market's order from when the modal opened, so they don't jump while typing –
// the new order (by amount, hidden last) shows the next time.
export function MarketModal({ market, tiers, changes, onApply, onClose }) {
  const [initial] = useState(() => cleanMarket(changes ?? EMPTY_MARKET, tiers));
  const [draft, setDraft] = useState(initial);
  const [order] = useState(() => marketTiers(market, tiers, initial).map((entry) => entry.tier.id));
  // Like the page: errors show after Save and then follow the edits.
  const [showErrors, setShowErrors] = useState(false);

  const position = (entry) => order.indexOf(entry.tier.id);
  const entries = marketTiers(market, tiers, draft).sort((a, b) => position(a) - position(b));
  const errors = showErrors ? validateMarket(market, tiers, draft) : {};
  const isDirty = JSON.stringify(cleanMarket(draft, tiers)) !== JSON.stringify(initial);

  const setAmount = (tierId, value) => setDraft((current) => ({ ...current, amounts: { ...current.amounts, [tierId]: value } }));
  const toggleHidden = (tierId) =>
    setDraft((current) => ({
      ...current,
      hiddenTiers: current.hiddenTiers.includes(tierId)
        ? current.hiddenTiers.filter((id) => id !== tierId)
        : [...current.hiddenTiers, tierId],
    }));

  const save = () => {
    if (Object.keys(validateMarket(market, tiers, draft)).length > 0) {
      setShowErrors(true);
      return;
    }
    onApply(cleanMarket(draft, tiers));
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={marketLabel(market)}
      primaryAction={{ content: 'Save', disabled: !isDirty, onAction: save }}
      secondaryActions={[{ content: 'Cancel', onAction: onClose }]}
      footer={
        <Button disabled={!isMarketCustomized(draft, tiers)} onClick={() => setDraft(EMPTY_MARKET)}>
          Restore to defaults
        </Button>
      }
    >
      <Modal.Section>
        <BlockStack gap="400">
          {entries.map((entry, index) => (
            <TierAmount
              key={entry.tier.id}
              entry={entry}
              value={draft.amounts[entry.tier.id] ?? ''}
              number={index + 1}
              currency={market.currency}
              placeholder={convertedAmount(entry.tier, market)}
              error={errors[entry.tier.id]}
              onChange={(value) => setAmount(entry.tier.id, toAmountInput(value))}
              onBlur={() => setAmount(entry.tier.id, formatAmount(draft.amounts[entry.tier.id] ?? ''))}
              onToggleHidden={() => toggleHidden(entry.tier.id)}
            />
          ))}
        </BlockStack>
      </Modal.Section>
    </Modal>
  );
}
