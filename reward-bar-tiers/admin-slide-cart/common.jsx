import { Box, Icon, InlineStack, Text, Tooltip } from '@shopify/polaris';
import { InfoIcon } from '@shopify/polaris-icons';

// Pieces used by both the tiers and the markets.

// The amount field takes numbers only: digits, commas as thousands separators and one decimal point,
// max 2 decimals. Anything else typed or pasted is left out.
export const toAmountInput = (value) => {
  const [whole, ...rest] = value.replace(/[^\d.,]/g, '').split('.');
  return rest.length > 0 ? `${whole}.${rest.join('').replace(/,/g, '').slice(0, 2)}` : whole;
};

// CUSTOM: Polaris Badge puts its icon before the text, the design has the info icon after it.
// Built to look like the Polaris Badge (same tokens as its default and critical tone),
// the icon shows the gift product in a tooltip. `disabled` greys it out (a hidden tier).
export function TierBadge({ children, info, critical, disabled }) {
  const tone = critical ? 'critical' : disabled ? 'disabled' : 'subdued';
  const background = critical
    ? 'bg-fill-critical-secondary'
    : disabled
      ? 'bg-fill-disabled'
      : 'bg-fill-transparent-secondary';
  return (
    <Box background={background} borderRadius="200" paddingInline="200" paddingBlock={info ? '0' : '050'}>
      <InlineStack gap="100" blockAlign="center" wrap={false}>
        <Text as="span" variant="bodySm" fontWeight="medium" tone={tone}>
          {children}
        </Text>
        {info && (
          <Tooltip content={info}>
            <Text as="span" tone={tone}>
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
export function IconButtonSlot({ children }) {
  return (
    <Box padding="100">
      <InlineStack>{children}</InlineStack>
    </Box>
  );
}

// Grey header of a bordered box that opens and closes (a tier, the markets list).
// CUSTOM: the whole header toggles the box – Polaris Box can't be clicked.
// Keyboard and screen reader users use the chevron button in `actions`.
export function BoxHeader({ onToggle, actions, children }) {
  // Clicks on the buttons (and inside popovers, which React bubbles up here) keep their own action.
  const onClick = (event) => {
    if (!event.target.closest('button')) onToggle();
  };

  return (
    <div onClick={onClick} style={{ cursor: 'pointer' }}>
      <Box background="bg-surface-hover" padding="300">
        <InlineStack align="space-between" blockAlign="center" gap="200" wrap={false}>
          <InlineStack gap="200" blockAlign="center">
            {children}
          </InlineStack>
          <InlineStack gap="100" wrap={false}>
            {actions}
          </InlineStack>
        </InlineStack>
      </Box>
    </div>
  );
}
