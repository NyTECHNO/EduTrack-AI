import { useEffect, useRef, useState } from 'react';
import './morph.css';

/**
 * A sticky bar that starts full width and, once the page has scrolled about 16px, morphs into a compact floating pill.
 * - A 1px sentinel at the top of the page is watched by an IntersectionObserver; it only toggles the `is-floating` class.
 * - The background is its own layer: only its clip-path animates (never width or padding), so focus rings are never clipped.
 * - Left and right items slide inward with transforms so they stay inside the pill.
 * `left` is the title (like a logo), `center` the navigation links, `right` the call to action.
 */
export default function MorphBar({ left, center, right, label }) {
  const sentinel = useRef(null);
  const bar = useRef(null);
  const [floating, setFloating] = useState(false);

  useEffect(() => {
    const top = parseFloat(getComputedStyle(bar.current).top) || 0; // where the bar sticks, under the app's top bar
    const observer = new IntersectionObserver(([entry]) => setFloating(!entry.isIntersecting), {
      rootMargin: `-${Math.round(top + 16)}px 0px 0px 0px`, // the sentinel counts as gone once the page has scrolled ~16px
      threshold: 0,
    });
    observer.observe(sentinel.current);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <div ref={sentinel} className="morph__sentinel" aria-hidden="true" />
      <header ref={bar} className={`morph${floating ? ' is-floating' : ''}`}>
        <span className="morph__bg" aria-hidden="true" />
        <div className="morph__inner">
          <div className="morph__left">{left}</div>
          <nav className="morph__nav" aria-label={label}>{center}</nav>
          <div className="morph__right">{right}</div>
        </div>
      </header>
    </>
  );
}
