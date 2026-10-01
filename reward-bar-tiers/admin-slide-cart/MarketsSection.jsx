import { useState } from 'react';
import {
  Badge,
  Banner,
  BlockStack,
  Box,
  Button,
  Collapsible,
  Icon,
  IndexTable,
  InlineStack,
  Link,
  Popover,
  Text,
  TextField,
} from '@shopify/polaris';
import { ChevronDownIcon, ChevronUpIcon, SearchIcon } from '@shopify/polaris-icons';
import { usePersistentState } from '../../shared/usePersistentState.js';
import { MARKETS, REWARD_TYPES, isDefaultMarket, isMarketCustomized, marketTiers } from '../settings.js';
import { BoxHeader, IconButtonSlot } from './common.jsx';
import { MarketModal } from './MarketModal.jsx';
import './MarketsSection.css';

const CONTENT_ID = 'reward-bar-markets';
// A shorter list is quicker to scan than to search. Counted from all markets, not the found ones,
// so the search doesn't disappear while typing.
const SEARCH_MIN_MARKETS = 10;

// CUSTOM: the Setup cell is a button that opens a popover with the market's tiers – taken over
// from the Shopify admin, which does this with its own component too. Polaris IndexTable only makes
// whole rows clickable and highlights whole rows, not single cells. Built from a native <button>
// with Polaris tokens (MarketsSection.css), inside it a Polaris Badge and Icon.
// Clicks in the cell and the popover stop here, so they don't also open the modal like a row click.
// Stopping them also hides them from the other popovers' "click outside", so which popover is open
// is kept by the section – opening one closes the other.
function SetupCell({ market, entries, customized, open, onToggle, onClose, onEdit }) {
  const shown = entries.filter((entry) => !entry.hidden);
  const stop = (event) => event.stopPropagation();

  // Customized wins in any market – the merchant changed amounts or hid tiers there.
  const badge = customized ? (
    <Badge tone="info">Customized</Badge>
  ) : isDefaultMarket(market) ? (
    <Badge>Default</Badge>
  ) : (
    <Badge>Converted</Badge>
  );

  return (
    <Popover
      active={open}
      onClose={onClose}
      activator={
        <button
          type="button"
          className="cr-SetupCell"
          aria-expanded={open}
          aria-label={`${market.name} setup`}
          onClick={(event) => {
            stop(event);
            onToggle();
          }}
        >
          <InlineStack gap="100" align="start" blockAlign="center" wrap={false}>
            {badge}
            <span className="cr-SetupCell__Chevron">
              <Icon source={ChevronDownIcon} tone="subdued" />
            </span>
          </InlineStack>
        </button>
      }
    >
      <div onClick={stop}>
        <Box paddingBlockStart="200" paddingBlockEnd="300" paddingInline="300">
          <BlockStack gap="200">
            <BlockStack>
              {shown.length === 0 && (
                <Text as="p" tone="subdued">
                  All tiers are hidden in this market
                </Text>
              )}
              {shown.map(({ tier, amount }, index) => (
                <Text as="p" key={tier.id}>
                  Tier #{index + 1} • {market.currency} {amount} •{' '}
                  {REWARD_TYPES[tier.rewardType].label}
                </Text>
              ))}
            </BlockStack>
            <Button
              fullWidth
              onClick={() => {
                onClose();
                onEdit();
              }}
            >
              Edit tiers
            </Button>
          </BlockStack>
        </Box>
      </div>
    </Popover>
  );
}

// Markets part of the Reward bar card: the tiers' amounts in each market's currency.
// Changes made in the market modal go into the edited settings, so they're saved with the page's save bar.
export function MarketsSection({ settings, onChange }) {
  const { tiers, markets: changes } = settings;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [editedMarketId, setEditedMarketId] = useState(null);
  const [popoverMarketId, setPopoverMarketId] = useState(null);
  // A dismissed banner stays dismissed for this viewer (not a setting – it isn't saved with the page).
  const [bannerDismissed, setBannerDismissed] = usePersistentState('reward-bar-tiers:markets-banner-dismissed', false);

  const customizedCount = MARKETS.filter((market) => isMarketCustomized(changes[market.id], tiers)).length;
  const search = query.trim().toLowerCase();
  const found = MARKETS.filter(
    (market) => market.name.toLowerCase().includes(search) || market.currency.toLowerCase().includes(search),
  );
  const editedMarket = MARKETS.find((market) => market.id === editedMarketId);

  const toggle = () => setOpen((current) => !current);

  const applyMarket = (marketId, marketChanges) => {
    const { [marketId]: _previous, ...others } = changes;
    onChange({
      ...settings,
      markets: isMarketCustomized(marketChanges, tiers) ? { ...others, [marketId]: marketChanges } : others,
    });
    setEditedMarketId(null);
  };

  const rows = found.map((market, index) => {
    const entries = marketTiers(market, tiers, changes[market.id]);
    const customized = isMarketCustomized(changes[market.id], tiers);
    const shownCount = entries.filter((entry) => !entry.hidden).length;
    const edit = () => setEditedMarketId(market.id);

    return (
      // A click anywhere in the row opens the market's modal (Shopify admin standard),
      // the market name is the row's link for keyboard and screen reader users.
      <IndexTable.Row id={market.id} key={market.id} position={index} onClick={edit}>
        <IndexTable.Cell>
          <Link monochrome removeUnderline onClick={edit}>
            {market.name}
          </Link>
        </IndexTable.Cell>
        <IndexTable.Cell>{market.currency}</IndexTable.Cell>
        <IndexTable.Cell flush>
          <SetupCell
            market={market}
            entries={entries}
            customized={customized}
            open={popoverMarketId === market.id}
            onToggle={() => setPopoverMarketId((current) => (current === market.id ? null : market.id))}
            onClose={() => setPopoverMarketId(null)}
            onEdit={edit}
          />
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Text as="span" alignment="end" numeric>
            {shownCount}
          </Text>
        </IndexTable.Cell>
      </IndexTable.Row>
    );
  });

  return (
    <BlockStack gap="400">
      <BlockStack gap="300">
        <Text as="h3" variant="bodyMd" fontWeight="medium">
          Markets
        </Text>
        {!bannerDismissed && (
          <Banner tone="info" onDismiss={() => setBannerDismissed(true)}>
            Markets in your store currency use the tier amounts. In other markets, amounts are converted using
            Shopify's exchange rates. You can set them manually in any market.
          </Banner>
        )}
      </BlockStack>

      <Box borderWidth="025" borderColor="border" borderRadius="200" overflowX="hidden" overflowY="hidden">
        <BoxHeader
          onToggle={toggle}
          actions={
            <IconButtonSlot>
              <Button
                variant="tertiary"
                icon={open ? ChevronUpIcon : ChevronDownIcon}
                accessibilityLabel={open ? 'Collapse markets' : 'Expand markets'}
                ariaExpanded={open}
                ariaControls={CONTENT_ID}
                onClick={toggle}
              />
            </IconButtonSlot>
          }
          // The count, not a second "Markets" heading right under the section's one.
          title={
            <Text as="h4" variant="bodyMd" fontWeight="medium">
              {`${MARKETS.length} markets`}
            </Text>
          }
          badge={customizedCount > 0 && <Badge tone="info">{`${customizedCount} customized`}</Badge>}
        />

        <Collapsible id={CONTENT_ID} open={open}>
          <Box background="bg-surface">
            {/* The border separates the search from the table heading (Figma), Polaris draws only the one below it. */}
            {MARKETS.length >= SEARCH_MIN_MARKETS && (
              <Box padding="300" borderBlockEndWidth="025" borderColor="border">
                <TextField
                  label="Search market"
                  labelHidden
                  placeholder="Search market"
                  prefix={<Icon source={SearchIcon} />}
                  autoComplete="off"
                  clearButton
                  value={query}
                  onChange={setQuery}
                  onClearButtonClick={() => setQuery('')}
                />
              </Box>
            )}
            <IndexTable
              resourceName={{ singular: 'market', plural: 'markets' }}
              itemCount={found.length}
              selectable={false}
              headings={[
                { title: 'Market' },
                { title: 'Currency' },
                { title: 'Setup' },
                { title: 'Tiers', alignment: 'end' },
              ]}
            >
              {rows}
            </IndexTable>
          </Box>
        </Collapsible>
      </Box>

      {editedMarket && (
        <MarketModal
          market={editedMarket}
          tiers={tiers}
          changes={changes[editedMarket.id]}
          onApply={(marketChanges) => applyMarket(editedMarket.id, marketChanges)}
          onClose={() => setEditedMarketId(null)}
        />
      )}
    </BlockStack>
  );
}
