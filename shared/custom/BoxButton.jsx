import { Box, Icon, InlineStack, Text } from '@shopify/polaris';
import './BoxButton.css';

// CUSTOM: "Custom Box Button" from the Candy Rack Figma library – a bordered box that is clickable as a whole,
// with a hover state. Polaris buttons can't fill a bordered box like this (plain/tertiary buttons only
// react on their own area), so the box is a native <button> styled with Polaris tokens.
export function BoxButton({ icon, children, onClick }) {
  return (
    <button type="button" className="cr-BoxButton" onClick={onClick}>
      <InlineStack gap="100" align="start" blockAlign="center" wrap={false}>
        {icon && (
          <Box as="span">
            <Icon source={icon} />
          </Box>
        )}
        <Text as="span" variant="bodyMd" fontWeight="medium">
          {children}
        </Text>
      </InlineStack>
    </button>
  );
}
