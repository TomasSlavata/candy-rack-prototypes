import { useState } from 'react';
import {
  Badge,
  Banner,
  BlockStack,
  Box,
  Button,
  Card,
  Image,
  InlineGrid,
  InlineStack,
  Link,
  List,
  Navigation,
  Page,
  Popover,
  Text,
  Toast,
  useBreakpoints,
} from '@shopify/polaris';
import { MenuIcon } from '@shopify/polaris-icons';
import { renderAdmin } from '../../shared/admin/AdminShell.jsx';
import { AdminTopBar, SaveBar } from '../../shared/custom/SaveBar.jsx';
import { useMediaQuery } from '../../shared/custom/useMediaQuery.js';
import { useFeatureSettings } from '../../shared/usePersistentState.js';
import appIcon from '../../shared/admin/candy-rack-icon.png';
import dayCream from '../../shared/storefront/images/day-cream.png';
import { SlideCart } from '../../shared/storefront/SlideCart.jsx';
import { CURRENCY, DEFAULT_SETTINGS, sortTiersByAmount, validateTiers } from '../settings.js';
import { RewardsBar } from '../RewardsBar.jsx';
import { RewardBarCard } from './RewardBarCard.jsx';

// Page layout from Figma "4.0 Responsive Layout":
//   1280+      three columns: SC navigation card | settings card | preview
//   1040–1279  two columns: settings card | preview, SC navigation moves into the Menu button
//   0–1039     one column, the admin navigation disappears below 768 (Polaris Frame does that)
// 1280 isn't a Polaris breakpoint (Polaris xl is 1440), so it's checked with a custom hook.
const WIDE_LAYOUT_QUERY = '(min-width: 1280px)';
// minmax(0, 1fr) lets the settings column get narrower than its content (e.g. the markets table,
// which then scrolls sideways) – a plain 1fr would stop at the content width and push the page wider.
const WIDE_COLUMNS = '240px minmax(0, 1fr) 390px';
const TWO_COLUMNS = 'minmax(0, 1fr) 390px';
const APP_MAX_WIDTH = '1404px';

// Height of the empty navigation card, taken from Figma – replaced by real content later.
const NAV_CARD_HEIGHT = '576px';

// The sample cart in the preview (Figma). Its quantity can be changed to see the tiers unlock.
const PREVIEW_CART = [{ id: 'day-cream', title: 'Day Cream', variant: '160 ml', price: 14.99, quantity: 1, image: dayCream }];

// APP BRIDGE: title bar – the app name row the Shopify admin shows above the app.
function AppHeader() {
  return (
    <Box
      background="bg"
      borderBlockEndWidth="025"
      borderColor="border-secondary"
      paddingInline={{ xs: '400', md: '300' }}
      paddingBlock={{ xs: '400', md: '300' }}
    >
      <InlineStack gap="200" blockAlign="center">
        <Box borderRadius="150" overflowX="hidden" overflowY="hidden">
          <InlineStack>
            <Image source={appIcon} alt="" width={20} height={20} />
          </InlineStack>
        </Box>
        <Text as="span" variant="bodyLg">
          Candy Rack
        </Text>
      </InlineStack>
    </Box>
  );
}

// Slide cart sections below 1280 px – same content as the navigation card, in a popover.
function SectionsMenu() {
  const [open, setOpen] = useState(false);

  return (
    <Popover
      active={open}
      onClose={() => setOpen(false)}
      preferredAlignment="left"
      activator={
        <Button icon={MenuIcon} disclosure onClick={() => setOpen((current) => !current)}>
          Menu
        </Button>
      }
    >
      {/* Empty for now – the sections come later. */}
      <Box minWidth="194px" minHeight="200px" />
    </Popover>
  );
}

// CUSTOM: keeps the preview in view while the settings scroll – 16px under the admin top bar.
// Polaris Box can be sticky, but its offset only takes space tokens, not the top bar height + 16px.
// Only next to the settings (1040+); in one column the preview would cover them.
const PREVIEW_STICKY_STYLE = {
  position: 'sticky',
  top: 'calc(var(--pg-top-bar-height) + var(--p-space-400))',
};

// Preview of the slide cart with the edited settings, before they're saved – the same slide cart and
// rewards bar the storefront part shows. Line item offers and embedded block offers are left out.
function SlideCartPreview({ settings }) {
  const { lgUp } = useBreakpoints();
  const [items, setItems] = useState(PREVIEW_CART);
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div style={lgUp ? PREVIEW_STICKY_STYLE : undefined}>
      <Card padding="0">
        {/* The delete and close buttons do nothing – the preview always shows its sample cart. */}
        <SlideCart
          items={items}
          currency={CURRENCY}
          top={settings.enabled && <RewardsBar settings={settings} cartTotal={total} />}
          stickyTop={settings.appearance.sticky}
          totalLabel="Estimated total"
          showDiscount
          onQuantityChange={(id, quantity) =>
            setItems((current) => current.map((item) => (item.id === id ? { ...item, quantity } : item)))
          }
        />
      </Card>
    </div>
  );
}

function SlideCartSettings() {
  const isWide = useMediaQuery(WIDE_LAYOUT_QUERY);
  // `saved` lives in the browser (survives reloads, shared with the storefront part), `settings` is the edited copy.
  const [saved, save, reset] = useFeatureSettings(DEFAULT_SETTINGS);
  const [settings, setSettings] = useState(saved);
  const isDirty = JSON.stringify(settings) !== JSON.stringify(saved);
  const [toast, setToast] = useState(null);

  // After a failed Save, like in Shopify admin:
  //   banner  – lists the errors found at that Save and stays as it is until the next Save
  //   fields and tier badges – follow the edits right away (a fixed field loses its error)
  const [bannerErrors, setBannerErrors] = useState([]);
  const fieldErrors = bannerErrors.length > 0 ? validateTiers(settings.tiers) : [];
  const [focusRequest, setFocusRequest] = useState(null);
  const focusTier = (tierId, focusField = false) => {
    // The banner can still list a tier that has been deleted since.
    if (!settings.tiers.some((tier) => tier.id === tierId)) return;
    setFocusRequest((current) => ({ tierId, focusField, key: (current?.key ?? 0) + 1 }));
  };

  const saveSettings = () => {
    const found = validateTiers(settings.tiers);
    if (found.length > 0) {
      // Not saved – the save bar stays, the first tier with an error opens.
      setBannerErrors(found);
      focusTier(found[0].tierId);
      return;
    }
    const sorted = sortTiersByAmount(settings);
    save(sorted);
    setSettings(sorted);
    setBannerErrors([]);
    setToast('Settings saved');
  };

  const discardChanges = () => {
    setSettings(saved);
    setBannerErrors([]);
  };

  // Restoring defaults saves them right away, so the save bar doesn't show up.
  const restoreDefaults = () => {
    reset();
    setSettings(DEFAULT_SETTINGS);
    setBannerErrors([]);
    setToast('Default settings restored');
  };

  return (
    <>
      <SaveBar open={isDirty} onSave={saveSettings} onDiscard={discardChanges} />

      <AppHeader />

      {/* Note: InlineStack passes its align down – every InlineStack inside that relies on the
          default (start) alignment has to set align="start" itself. */}
      <InlineStack align="center">
        <Box width="100%" maxWidth={APP_MAX_WIDTH}>
          <Page
            fullWidth
            title="Slide cart"
            titleMetadata={<Badge>Inactive</Badge>}
            secondaryActions={[{ content: 'Restore to defaults', onAction: restoreDefaults }]}
          >
            {/* Polaris Page adds no space below the content, the Shopify admin has 20 px under the last card. */}
            <Box paddingBlockEnd="500">
              <BlockStack gap="400">
                {bannerErrors.length > 0 && (
                  <Banner
                    tone="critical"
                    title={
                      bannerErrors.length === 1
                        ? 'There is 1 error in these settings:'
                        : `There are ${bannerErrors.length} errors in these settings:`
                    }
                  >
                    {/* Each error opens its tier – only one tier can be open, so the list is the way around. */}
                    <List type="bullet">
                      {bannerErrors.map((error) => (
                        <List.Item key={error.message}>
                          <Link monochrome onClick={() => focusTier(error.tierId, true)}>
                            {error.message}
                          </Link>
                        </List.Item>
                      ))}
                    </List>
                  </Banner>
                )}

                {!isWide && (
                  // Cards go edge to edge below 490 px, the button keeps the page padding.
                  <Box paddingInline={{ xs: '400', sm: '0' }}>
                    <SectionsMenu />
                  </Box>
                )}

                <InlineGrid
                  columns={isWide ? WIDE_COLUMNS : { xs: 1, lg: TWO_COLUMNS }}
                  gap="400"
                  alignItems="start"
                >
                  {isWide && (
                    <Card padding="0">
                      <Box minHeight={NAV_CARD_HEIGHT} />
                    </Card>
                  )}

                  <RewardBarCard
                    settings={settings}
                    onChange={setSettings}
                    errors={fieldErrors}
                    focusRequest={focusRequest}
                  />

                  <SlideCartPreview settings={settings} />
                </InlineGrid>
              </BlockStack>
            </Box>
          </Page>

          {/* APP BRIDGE: toast (shopify.toast.show) – the Shopify admin shows it at the bottom of the page. */}
          {toast && <Toast content={toast} onDismiss={() => setToast(null)} />}
        </Box>
      </InlineStack>
    </>
  );
}

// The Shopify admin around the app: dark top bar (with the save bar) and the grey admin navigation (without items).
renderAdmin(<SlideCartSettings />, {
  topBar: <AdminTopBar />,
  navigation: <Navigation location="/" />,
});
