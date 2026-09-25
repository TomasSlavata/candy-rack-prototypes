import { BlockStack, Card, Link, Page, ResourceItem, ResourceList, Text } from '@shopify/polaris';
import { renderPrototype } from './shared/PrototypeShell.jsx';

// Filled in by vite.config.js from the folders in the repo root.
const prototypes = __PROTOTYPES__;

const toTitle = (slug) => slug.replace(/-/g, ' ').replace(/^\w/, (c) => c.toUpperCase());

function PrototypeIndex() {
  return (
    <Page title="Candy Rack Prototypes" subtitle="Interactive prototypes built with Shopify Polaris">
      <Card padding="0">
        <ResourceList
          items={prototypes}
          renderItem={(slug) => (
            <ResourceItem id={slug} url={`./${slug}/`} accessibilityLabel={`Open ${toTitle(slug)}`}>
              <BlockStack gap="100">
                <Text as="h3" variant="headingSm">
                  {toTitle(slug)}
                </Text>
                <Text as="p" tone="subdued">
                  /{slug}/
                </Text>
              </BlockStack>
            </ResourceItem>
          )}
        />
      </Card>
      <div style={{ marginTop: 16 }}>
        <Text as="p" tone="subdued">
          Source on <Link url="https://github.com/TomasSlavata/candy-rack-prototypes" target="_blank">GitHub</Link>
        </Text>
      </div>
    </Page>
  );
}

renderPrototype(<PrototypeIndex />);
