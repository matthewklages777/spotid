/**
 * Renders "SpotId" with the capital I styled to match the logo —
 * a serif I with crossbars, distinct from the plain-stick I in Geist Sans.
 */
export function Brand({ className }: { className?: string }) {
  return (
    <span className={className}>
      Spot<span style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontWeight: "inherit", fontSize: "inherit" }}>I</span>d
    </span>
  );
}
