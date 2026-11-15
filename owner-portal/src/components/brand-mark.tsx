/** The Saxlem mark: a winding queue that forms an "S", ending in a saffron dot (you, at the front). */
export function BrandMark({ className }: { className: string }) {
  return (
    <span className={className} aria-hidden="true">
      <svg viewBox="0 0 512 512" focusable="false">
        <path
          d="M368 144 H224 A56 56 0 0 0 224 256 H320 A56 56 0 0 1 320 368 H232"
          fill="none"
          stroke="currentColor"
          strokeWidth="64"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="144" cy="368" r="40" fill="#F5B841" />
      </svg>
    </span>
  );
}
