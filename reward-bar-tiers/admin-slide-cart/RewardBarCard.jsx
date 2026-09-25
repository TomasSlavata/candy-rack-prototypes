import { useEffect, useState } from 'react';
import {
  ActionList,
  Badge,
  BlockStack,
  Box,
  Button,
  Card,
  Collapsible,
  Icon,
  InlineStack,
  Popover,
  Select,
  Text,
  TextField,
  Tooltip,
} from '@shopify/polaris';
import {
  ChevronDownIcon,
  ChevronUpIcon,
  DeleteIcon,
  InfoIcon,
  MenuHorizontalIcon,
  PlusCircleIcon,
} from '@shopify/polaris-icons';
import { BoxButton } from '../../shared/custom/BoxButton.jsx';
import { RichTextField } from '../../shared/custom/RichTextField.jsx';
import { CURRENCY, REWARD_TYPES } from '../settings.js';

const AMOUNT_STEP = 50;
const MAX_TIERS = 3;

const REWARD_TYPE_OPTIONS = Object.entries(REWARD_TYPES).map(([value, { label }]) => ({ value, label }));

const formatAmount = (amount) => {
  const number = Number.parseFloat(amount);
  return Number.isNaN(number) ? amount : number.toFixed(2);
};

const newTierId = () => `tier-${Date.now()}`;

// CUSTOM: Polaris Badge puts its icon before the text, the design has the info icon after it.
// Built to look like the Polaris Badge (same tokens), the icon shows the gift product in a tooltip.
function TierBadge({ children, info }) {
  return (
    <Box
      background="bg-fill-transparent-secondary"
      borderRadius="200"
      paddingInline="200"
      paddingBlock={info ? '0' : '050'}
    >
      <InlineStack gap="100" blockAlign="center" wrap={false}>
        <Text as="span" variant="bodySm" fontWeight="medium" tone="subdued">
          {children}
        </Text>
        {info && (
          <Tooltip content={info}>
            <Text as="span" tone="subdued">
              <Icon source={InfoIcon} tone="inherit" accessibilityLabel={info} />
            </Text>
          </Tooltip>
        )}
      </InlineStack>
    </Box>
  );
}

// Polaris tertiary icon buttons have a -4px margin, so they bleed into the space around them.
// The design places them exactly (28 × 28, 4px apart), so each one gets the 4px back.
// InlineStack keeps the button out of a text line, which would add a few pixels below it.
function IconButtonSlot({ children }) {
  return (
    <Box padding="100">
      <InlineStack>{children}</InlineStack>
    </Box>
  );
}

function TierMenu({ canDelete, onDelete }) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <Popover
      active={open}
      onClose={close}
      preferredAlignment="center"
      activator={
        <InlineStack>
          <Button
            variant="tertiary"
            icon={MenuHorizontalIcon}
            accessibilityLabel="Tier actions"
            onClick={() => setOpen((current) => !current)}
          />
        </InlineStack>
      }
    >
      <ActionList
        actionRole="menuitem"
        onActionAnyItem={close}
        items={[{ content: 'Delete', icon: DeleteIcon, destructive: true, disabled: !canDelete, onAction: onDelete }]}
      />
    </Popover>
  );
}

function Tier({ tier, number, open, canDelete, onToggle, onOpened, onChange, onDelete }) {
  const reward = REWARD_TYPES[tier.rewardType];
  const contentId = `${tier.id}-settings`;

  // Clicks on the buttons (and inside the menu popover, which React bubbles up here) keep their own action.
  const onHeaderClick = (event) => {
    if (!event.target.closest('button')) onToggle();
  };

  return (
    <Box id={tier.id} borderWidth="025" borderColor="border" borderRadius="200" overflowX="hidden" overflowY="hidden">
      {/* CUSTOM: the whole header toggles the tier – Polaris Box can't be clicked.
          Keyboard and screen reader users use the chevron button. */}
      <div onClick={onHeaderClick} style={{ cursor: 'pointer' }}>
        <Box background="bg-surface-hover" padding="300">
          <InlineStack align="space-between" blockAlign="center" gap="200" wrap={false}>
            <InlineStack gap="200" blockAlign="center">
              <Text as="h3" variant="bodyMd" fontWeight="medium">
                Tier #{number}
              </Text>
              <TierBadge info={reward.giftProduct}>
                Spend {CURRENCY} {formatAmount(tier.minimumAmount)} → {reward.summary}
              </TierBadge>
            </InlineStack>

            <InlineStack gap="100" wrap={false}>
              <IconButtonSlot>
                <TierMenu canDelete={canDelete} onDelete={onDelete} />
              </IconButtonSlot>
              <IconButtonSlot>
                <Button
                  variant="tertiary"
                  icon={open ? ChevronUpIcon : ChevronDownIcon}
                  accessibilityLabel={open ? `Collapse tier ${number}` : `Expand tier ${number}`}
                  ariaExpanded={open}
                  ariaControls={contentId}
                  onClick={onToggle}
                />
              </IconButtonSlot>
            </InlineStack>
          </InlineStack>
        </Box>
      </div>

      <Collapsible id={contentId} open={open} onAnimationEnd={() => open && onOpened()}>
        <Box background="bg-surface" padding="300">
          <BlockStack gap="300">
            <Select
              label="Reward type"
              options={REWARD_TYPE_OPTIONS}
              value={tier.rewardType}
              onChange={(rewardType) => onChange({ rewardType })}
            />
            <TextField
              label="Minimum purchase amount"
              prefix={CURRENCY}
              inputMode="decimal"
              autoComplete="off"
              value={tier.minimumAmount}
              onChange={(minimumAmount) => onChange({ minimumAmount })}
              onBlur={() => onChange({ minimumAmount: formatAmount(tier.minimumAmount) })}
            />
            <RichTextField label="Text before reward" value={reward.textBefore} variables />
            <RichTextField label="Text after reward" value={reward.textAfter} />
          </BlockStack>
        </Box>
      </Collapsible>
    </Box>
  );
}

// Reward bar section of the slide cart settings: on/off and up to 3 reward tiers.
// Only one tier is open at a time, a new tier opens right away.
export function RewardBarCard({ settings, onChange }) {
  const { enabled, tiers } = settings;
  const [openTierId, setOpenTierId] = useState(tiers[0]?.id);
  const [addedTierId, setAddedTierId] = useState(null);

  // A new tier is added closed and opens one frame later, so it expands while the previous one collapses –
  // the two animations cancel out and the card keeps its height instead of jumping.
  useEffect(() => {
    if (!addedTierId) return;
    const frame = requestAnimationFrame(() => setOpenTierId(addedTierId));
    return () => cancelAnimationFrame(frame);
  }, [addedTierId]);

  // Once the new tier is open, scroll it into view if it ended up off screen (mostly on mobile).
  const onTierOpened = (id) => {
    if (id !== addedTierId) return;
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    setAddedTierId(null);
  };

  const setTiers = (nextTiers) => onChange({ ...settings, tiers: nextTiers });
  const updateTier = (id, patch) => setTiers(tiers.map((tier) => (tier.id === id ? { ...tier, ...patch } : tier)));

  const addTier = () => {
    const highestAmount = Math.max(0, ...tiers.map((tier) => Number.parseFloat(tier.minimumAmount) || 0));
    const usedTypes = new Set(tiers.map((tier) => tier.rewardType));
    const rewardType = Object.keys(REWARD_TYPES).find((type) => !usedTypes.has(type)) ?? 'orderDiscount';
    const tier = { id: newTierId(), rewardType, minimumAmount: formatAmount(highestAmount + AMOUNT_STEP) };
    setTiers([...tiers, tier]);
    setAddedTierId(tier.id);
  };

  const deleteTier = (id) => setTiers(tiers.filter((tier) => tier.id !== id));

  return (
    <Card>
      <BlockStack gap="400">
        <InlineStack align="space-between" blockAlign="start">
          <InlineStack gap="200" blockAlign="center">
            <Text as="h2" variant="headingSm">
              Reward bar
            </Text>
            {enabled ? <Badge tone="success">On</Badge> : <Badge>Off</Badge>}
          </InlineStack>
          <Button onClick={() => onChange({ ...settings, enabled: !enabled })}>
            {enabled ? 'Turn off' : 'Turn on'}
          </Button>
        </InlineStack>

        {tiers.map((tier, index) => (
          <Tier
            key={tier.id}
            tier={tier}
            number={index + 1}
            open={openTierId === tier.id}
            canDelete={tiers.length > 1}
            onToggle={() => setOpenTierId(openTierId === tier.id ? null : tier.id)}
            onOpened={() => onTierOpened(tier.id)}
            onChange={(patch) => updateTier(tier.id, patch)}
            onDelete={() => deleteTier(tier.id)}
          />
        ))}

        {tiers.length < MAX_TIERS && (
          <BoxButton icon={PlusCircleIcon} onClick={addTier}>
            Add tier
          </BoxButton>
        )}
      </BlockStack>
    </Card>
  );
}
