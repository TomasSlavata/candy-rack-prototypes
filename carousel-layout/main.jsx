import { useState } from 'react';
import {
  BlockStack,
  Box,
  Card,
  Checkbox,
  InlineStack,
  Layout,
  Page,
  RangeSlider,
  Select,
  Text,
  TextField,
  Toast,
} from '@shopify/polaris';
import { renderPrototype } from '../shared/PrototypeShell.jsx';
import { usePersistentState } from '../shared/usePersistentState.js';

const DEFAULT_SETTINGS = {
  heading: 'You may also like',
  layout: 'carousel',
  productsPerView: 2,
  showArrows: true,
  showDots: false,
};

const LAYOUT_OPTIONS = [
  { label: 'Carousel', value: 'carousel' },
  { label: 'Stacked list', value: 'list' },
];

const SAMPLE_PRODUCTS = [
  { title: 'Gift wrap', price: '$4.00' },
  { title: 'Lip balm', price: '$8.00' },
  { title: 'Travel pouch', price: '$12.00' },
  { title: 'Scented candle', price: '$18.00' },
];

function CarouselLayoutSettings() {
  const [saved, save, reset] = usePersistentState('carousel-layout', DEFAULT_SETTINGS);
  const [draft, setDraft] = useState(saved);
  const [toast, setToast] = useState(null);

  const isDirty = JSON.stringify(draft) !== JSON.stringify(saved);
  const update = (field) => (value) => setDraft((current) => ({ ...current, [field]: value }));

  return (
    <Page
      title="Carousel layout"
      subtitle="Upsell carousel in the slide cart"
      backAction={{ content: 'Prototypes', url: '../' }}
      primaryAction={{
        content: 'Save',
        disabled: !isDirty,
        onAction: () => {
          save(draft);
          setToast('Settings saved');
        },
      }}
      secondaryActions={[
        {
          content: 'Reset to defaults',
          onAction: () => {
            reset();
            setDraft(DEFAULT_SETTINGS);
            setToast('Settings reset');
          },
        },
      ]}
    >
      <Layout>
        <Layout.Section variant="oneHalf">
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                Settings
              </Text>
              <TextField label="Heading" value={draft.heading} onChange={update('heading')} autoComplete="off" />
              <Select label="Layout" options={LAYOUT_OPTIONS} value={draft.layout} onChange={update('layout')} />
              {draft.layout === 'carousel' && (
                <>
                  <RangeSlider
                    label="Products per view"
                    min={1}
                    max={3}
                    value={draft.productsPerView}
                    onChange={update('productsPerView')}
                    output
                  />
                  <Checkbox label="Show arrows" checked={draft.showArrows} onChange={update('showArrows')} />
                  <Checkbox label="Show pagination dots" checked={draft.showDots} onChange={update('showDots')} />
                </>
              )}
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section variant="oneHalf">
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                Preview
              </Text>
              <CartPreview settings={draft} />
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>

      {toast && <Toast content={toast} onDismiss={() => setToast(null)} />}
    </Page>
  );
}

// Storefront preview – plain markup, since the slide cart is not Polaris.
function CartPreview({ settings }) {
  const isCarousel = settings.layout === 'carousel';
  const visible = isCarousel ? SAMPLE_PRODUCTS.slice(0, settings.productsPerView) : SAMPLE_PRODUCTS.slice(0, 3);

  return (
    <Box background="bg-surface-secondary" padding="400" borderRadius="200">
      <BlockStack gap="300">
        <InlineStack align="space-between" blockAlign="center">
          <Text as="h3" variant="headingSm">
            {settings.heading || ' '}
          </Text>
          {isCarousel && settings.showArrows && (
            <InlineStack gap="100">
              <ArrowButton label="‹" />
              <ArrowButton label="›" />
            </InlineStack>
          )}
        </InlineStack>

        <div
          style={{
            display: 'grid',
            gap: 8,
            gridTemplateColumns: isCarousel ? `repeat(${settings.productsPerView}, 1fr)` : '1fr',
          }}
        >
          {visible.map((product) => (
            <ProductTile key={product.title} product={product} compact={!isCarousel} />
          ))}
        </div>

        {isCarousel && settings.showDots && (
          <InlineStack align="center" gap="100">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                style={{ width: 6, height: 6, borderRadius: 3, background: i === 0 ? '#303030' : '#c4c4c4' }}
              />
            ))}
          </InlineStack>
        )}
      </BlockStack>
    </Box>
  );
}

function ProductTile({ product, compact }) {
  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 8,
        padding: 8,
        display: 'flex',
        flexDirection: compact ? 'row' : 'column',
        alignItems: compact ? 'center' : 'stretch',
        gap: 8,
      }}
    >
      <div
        style={{
          background: '#ebebeb',
          borderRadius: 6,
          width: compact ? 48 : '100%',
          aspectRatio: '1',
          flexShrink: 0,
        }}
      />
      <div style={{ flex: 1 }}>
        <Text as="p" variant="bodySm" fontWeight="medium">
          {product.title}
        </Text>
        <Text as="p" variant="bodySm" tone="subdued">
          {product.price}
        </Text>
      </div>
      <button
        type="button"
        style={{
          border: 'none',
          borderRadius: 6,
          background: '#303030',
          color: '#fff',
          padding: '6px 10px',
          fontSize: 12,
          cursor: 'pointer',
        }}
      >
        Add
      </button>
    </div>
  );
}

function ArrowButton({ label }) {
  return (
    <span
      style={{
        width: 24,
        height: 24,
        borderRadius: 12,
        background: '#fff',
        display: 'grid',
        placeItems: 'center',
        fontSize: 16,
        lineHeight: 1,
      }}
    >
      {label}
    </span>
  );
}

renderPrototype(<CarouselLayoutSettings />);
