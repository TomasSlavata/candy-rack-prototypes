// Scrolls just enough to show an element – like scrollIntoView({ block: 'nearest' }),
// but keeps it clear of the fixed Shopify admin top bar.
export function revealElement(element) {
  if (!element) return;
  const topBar = document.querySelector('.Polaris-TopBar')?.offsetHeight ?? 0;
  const gap = 16;
  const { top, bottom } = element.getBoundingClientRect();
  const topLimit = topBar + gap;
  const bottomLimit = window.innerHeight - gap;

  let offset = 0;
  if (top < topLimit) offset = top - topLimit;
  else if (bottom > bottomLimit) offset = Math.min(bottom - bottomLimit, top - topLimit);
  if (offset) window.scrollBy({ top: offset, behavior: 'smooth' });
}
