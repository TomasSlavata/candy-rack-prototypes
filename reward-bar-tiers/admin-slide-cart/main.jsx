import { useState } from 'react';
import {
  Badge,
  BlockStack,
  Box,
  Button,
  Card,
  ContextualSaveBar,
  Image,
  InlineGrid,
  InlineStack,
  Navigation,
  Page,
  Popover,
  Text,
  TopBar,
} from '@shopify/polaris';
import { MenuIcon } from '@shopify/polaris-icons';
import { renderAdmin } from '../../shared/admin/AdminShell.jsx';
import { useMediaQuery } from '../../shared/custom/useMediaQuery.js';
import appIcon from '../../shared/admin/candy-rack-icon.png';
import { DEFAULT_SETTINGS } from '../settings.js';
import { RewardBarCard } from './RewardBarCard.jsx';

// Page layout from Figma "4.0 Responsive Layout":
//   1280+      three columns: SC navigation card | settings card | preview
//   1040–1279  two columns: settings card | preview, SC navigation moves into the Menu button
//   0–1039     one column, the admin navigation disappears below 768 (Polaris Frame does that)
// 1280 isn't a Polaris breakpoint (Polaris xl is 1440), so it's checked with a custom hook.
const WIDE_LAYOUT_QUERY = '(min-width: 1280px)';
const WIDE_COLUMNS = '240px 1fr 390px';
const TWO_COLUMNS = '1fr 390px';
const APP_MAX_WIDTH = '1404px';

// Heights of the empty placeholder cards, taken from Figma – replaced by real content later.
const NAV_CARD_HEIGHT = '576px';
const PREVIEW_CARD_HEIGHT = '600px';

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

function SlideCartSettings() {
  const isWide = useMediaQuery(WIDE_LAYOUT_QUERY);
  // Not saved yet – saving comes with the contextual save bar.
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  return (
    <>
      {/* APP BRIDGE: contextual save bar – shown all the time until saving is wired up. */}
      <ContextualSaveBar
        message="Unsaved changes"
        saveAction={{ content: 'Save', disabled: true }}
        discardAction={{ content: 'Discard' }}
      />

      <AppHeader />

      {/* Note: InlineStack passes its align down – every InlineStack inside that relies on the
          default (start) alignment has to set align="start" itself. */}
      <InlineStack align="center">
        <Box width="100%" maxWidth={APP_MAX_WIDTH}>
          <Page
            fullWidth
            title="Slide cart"
            titleMetadata={<Badge>Inactive</Badge>}
            secondaryActions={[{ content: 'Restore to defaults', onAction: () => {} }]}
          >
            <BlockStack gap="400">
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

                <RewardBarCard settings={settings} onChange={setSettings} />

                <Card padding="0">
                  <Box minHeight={PREVIEW_CARD_HEIGHT} />
                </Card>
              </InlineGrid>
            </BlockStack>
          </Page>
        </Box>
      </InlineStack>
    </>
  );
}

// The Shopify admin around the app: dark top bar and the grey admin navigation (without items).
renderAdmin(<SlideCartSettings />, {
  topBar: <TopBar />,
  navigation: <Navigation location="/" />,
});
