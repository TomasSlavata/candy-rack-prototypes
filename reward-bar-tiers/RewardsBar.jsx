import { Fragment, useLayoutEffect, useRef, useState } from 'react';
import { formatMoney } from '../shared/storefront/SlideCart.jsx';
import { REWARD_TYPES, STORE_MARKET, rewardTitleOf, rewardsBarState } from './settings.js';
import './RewardsBar.css';

// "You're **{{amount}}** away from **free shipping**" → text with the bold parts in <strong>.
function RichText({ value, amount }) {
  return value
    .replace('{{amount}}', amount ?? '')
    .split('**')
    .map((part, index) => (index % 2 === 1 ? <strong key={index}>{part}</strong> : <Fragment key={index}>{part}</Fragment>));
}

// How the tiers' bars move when the cart total changes: as one bar across all tiers. The position on it
// (0 = empty, 1 = the first tier's bar full, 2 = the second's…) animates as a single value with one curve,
// and each tier's bar shows its part – so the bars fill one after another (or empty right to left) in one
// continuous movement. Duration: FULL_BAR_MS per bar moved (at least MIN_MS, at most MAX_MS).
const FULL_BAR_MS = 500;
const MIN_MS = 120;
const MAX_MS = 900;

// CSS ease-in-out (cubic-bezier(0.42, 0, 0.58, 1)): the share of the way done at a share of the time.
const BEZIER = [0.42, 0, 0.58, 1];
const bezier = (a, b, t) => 3 * a * t * (1 - t) ** 2 + 3 * b * t ** 2 * (1 - t) + t ** 3;
function easeInOut(time) {
  let low = 0, high = 1, t = time;
  for (let i = 0; i < 30; i += 1) {
    t = (low + high) / 2;
    if (bezier(BEZIER[0], BEZIER[2], t) < time) low = t;
    else high = t;
  }
  return bezier(BEZIER[1], BEZIER[3], t);
}
// The other way round: the share of the time at which a share of the way is done.
function timeAt(share) {
  let low = 0, high = 1;
  for (let i = 0; i < 30; i += 1) {
    const mid = (low + high) / 2;
    if (easeInOut(mid) < share) low = mid;
    else high = mid;
  }
  return (low + high) / 2;
}

const positionOf = (tiers) => tiers.reduce((sum, entry) => sum + entry.progress, 0);
const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Animates the position and returns it (to draw the bars), plus `motion`: for each tier whose bar moves,
// when it starts and ends moving (ms from the change) – the unlock and loss effects are timed by it.
// `startDelay` – ms to wait before moving (e.g. while the cart opens).
function useProgressAnimation(tiers, startDelay) {
  const target = positionOf(tiers);
  const ids = tiers.map((entry) => entry.tier.id).join();
  const [shown, setShown] = useState(target);
  const shownRef = useRef(target);
  const plan = useRef({ target, ids, motion: {}, from: target, duration: 0, delay: 0, key: 0 });

  // A new target: plan the movement from where the bars are now (also mid-way through a movement).
  if (target !== plan.current.target || ids !== plan.current.ids) {
    const from = ids === plan.current.ids ? shownRef.current : target; // other tiers: no movement
    const distance = Math.abs(target - from);
    const duration = distance === 0 ? 0 : Math.min(MAX_MS, Math.max(MIN_MS, distance * FULL_BAR_MS));
    const crossing = (boundary) => startDelay + duration * timeAt(Math.abs(boundary - from) / distance);
    const motion = {};
    tiers.forEach((entry, index) => {
      // This bar covers the positions index … index + 1.
      const low = Math.max(index, Math.min(from, target));
      const high = Math.min(index + 1, Math.max(from, target));
      if (distance === 0 || high <= low) return;
      const [start, end] = target > from ? [crossing(low), crossing(high)] : [crossing(high), crossing(low)];
      motion[entry.tier.id] = { start, end };
    });
    plan.current = { target, ids, motion, from, duration, delay: startDelay, key: plan.current.key + 1 };
  }

  useLayoutEffect(() => {
    const { from, duration, delay } = plan.current;
    const to = plan.current.target;
    const show = (position) => {
      shownRef.current = position;
      setShown(position);
    };
    if (duration === 0 || prefersReducedMotion()) {
      show(to);
      return undefined;
    }
    const begin = performance.now() + delay;
    let frame;
    const step = (now) => {
      const share = Math.min(1, Math.max(0, (now - begin) / duration));
      show(from + (to - from) * easeInOut(share));
      if (share < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [plan.current.key]);

  return { position: shown, motion: plan.current.motion };
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
// out; `fromHeight` is the message area's height before the switch. When the new message has another
// number of lines, the area's height follows smoothly, so the bar and the cart below don't jump.
// Nothing moves for people who prefer reduced motion – the message just changes.
function playMessageSwitch(messageArea, outgoing, fromHeight) {
  const message = messageArea?.querySelector('.RewardsBar__text');
  if (!message || prefersReducedMotion()) return;
  // A copy left from a switch that hasn't finished yet goes now.
  messageArea.querySelectorAll('.RewardsBar__text--outgoing').forEach((copy) => copy.remove());

  // A height animation from an unfinished switch stops, so the new message's own height can be measured.
  messageArea.getAnimations().forEach((animation) => animation.cancel());
  const toHeight = messageArea.getBoundingClientRect().height;
  if (fromHeight && Math.abs(fromHeight - toHeight) > 0.5) {
    messageArea.animate([{ height: `${fromHeight}px` }, { height: `${toHeight}px` }], MESSAGE_SWITCH);
  }

  // The new message starts right under the old one (by the old one's height, not its own), and both move
  // by that height with the same timing – so they stay one under the other, never over each other, even
  // when one has more lines than the other.
  const from = fromHeight ? `${fromHeight}px` : '100%';
  message.animate(
    [
      { transform: `translateY(${from})`, opacity: 0 },
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
          { transform: `translateY(-${from})`, opacity: 0 },
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
//   delay      – ms to wait before the bars start moving after the next change of the cart total, e.g. while
//                the cart opens after a product was added (everything after it – the message – waits too)
// The colors and font sizes are the merchant's settings, so they come in as CSS variables
// instead of storefront tokens.
export function RewardsBar({ settings, cartTotal, market = STORE_MARKET, delay = 0 }) {
  const state = rewardsBarState(settings, cartTotal, market);
  const { position, motion } = useProgressAnimation(state?.tiers ?? [], delay);
  const { unlocks, losses } = useUnlockChanges(state?.tiers ?? [], cartTotal, motion);
  const root = useRef(null);

  // The message shown: the one for the cart total, or – around an unlock or a loss – one held back
  // or the unlocked tier's "Text after reward" (see "Message when a reward is unlocked or lost").
  const message = state && { value: state.text, missing: state.missing };
  const lastMessage = useRef(message);
  const [messageOverride, setMessageOverride] = useState(null);
  const [messageSwitch, setMessageSwitch] = useState(0);
  const outgoingMessage = useRef(null); // { copy, height } of the message before a switch
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
      const area = root.current?.querySelector('.RewardsBar__message');
      outgoingMessage.current = area && {
        copy: area.querySelector('.RewardsBar__text').cloneNode(true),
        // Mid-switch the area may still be animating – its current height is where it starts from.
        height: area.getBoundingClientRect().height,
      };
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
    playMessageSwitch(
      root.current?.querySelector('.RewardsBar__message'),
      outgoingMessage.current?.copy,
      outgoingMessage.current?.height,
    );
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
              <div
                className="RewardsBar__progress"
                style={{ width: `${Math.min(1, Math.max(0, position - index)) * 100}%` }}
              />
            </div>
            {showLabels && (
              <div className="RewardsBar__label">
                <p className={`RewardsBar__title${isAhead(index) ? ' RewardsBar__title--ahead' : ''}`}>
                  {rewardTitleOf(tier)}
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
