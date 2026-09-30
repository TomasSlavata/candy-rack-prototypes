import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { BlockStack, Box, Icon, InlineStack, Text, Tooltip } from '@shopify/polaris';
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
// A text too long for the space ends with "…" (Polaris Text truncate), the info icon stays after it.
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
        {/* minWidth 0 lets the text get narrower than itself, so truncate can cut it. */}
        <Box minWidth="0">
          <Text as="p" variant="bodySm" fontWeight="medium" tone={tone} truncate>
            {children}
          </Text>
        </Box>
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

// CUSTOM: fits the title, badge and buttons on one line when they fit (Figma), otherwise puts the badge
// on its own line under the title and buttons, across the full width. Polaris InlineStack can only wrap
// the badge next to the buttons, and Polaris breakpoints follow the window, not the text length –
// so the header measures itself. Layout is Polaris only, the hook just picks one of the two.
//   one line   – badge squeezed next to the title; if its text gets cut with "…" (or wraps),
//                there isn't room → two lines
//   two lines  – badge has the full width (a very long one ends with "…" there); if it's whole again
//                and title + badge + buttons would fit side by side → one line again
// Measured after every render before the page is painted (useLayoutEffect), and again when the header
// or badge resizes.
function useSingleLine({ row, title, badge, actions }) {
  const [singleLine, setSingleLine] = useState(true);
  // Header and badge width when it last switched to two lines. It only goes back to one line after
  // the header got wider or the badge shorter since – otherwise a width right at the edge could switch
  // back and forth forever (which crashes the page).
  const switchedAt = useRef(null);

  const check = () => {
    // Without a badge the title and buttons always fit on one line.
    if (!badge.current) {
      switchedAt.current = null;
      if (!singleLine) setSingleLine(true);
      return;
    }
    const width = (ref) => ref.current.getBoundingClientRect().width;
    // Squeezed: its text got cut with "…" (TierBadge) or wrapped (got taller than the title line).
    const cut = [...badge.current.querySelectorAll('.Polaris-Text--truncate')].some(
      (text) => text.scrollWidth > text.clientWidth + 1,
    );
    const badgeWrapped = cut || badge.current.getBoundingClientRect().height > title.current.getBoundingClientRect().height + 1;
    if (singleLine) {
      if (badgeWrapped) {
        switchedAt.current = { row: width(row), badge: null };
        setSingleLine(false);
      }
      return;
    }
    // First check on two lines: note the badge's full width (on one line it was squeezed).
    const since = switchedAt.current ?? { row: width(row), badge: null };
    if (since.badge === null) since.badge = width(badge);
    switchedAt.current = since;
    const changed = width(row) > since.row + 1 || width(badge) < since.badge - 1;
    // The gap of the title + buttons stack – the same gap="200" the one-line layout uses.
    const gap = parseFloat(getComputedStyle(row.current.querySelector('.Polaris-InlineStack')).columnGap) || 0;
    const needed = width(title) + gap + width(badge) + gap + width(actions);
    // 1px to spare, so it surely doesn't wrap again on one line.
    if (changed && !badgeWrapped && needed <= width(row) - 1) {
      switchedAt.current = null;
      setSingleLine(true);
    }
  };
  const latestCheck = useRef(check);
  latestCheck.current = check;

  // After every render – the badge text may have changed (e.g. a new amount).
  useLayoutEffect(() => latestCheck.current());

  // When the header or badge changes size without a render (window resized, layout switched).
  useEffect(() => {
    const observer = new ResizeObserver(() => latestCheck.current());
    observer.observe(row.current);
    if (badge.current) observer.observe(badge.current);
    return () => observer.disconnect();
  }, [singleLine, row, badge]);

  return singleLine;
}

// Grey header of a bordered box that opens and closes (a tier, the markets list):
// `title`, an optional `badge` and `actions` (icon buttons, top right).
// CUSTOM: the whole header toggles the box – Polaris Box can't be clicked.
// Keyboard and screen reader users use the chevron button in `actions`.
export function BoxHeader({ onToggle, actions, title, badge }) {
  const row = useRef(null);
  const titleRef = useRef(null);
  const badgeRef = useRef(null);
  const actionsRef = useRef(null);
  const singleLine = useSingleLine({ row, title: titleRef, badge: badgeRef, actions: actionsRef });

  // Clicks on the buttons (and inside popovers, which React bubbles up here) keep their own action.
  const onClick = (event) => {
    if (!event.target.closest('button')) onToggle();
  };

  // Plain divs carry the refs for measuring. The title's one keeps "Tier #1" from being squeezed
  // onto two lines – only the badge gives way.
  // The 4px around the title centers its line on the 28px buttons, as in Figma.
  const titleMarkup = (
    <div ref={titleRef} style={{ flexShrink: 0 }}>
      <Box paddingBlock="100">{title}</Box>
    </div>
  );
  // minWidth 0 lets the badge get narrower than its text, so a long one ends with "…" instead of
  // pushing the buttons out.
  const badgeMarkup = badge && (
    <div ref={badgeRef} style={{ minWidth: 0 }}>
      {badge}
    </div>
  );
  const actionsMarkup = (
    <div ref={actionsRef}>
      <InlineStack gap="100" wrap={false}>
        {actions}
      </InlineStack>
    </div>
  );

  return (
    <div onClick={onClick} style={{ cursor: 'pointer' }}>
      <Box background="bg-surface-hover" padding="300">
        <div ref={row}>
          {singleLine ? (
            <InlineStack align="space-between" blockAlign="start" gap="200" wrap={false}>
              <InlineStack align="start" gap="200" blockAlign="center" wrap={false}>
                {titleMarkup}
                {badgeMarkup}
              </InlineStack>
              {actionsMarkup}
            </InlineStack>
          ) : (
            <BlockStack gap="100">
              <InlineStack align="space-between" blockAlign="start" gap="200" wrap={false}>
                {titleMarkup}
                {actionsMarkup}
              </InlineStack>
              <InlineStack align="start">{badgeMarkup}</InlineStack>
            </BlockStack>
          )}
        </div>
      </Box>
    </div>
  );
}
