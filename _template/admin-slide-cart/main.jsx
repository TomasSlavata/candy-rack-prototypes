import { useState } from 'react';
import { BlockStack, Card, Checkbox, Layout, Page, Text, TextField, Toast } from '@shopify/polaris';
import { renderAdmin } from '../../shared/admin/AdminShell.jsx';
import { useFeatureSettings } from '../../shared/usePersistentState.js';
import { DEFAULT_SETTINGS } from '../settings.js';

function SlideCartSettings() {
  const [saved, save, reset] = useFeatureSettings(DEFAULT_SETTINGS);
  const [draft, setDraft] = useState(saved);
  const [toast, setToast] = useState(null);

  const isDirty = JSON.stringify(draft) !== JSON.stringify(saved);
  const update = (field) => (value) => setDraft((current) => ({ ...current, [field]: value }));

  return (
    <Page
      title="Slide cart"
      backAction={{ content: 'Prototypes', url: '../../' }}
      primaryAction={{
        content: 'Save',
        disabled: !isDirty,
        onAction: () => {
          save(draft);
          setToast('Settings saved');
        },
      }}
      secondaryActions={[
        { content: 'Open storefront', url: '../storefront-slide-cart/', target: '_blank' },
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
        <Layout.AnnotatedSection
          title="Upsell offers"
          description="Save here, then check the storefront tab – it updates without a reload."
        >
          <Card>
            <BlockStack gap="400">
              <TextField label="Heading" value={draft.heading} onChange={update('heading')} autoComplete="off" />
              <Checkbox label="Show prices" checked={draft.showPrices} onChange={update('showPrices')} />
              <Text as="p" tone="subdued">
                Template part – copy the whole _template folder to start a new feature.
              </Text>
            </BlockStack>
          </Card>
        </Layout.AnnotatedSection>
      </Layout>

      {toast && <Toast content={toast} onDismiss={() => setToast(null)} />}
    </Page>
  );
}

renderAdmin(<SlideCartSettings />);
