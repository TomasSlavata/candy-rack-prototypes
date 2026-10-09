import { Fragment, useRef } from 'react';
import { formatMoney } from '../shared/storefront/SlideCart.jsx';
import { REWARD_TYPES, STORE_MARKET, rewardsBarState } from './settings.js';
import './RewardsBar.css';

// "You're **{{amount}}** away from **free shipping**" → text with the bold parts in <strong>.
function RichText({ value, amount }) {
  return value
    .replace('{{amount}}', amount ?? '')
    .split('**')
    .map((part, index) => (index % 2 === 1 ? <strong key={index}>{part}</strong> : <Fragment key={index}>{part}</Fragment>));
}

// How the tiers' bars move when the cart total changes: one after another, like a single bar filling up
// (or emptying, right to left) across the tier gaps – not all at once.
// Each bar takes time for the part of it that changes (a whole bar: FULL_BAR_MS), all of them together
// at most MAX_TOTAL_MS. The first moving bar speeds up, the last one slows down, the ones between keep
// a steady speed, so it reads as one movement.
const FULL_BAR_MS = 500;
const MAX_TOTAL_MS = 900;
const MIN_BAR_MS = 120;

function useSequentialProgress(tiers) {
  const last = useRef({ progress: {}, motion: {} });
  const progress = Object.fromEntries(tiers.map((entry) => [entry.tier.id, entry.progress]));
  // Same values as the last change (e.g. a re-render for another reason) – keep that change's timing.
  if (JSON.stringify(progress) === JSON.stringify(last.current.progress)) return last.current.motion;

  const before = last.current.progress;
  const filling = tiers.some((entry) => entry.progress > (before[entry.tier.id] ?? entry.progress));
  const ordered = filling ? tiers : [...tiers].reverse();
  const moving = ordered.filter((entry) => before[entry.tier.id] !== undefined && before[entry.tier.id] !== entry.progress);
  const durations = moving.map((entry) => Math.max(MIN_BAR_MS, Math.abs(entry.progress - before[entry.tier.id]) * FULL_BAR_MS));
  const scale = Math.min(1, MAX_TOTAL_MS / durations.reduce((sum, ms) => sum + ms, 0));

  const motion = {};
  let delay = 0;
  moving.forEach((entry, index) => {
    const duration = durations[index] * scale;
    const first = index === 0;
    const lastBar = index === moving.length - 1;
    motion[entry.tier.id] = {
      '--rewards-bar-duration': `${duration}ms`,
      '--rewards-bar-delay': `${delay}ms`,
      '--rewards-bar-easing': first && lastBar ? 'ease-in-out' : first ? 'ease-in' : lastBar ? 'ease-out' : 'linear',
    };
    delay += duration;
  });

  last.current = { progress, motion };
  return motion;
}

// The rewards bar at the top of the slide cart (Figma "2.11 Storefront – Rewards Bar • Multiple Tiers"),
// shared by the storefront part and the admin preview. Nothing shows when no tier has a valid amount.
//   settings   – the feature settings (tiers, markets, appearance)
//   cartTotal  – the cart's total, in the market currency
// The colors and font sizes are the merchant's settings, so they come in as CSS variables
// instead of storefront tokens.
export function RewardsBar({ settings, cartTotal, market = STORE_MARKET }) {
  const state = rewardsBarState(settings, cartTotal, market);
  const motion = useSequentialProgress(state?.tiers ?? []);
  if (!state) return null;

  const { appearance } = settings;
  const showLabels = appearance.showRewardTitle && !(appearance.hideWhenOneTier && state.tiers.length === 1);
  const showAmount = showLabels && appearance.showAmount;
  const money = (amount) => formatMoney(amount, market.currency);
  // Unlocked tiers and the next one to unlock have the full text color, the ones after it 70% (Figma annotation).
  const nextIndex = state.tiers.findIndex((entry) => cartTotal < entry.amount);
  const isAhead = (index) => nextIndex !== -1 && index > nextIndex;

  const style = {
    '--rewards-bar-bg': `#${appearance.backgroundColor}`,
    '--rewards-bar-text': `#${appearance.textColor}`,
    '--rewards-bar-progress': `#${appearance.progressColor}`,
    '--rewards-bar-track': `#${appearance.barColor}`,
    '--rewards-bar-text-size': `${appearance.textFontSize}px`,
    '--rewards-bar-label-size': `${appearance.rewardTitleFontSize}px`,
  };

  return (
    <div className={`RewardsBar${showLabels ? ' RewardsBar--labels' : ''}`} style={style}>
      <p className="RewardsBar__text">
        <RichText value={state.text} amount={state.missing !== null ? money(state.missing) : null} />
      </p>
      <div className="RewardsBar__tiers">
        {state.tiers.map(({ tier, amount, progress }, index) => (
          <div key={tier.id} className="RewardsBar__tier">
            <div
              className="RewardsBar__track"
              role="progressbar"
              aria-label={REWARD_TYPES[tier.rewardType].label}
              aria-valuenow={Math.round(progress * 100)}
            >
              <div className="RewardsBar__progress" style={{ width: `${progress * 100}%`, ...motion[tier.id] }} />
            </div>
            {showLabels && (
              <div className="RewardsBar__label">
                <p className={`RewardsBar__title${isAhead(index) ? ' RewardsBar__title--ahead' : ''}`}>{REWARD_TYPES[tier.rewardType].rewardTitle.replaceAll('**', '')}</p>
                {showAmount && <p className="RewardsBar__amount">{money(amount)}</p>}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
