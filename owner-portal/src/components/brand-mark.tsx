/**
 * The Saxlem mark (v2 "Aura"): two rounded shapes, Saxlem Blue above and aqua below,
 * meet to form an "S" with a small plus where they touch.
 */
export function BrandMark({ className }: { className: string }) {
  return (
    <span className={className} aria-hidden="true">
      <svg viewBox="80 80 352 352" focusable="false">
        <defs>
          <linearGradient id="sx-mark-top" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#3B6BFF" />
            <stop offset="1" stopColor="#2148F0" />
          </linearGradient>
          <linearGradient id="sx-mark-bottom" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#14C9C4" />
            <stop offset="1" stopColor="#13B0EA" />
          </linearGradient>
        </defs>
        <path
          d="M256 80 H384 A48 48 0 0 1 432 128 V168 A88 88 0 0 1 344 256 H168 V168 A88 88 0 0 1 256 80Z"
          fill="url(#sx-mark-top)"
        />
        <path
          d="M256 432 H128 A48 48 0 0 1 80 384 V344 A88 88 0 0 1 168 256 H344 V344 A88 88 0 0 1 256 432Z"
          fill="url(#sx-mark-bottom)"
        />
        <path
          d="M256 226 V286 M226 256 H286"
          stroke="#FFFFFF"
          strokeWidth="19"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}
