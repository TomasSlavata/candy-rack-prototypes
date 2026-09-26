import { useEffect, useRef, useSyncExternalStore } from 'react';
import { Box, Button, Icon, InlineStack, Text, TopBar } from '@shopify/polaris';
import { AlertBubbleIcon } from '@shopify/polaris-icons';
import './SaveBar.css';

// APP BRIDGE: save bar (<ui-save-bar> / SaveBar from @shopify/app-bridge-react).
// In production the app only says "there are unsaved changes" and the Shopify admin draws the bar
// in its own top bar, in place of the search field. This file imitates both sides:
//   <SaveBar open onSave onDiscard />  – used by the page, like the App Bridge component
//   <AdminTopBar />                    – the admin top bar, pass it to renderAdmin() as `topBar`
//
// CUSTOM: Polaris ContextualSaveBar is a full-width bar that covers the whole top bar,
// the design (current Shopify admin) shows a pill in the middle of the top bar instead.

let current = { open: false, onSave: null, onDiscard: null };
const listeners = new Set();
const subscribe = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
const setCurrent = (next) => {
  current = next;
  listeners.forEach((listener) => listener());
};

export function SaveBar({ open, onSave, onDiscard }) {
  // Keep the latest handlers without re-publishing the bar on every render.
  const handlers = useRef({ onSave, onDiscard });
  handlers.current = { onSave, onDiscard };

  useEffect(() => {
    setCurrent({
      open,
      onSave: () => handlers.current.onSave?.(),
      onDiscard: () => handlers.current.onDiscard?.(),
    });
  }, [open]);

  useEffect(() => () => setCurrent({ open: false, onSave: null, onDiscard: null }), []);

  return null;
}

function SaveBarPill({ onSave, onDiscard }) {
  return (
    <div className="cr-SaveBarSlot">
      <Box
        width="100%"
        background="bg-surface-inverse"
        borderWidth="0165"
        borderColor="border-inverse"
        borderRadius="300"
        paddingInlineStart="200"
        paddingInlineEnd="100"
        paddingBlock="100"
      >
        <InlineStack gap="050" align="start" blockAlign="center" wrap={false}>
          <Text as="span" tone="text-inverse">
            <Icon source={AlertBubbleIcon} tone="inherit" />
          </Text>
          <Box width="100%">
            <Text as="p" variant="bodyMd" tone="text-inverse" truncate>
              Unsaved changes
            </Text>
          </Box>
          <InlineStack gap="100" wrap={false}>
            <div className="cr-SaveBarDiscard">
              <Button variant="tertiary" onClick={onDiscard}>
                Discard
              </Button>
            </div>
            <Button onClick={onSave}>Save</Button>
          </InlineStack>
        </InlineStack>
      </Box>
    </div>
  );
}

// The Shopify admin top bar: empty dark bar, with the save bar in the middle while there are unsaved changes.
export function AdminTopBar() {
  const { open, onSave, onDiscard } = useSyncExternalStore(subscribe, () => current);
  return <TopBar searchField={open ? <SaveBarPill onSave={onSave} onDiscard={onDiscard} /> : undefined} />;
}
