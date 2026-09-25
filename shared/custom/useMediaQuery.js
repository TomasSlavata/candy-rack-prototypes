import { useEffect, useState } from 'react';

// CUSTOM: Polaris useBreakpoints() only knows the Polaris breakpoints (490 / 768 / 1040 / 1440 px).
// This hook answers any media query, e.g. useMediaQuery('(min-width: 1280px)') for a design breakpoint
// that Polaris doesn't have. Prefer useBreakpoints() whenever a Polaris breakpoint fits.
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    const onChange = () => setMatches(mediaQuery.matches);
    onChange();
    mediaQuery.addEventListener('change', onChange);
    return () => mediaQuery.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}
