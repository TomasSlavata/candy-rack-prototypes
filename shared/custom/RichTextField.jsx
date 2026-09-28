import { Fragment } from 'react';
import { BlockStack, Box, Button, InlineStack, Text } from '@shopify/polaris';
import { LinkIcon, TextBoldIcon, TextItalicIcon, TextUnderlineIcon } from '@shopify/polaris-icons';
import { StrikethroughIcon, VariableIcon } from './icons.jsx';

// CUSTOM: Polaris has no rich text editor – Candy Rack uses an external library for it in production.
// This is a look-alike only: the toolbar does nothing and the text can't be edited.
// `value` marks bold parts with **…**, e.g. "You're **{{amount}}** away from **free shipping**".
// `variables` shows the insert-variable button on the right of the toolbar.
export function RichTextField({ label, value, maxLength = 70, variables = false }) {
  const parts = value.split('**');
  const length = parts.join('').length;

  return (
    <BlockStack gap="100">
      <Text as="span" variant="bodyMd">
        {label}
      </Text>

      <Box
        background="input-bg-surface"
        borderWidth="0165"
        borderColor="input-border"
        borderRadius="200"
        overflowX="hidden"
        overflowY="hidden"
      >
        <Box background="bg-surface-secondary-hover" paddingInline="300" paddingBlock="150">
          <InlineStack align="space-between" blockAlign="center">
            <InlineStack gap="200" blockAlign="center">
              <InlineStack gap="100">
                <Button variant="tertiary" size="micro" icon={TextBoldIcon} accessibilityLabel="Bold" />
                <Button variant="tertiary" size="micro" icon={TextItalicIcon} accessibilityLabel="Italic" />
                <Button variant="tertiary" size="micro" icon={TextUnderlineIcon} accessibilityLabel="Underline" />
                <Button variant="tertiary" size="micro" icon={StrikethroughIcon} accessibilityLabel="Strikethrough" />
              </InlineStack>
              <Box borderInlineStartWidth="025" borderColor="border" minHeight="20px" />
              <Button variant="tertiary" size="micro" icon={LinkIcon} accessibilityLabel="Link" disabled />
            </InlineStack>
            {variables && (
              <Button variant="tertiary" size="micro" icon={VariableIcon} accessibilityLabel="Insert variable" />
            )}
          </InlineStack>
        </Box>

        <Box paddingInline="300" paddingBlock="150">
          <BlockStack gap="100">
            <Text as="p" variant="bodyMd">
              {parts.map((part, index) =>
                index % 2 === 1 ? (
                  <Text key={index} as="span" fontWeight="semibold">
                    {part}
                  </Text>
                ) : (
                  <Fragment key={index}>{part}</Fragment>
                ),
              )}
            </Text>
            <Text as="p" variant="bodyMd" tone="subdued" alignment="end">
              {length}/{maxLength}
            </Text>
          </BlockStack>
        </Box>
      </Box>
    </BlockStack>
  );
}
