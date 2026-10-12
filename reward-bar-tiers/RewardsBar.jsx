import { Fragment, useLayoutEffect, useRef, useState } from 'react';
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
      style: {
        '--rewards-bar-duration': `${duration}ms`,
        '--rewards-bar-delay': `${delay}ms`,
        '--rewards-bar-easing': first && lastBar ? 'ease-in-out' : first ? 'ease-in' : lastBar ? 'ease-out' : 'linear',
      },
      start: delay, // when this bar starts moving, in ms
      end: delay + duration, // when it has finished
    };
    delay += duration;
  });

  last.current = { progress, motion };
  return motion;
}

// ——— Message when a reward is unlocked or lost ———
// Getting a reward: once its bar has filled up, the message switches to the unlocked tier's "Text after
// reward" for AFTER_TEXT_MS, then to the message for the cart total (e.g. the next tier's "Text before
// reward"). Losing a reward: once its bar starts to empty, the message switches to the one for the cart
// total. Each switch: the old message slides up out of the message area, the new one in from below.
// Other changes of the cart total update the message right away, without an animation.
const AFTER_TEXT_MS = 2500;
const MESSAGE_SWITCH = { duration: 450, easing: 'ease-in-out' };

// Tiers unlocked by the last change of the cart total (with when their bar has filled up), and tiers
// lost by it (with when their bar starts to empty – that's when the reward is gone).
function useUnlockChanges(tiers, cartTotal, motion) {
  const last = useRef({ unlocked: null, changes: { unlocks: [], losses: [] } });
  const unlocked = tiers.filter((entry) => cartTotal >= entry.amount).map((entry) => entry.tier.id);
  if (last.current.unlocked !== null && JSON.stringify(unlocked) === JSON.stringify(last.current.unlocked)) {
    return last.current.changes;
  }
  const before = last.current.unlocked ?? unlocked; // the first render – nothing changed just now
  const ids = tiers.map((entry) => entry.tier.id);
  const changes = {
    unlocks: unlocked.filter((id) => !before.includes(id)).map((id) => ({ id, at: motion[id]?.end ?? 0 })),
    losses: before
      .filter((id) => ids.includes(id) && !unlocked.includes(id))
      .map((id) => ({ id, at: motion[id]?.start ?? 0 })),
  };
  last.current = { unlocked, changes };
  return changes;
}

// The switch animation. `outgoing` is a copy of the old message, laid over the new one while it slides
// out. Nothing moves for people who prefer reduced motion – the message just changes.
function playMessageSwitch(messageArea, outgoing) {
  const message = messageArea?.querySelector('.RewardsBar__text');
  if (!message || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  // A copy left from a switch that hasn't finished yet goes now.
  messageArea.querySelectorAll('.RewardsBar__text--outgoing').forEach((copy) => copy.remove());

  message.animate(
    [
      { transform: 'translateY(100%)', opacity: 0 },
      { transform: 'none', opacity: 1 },
    ],
    MESSAGE_SWITCH,
  );
  if (outgoing) {
    outgoing.classList.add('RewardsBar__text--outgoing');
    messageArea.append(outgoing);
    // Stays at its last frame (gone) until it's removed, so it doesn't flash back for a frame.
    outgoing
      .animate(
        [
          { transform: 'none', opacity: 1 },
          { transform: 'translateY(-100%)', opacity: 0 },
        ],
        { ...MESSAGE_SWITCH, fill: 'forwards' },
      )
      .finished.then(() => outgoing.remove());
  }
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
  const { unlocks, losses } = useUnlockChanges(state?.tiers ?? [], cartTotal, motion);
  const root = useRef(null);

  // The message shown: the one for the cart total, or – around an unlock or a loss – one held back
  // or the unlocked tier's "Text after reward" (see "Message when a reward is unlocked or lost").
  const message = state && { value: state.text, missing: state.missing };
  const lastMessage = useRef(message);
  const [messageOverride, setMessageOverride] = useState(null);
  const [messageSwitch, setMessageSwitch] = useState(0);
  const outgoingMessage = useRef(null);
  const messageTimers = useRef([]);
  const clearMessageTimers = () => messageTimers.current.forEach(clearTimeout);
  useLayoutEffect(() => clearMessageTimers, []);

  // Before paint, so a message held back never shows its new text for a frame.
  useLayoutEffect(() => {
    if (unlocks.length === 0 && losses.length === 0) return;
    // Keeps what's shown now (also a message still overridden from an earlier change) until the switch.
    clearMessageTimers();
    setMessageOverride((override) => override ?? lastMessage.current);
    const switchTo = (override) => {
      outgoingMessage.current = root.current?.querySelector('.RewardsBar__text')?.cloneNode(true) ?? null;
      setMessageOverride(override);
      setMessageSwitch((count) => count + 1);
    };

    if (unlocks.length > 0) {
      // Several tiers unlocked at once: the highest one's text.
      const at = Math.max(...unlocks.map((unlock) => unlock.at));
      const unlocked = state.tiers.find((entry) => entry.tier.id === unlocks.at(-1).id);
      const afterText = { value: REWARD_TYPES[unlocked.tier.rewardType].textAfter, missing: null };
      messageTimers.current = [
        setTimeout(() => switchTo(afterText), at),
        // Moves on only if the message for the cart total is a different one (not after the last tier).
        setTimeout(() => {
          if (lastMessage.current.value === afterText.value) setMessageOverride(null);
          else switchTo(null);
        }, at + AFTER_TEXT_MS),
      ];
    } else {
      // Several tiers lost at once: when the last of their bars starts to empty.
      messageTimers.current = [setTimeout(() => switchTo(null), Math.max(...losses.map((loss) => loss.at)))];
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unlocks, losses]);

  // After the effect above, so it still sees the message from before this change.
  useLayoutEffect(() => {
    lastMessage.current = message;
  });

  useLayoutEffect(() => {
    if (messageSwitch === 0) return;
    playMessageSwitch(root.current?.querySelector('.RewardsBar__message'), outgoingMessage.current);
    outgoingMessage.current = null;
  }, [messageSwitch]);

  if (!state) return null;

  const shownMessage = messageOverride ?? message;
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
    <div ref={root} className={`RewardsBar${showLabels ? ' RewardsBar--labels' : ''}`} style={style}>
      <div className="RewardsBar__message">
        <p className="RewardsBar__text">
          <RichText value={shownMessage.value} amount={shownMessage.missing !== null ? money(shownMessage.missing) : null} />
        </p>
      </div>
      <div className="RewardsBar__tiers">
        {state.tiers.map(({ tier, amount, progress }, index) => (
          <div key={tier.id} className="RewardsBar__tier" data-tier={tier.id}>
            <div
              className="RewardsBar__track"
              role="progressbar"
              aria-label={REWARD_TYPES[tier.rewardType].label}
              aria-valuenow={Math.round(progress * 100)}
            >
              <div className="RewardsBar__progress" style={{ width: `${progress * 100}%`, ...motion[tier.id]?.style }} />
            </div>
            {showLabels && (
              <div className="RewardsBar__label">
                <p className={`RewardsBar__title${isAhead(index) ? ' RewardsBar__title--ahead' : ''}`}>
                  {REWARD_TYPES[tier.rewardType].rewardTitle.replaceAll('**', '')}
                </p>
                {showAmount && <p className="RewardsBar__amount">{money(amount)}</p>}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
