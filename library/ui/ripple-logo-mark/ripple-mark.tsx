export default function RippleMark({
  className = "h-6 w-6",
}: {
  className?: string;
}) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <circle cx="16" cy="16" r="4" fill="var(--color-accent)" />
      <circle
        cx="16"
        cy="16"
        r="9.5"
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth="2"
        opacity="0.5"
      />
      <circle
        cx="16"
        cy="16"
        r="14.5"
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth="2"
        opacity="0.22"
      />
    </svg>
  );
}
