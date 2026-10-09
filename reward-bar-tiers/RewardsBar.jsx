import { Fragment } from 'react';
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

// The rewards bar at the top of the slide cart (Figma "2.11 Storefront – Rewards Bar • Multiple Tiers"),
// shared by the storefront part and the admin preview. Nothing shows when no tier has a valid amount.
//   settings   – the feature settings (tiers, markets, appearance)
//   cartTotal  – the cart's total, in the market currency
// The colors and font sizes are the merchant's settings, so they come in as CSS variables
// instead of storefront tokens.
export function RewardsBar({ settings, cartTotal, market = STORE_MARKET }) {
  const state = rewardsBarState(settings, cartTotal, market);
  if (!state) return null;

  const { appearance } = settings;
  const showLabels = appearance.showRewardTitle && !(appearance.hideWhenOneTier && state.tiers.length === 1);
  const showAmount = showLabels && appearance.showAmount;
  const money = (amount) => formatMoney(amount, market.currency);

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
        {state.tiers.map(({ tier, amount, progress }) => (
          <div key={tier.id} className="RewardsBar__tier">
            <div
              className="RewardsBar__track"
              role="progressbar"
              aria-label={REWARD_TYPES[tier.rewardType].label}
              aria-valuenow={Math.round(progress * 100)}
            >
              <div className="RewardsBar__progress" style={{ width: `${progress * 100}%` }} />
            </div>
            {showLabels && (
              <div className="RewardsBar__label">
                <p className="RewardsBar__title">{REWARD_TYPES[tier.rewardType].rewardTitle.replaceAll('**', '')}</p>
                {showAmount && <p className="RewardsBar__amount">{money(amount)}</p>}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
