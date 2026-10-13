import { useState } from 'react';
import { BlockStack, Box, Checkbox, RangeSlider, Text, TextField } from '@shopify/polaris';
import { ColorField } from '../../shared/custom/ColorField.jsx';
import { FONT_SIZE } from '../settings.js';

const clamp = (size) => Math.min(FONT_SIZE.max, Math.max(FONT_SIZE.min, size));

// A font size: Polaris RangeSlider with the px field as its suffix (Figma "Range slider + Text field").
// Polaris draws the rest of the track solid, the design has it dashed.
// The field takes whole numbers; on blur it goes to the nearest allowed size (or back, if it's empty).
function FontSizeField({ label, value, onChange }) {
  const [draft, setDraft] = useState(null); // what's typed, while the field is focused

  const type = (text) => {
    const digits = text.replace(/\D/g, '').slice(0, 2);
    setDraft(digits);
    const size = Number.parseInt(digits, 10);
    if (size >= FONT_SIZE.min && size <= FONT_SIZE.max) onChange(size);
  };
  const finish = () => {
    const size = Number.parseInt(draft, 10);
    if (!Number.isNaN(size)) onChange(clamp(size));
    setDraft(null);
  };

  return (
    <RangeSlider
      label={label}
      min={FONT_SIZE.min}
      max={FONT_SIZE.max}
      step={FONT_SIZE.step}
      value={value}
      onChange={onChange}
      suffix={
        <Box width="76px">
          <TextField
            label={label}
            labelHidden
            suffix="px"
            inputMode="numeric"
            autoComplete="off"
            value={draft ?? String(value)}
            onChange={type}
            onBlur={finish}
          />
        </Box>
      }
    />
  );
}

// Appearance part of the Rewards bar card: labels under the bar, font sizes, colors and sticky.
export function AppearanceSection({ appearance, onChange }) {
  const set = (key) => (value) => onChange({ ...appearance, [key]: value });

  return (
    <BlockStack gap="400">
      <Text as="h3" variant="bodyMd" fontWeight="medium">
        Appearance
      </Text>

      {/* The amount can't show without the reward title, so its options show only with the title on. */}
      <BlockStack>
        <Checkbox label="Show reward title" checked={appearance.showRewardTitle} onChange={set('showRewardTitle')} />
        {appearance.showRewardTitle && (
          <Box paddingInlineStart="600">
            <BlockStack>
              <Checkbox label="Show amount" checked={appearance.showAmount} onChange={set('showAmount')} />
              <Checkbox
                label="Hide when there's only one tier"
                checked={appearance.hideWhenOneTier}
                onChange={set('hideWhenOneTier')}
              />
            </BlockStack>
          </Box>
        )}
      </BlockStack>

      {/* Controls the text before and after the reward (called "Font size" before tiers). */}
      <FontSizeField label="Text font size" value={appearance.textFontSize} onChange={set('textFontSize')} />
      {appearance.showRewardTitle && (
        <FontSizeField
          label="Reward title and amount font size"
          value={appearance.rewardTitleFontSize}
          onChange={set('rewardTitleFontSize')}
        />
      )}

      <ColorField label="Background color" value={appearance.backgroundColor} onChange={set('backgroundColor')} />
      <ColorField label="Text color" value={appearance.textColor} onChange={set('textColor')} />
      <ColorField label="Progress color" value={appearance.progressColor} onChange={set('progressColor')} />
      <ColorField label="Bar color" value={appearance.barColor} onChange={set('barColor')} />

      <Checkbox label="Sticky reward bar" checked={appearance.sticky} onChange={set('sticky')} />
    </BlockStack>
  );
}
