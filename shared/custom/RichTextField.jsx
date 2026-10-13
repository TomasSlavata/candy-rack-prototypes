import { Fragment } from 'react';
import { BlockStack, Box, Button, InlineStack, Text } from '@shopify/polaris';
import { LinkIcon, TextBoldIcon, TextItalicIcon, TextUnderlineIcon } from '@shopify/polaris-icons';
import { StrikethroughIcon, VariableIcon } from './icons.jsx';
import './RichTextField.css';

// CUSTOM: Polaris has no rich text editor – Candy Rack uses an external library for it in production.
// This is a look-alike only: the toolbar does nothing.
// `value` marks bold parts with **…**, e.g. "You're **{{amount}}** away from **free shipping**".
// `variables` shows the insert-variable button on the right of the toolbar.
// With `onChange` the text can be edited (plain text, no **…** – `bold` shows it all bold), up to
// maxLength characters; `onBlur` is called when the field is left. Without it, it's read-only.
export function RichTextField({ label, value, maxLength = 70, variables = false, bold = false, onChange, onBlur }) {
  const editable = Boolean(onChange);
  const parts = editable ? [value] : value.split('**');
  const length = parts.join('').length;

  return (
    <BlockStack gap="100">
      <Text as="span" variant="bodyMd">
        {label}
      </Text>

      {/* The wrapper shows the focus ring while the text is being edited (RichTextField.css). */}
      <div className="cr-RichTextField">
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
              {editable ? (
                <input
                  className={`cr-RichTextField__input${bold ? ' cr-RichTextField__input--bold' : ''}`}
                  aria-label={label}
                  autoComplete="off"
                  maxLength={maxLength}
                  value={value}
                  onChange={(event) => onChange(event.target.value)}
                  onBlur={onBlur}
                />
              ) : (
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
              )}
              <Text as="p" variant="bodyMd" tone="subdued" alignment="end">
                {length}/{maxLength}
              </Text>
            </BlockStack>
          </Box>
        </Box>
      </div>
    </BlockStack>
  );
}
