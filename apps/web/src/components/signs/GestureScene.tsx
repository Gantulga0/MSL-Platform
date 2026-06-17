/**
 * Decorative "gesture-trail" scene — the signature motif of the design language
 * ("дохио бол хөдөлгөөн" — a sign is motion): an abstract signer with the path a
 * hand traces in space. Purely presentational and `aria-hidden`; it never
 * conveys information, so it carries no text alternative. The travelling node and
 * self-drawing trail animate only when the user allows motion (handled in CSS via
 * `prefers-reduced-motion`). Add the `is-anim` class on an ancestor (or hover a
 * `.group` ancestor) to trigger the stroke-draw.
 */
export function GestureScene({
  path = 'M120 250 C 150 150, 210 150, 220 235 S 150 320, 200 300',
  className,
}: {
  /** SVG path the hand node travels along and the trail strokes. */
  path?: string;
  className?: string;
}): React.ReactElement {
  return (
    <svg
      className={className}
      viewBox="0 0 320 400"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
      aria-hidden
    >
      {/* Abstract signer (head + torso). */}
      <g opacity="0.9">
        <circle cx="160" cy="150" r="34" fill="rgba(255,255,255,.10)" />
        <rect x="116" y="196" width="88" height="120" rx="40" fill="rgba(255,255,255,.08)" />
      </g>
      {/* Dotted guide trail (always visible). */}
      <path
        className="trail"
        d={path}
        stroke="var(--amber)"
        strokeWidth="4"
        strokeDasharray="1 12"
        opacity="0.9"
      />
      {/* Self-drawing solid trail (animates in when motion is allowed). */}
      <path className="trail trail-draw" d={path} stroke="var(--amber)" strokeWidth="3" opacity="0.55" />
      {/* Hand node travelling along the path. */}
      <g className="hand-node" style={{ offsetPath: `path('${path}')` }}>
        <circle r="13" fill="var(--amber)" />
        <circle r="22" fill="none" stroke="var(--amber)" strokeWidth="2" opacity="0.5" />
      </g>
    </svg>
  );
}
