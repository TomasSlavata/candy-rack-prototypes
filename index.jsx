import { Badge, BlockStack, Button, Card, InlineStack, Link, Page, Text } from '@shopify/polaris';
import { renderAdmin } from './shared/admin/AdminShell.jsx';

// Filled in by vite.config.js from the folders in the repo root.
// Local-only features (folders starting with "_") are listed only in `npm run dev`.
const features = __FEATURES__.filter((feature) => import.meta.env.DEV || !feature.localOnly);

const PART_LABELS = {
  'admin-dashboard': 'Admin: Dashboard',
  'admin-edit-offer': 'Admin: Edit offer',
  'admin-slide-cart': 'Admin: Slide cart',
  'admin-customization': 'Admin: Customization',
  'admin-analytics': 'Admin: Analytics',
  'theme-editor': 'Theme editor',
  'storefront-product-page': 'Storefront: Product page',
  'storefront-slide-cart': 'Storefront: Slide cart',
  'storefront-thank-you': 'Storefront: Thank you page',
};

const toTitle = (slug) =>
  slug
    .replace(/^_/, '')
    .replace(/-/g, ' ')
    .replace(/^\w/, (c) => c.toUpperCase());

function Overview() {
  return (
    <Page title="Candy Rack Prototypes" subtitle="Interactive prototypes built with Shopify Polaris">
      <BlockStack gap="400">
        {features.length === 0 && (
          <Card>
            <Text as="p" tone="subdued">
              No prototypes yet.
            </Text>
          </Card>
        )}

        {features.map(({ slug, parts, localOnly }) => (
          <Card key={slug}>
            <BlockStack gap="300">
              <InlineStack gap="200" blockAlign="center">
                <Text as="h2" variant="headingMd">
                  {toTitle(slug)}
                </Text>
                {localOnly && <Badge>Local only</Badge>}
              </InlineStack>
              <InlineStack gap="200">
                {parts.map((part) => (
                  <Button key={part} url={`./${slug}/${part}/`}>
                    {PART_LABELS[part] ?? toTitle(part)}
                  </Button>
                ))}
              </InlineStack>
            </BlockStack>
          </Card>
        ))}

        <Text as="p" tone="subdued">
          Source on{' '}
          <Link url="https://github.com/TomasSlavata/candy-rack-prototypes" target="_blank">
            GitHub
          </Link>
        </Text>
      </BlockStack>
    </Page>
  );
}

renderAdmin(<Overview />);
