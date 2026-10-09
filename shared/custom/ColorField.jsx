import { useState } from 'react';
import { BlockStack, Box, ColorPicker, InlineStack, Popover, Text, TextField, hexToRgb, hsbToHex, rgbToHsb } from '@shopify/polaris';
import './ColorField.css';

const HEX_DIGITS = /[^0-9a-f]/gi;
const isValidHex = (value) => /^([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value);
// "f8f" → "FF88FF", "f8f8f8" → "F8F8F8"
const normalizeHex = (value) =>
  (value.length === 3 ? [...value].map((digit) => digit + digit).join('') : value).toUpperCase();

// CUSTOM: a color setting – a swatch with the color next to a hex code field (Figma "Color").
// Polaris has no swatch: Box only takes Polaris color tokens, not the merchant's color. The swatch is a native
// <button> (ColorField.css, Polaris tokens), its color is the setting's value. Clicking it opens a Polaris
// ColorPicker in a Polaris Popover; the field is a Polaris TextField.
//   value     – hex code without "#", e.g. "F8F8F8"
//   onChange  – gets a valid 6-digit hex code, uppercase, without "#"
// The field takes up to 6 hex digits; a code that isn't valid goes back to the last color on blur.
export function ColorField({ label, value, onChange }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(null); // what's typed, while the field is focused

  const hsb = rgbToHsb(hexToRgb(`#${value}`));
  const pick = (color) => onChange(hsbToHex(color).slice(1).toUpperCase());

  const type = (text) => {
    const digits = text.replace(HEX_DIGITS, '').slice(0, 6);
    setDraft(digits);
    if (digits.length === 6) onChange(digits.toUpperCase());
  };
  const finish = () => {
    if (draft !== null && isValidHex(draft)) onChange(normalizeHex(draft));
    setDraft(null);
  };

  return (
    <BlockStack gap="100">
      <Text as="p">{label}</Text>
      <InlineStack gap="100" wrap={false} blockAlign="start">
        <Popover
          active={open}
          onClose={() => setOpen(false)}
          preferredAlignment="left"
          activator={
            <button
              type="button"
              className="cr-ColorSwatch"
              style={{ '--cr-swatch-color': `#${value}` }}
              aria-label={`${label}: choose a color`}
              aria-expanded={open}
              onClick={() => setOpen((current) => !current)}
            />
          }
        >
          <Box padding="300">
            <ColorPicker color={hsb} onChange={pick} />
          </Box>
        </Popover>
        <Box width="100%">
          <TextField
            label={label}
            labelHidden
            prefix="#"
            autoComplete="off"
            value={draft ?? value}
            onChange={type}
            onBlur={finish}
          />
        </Box>
      </InlineStack>
    </BlockStack>
  );
}
