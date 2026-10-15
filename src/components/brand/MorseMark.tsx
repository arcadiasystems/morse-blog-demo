/** The Morse mark. Strokes in `currentColor`; public/favicon.svg mirrors it. */
export function MorseMark({ size = 26 }: { size?: number }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 100 100">
      <path
        d="M8 72 V30 H36 V72 H64 V30 H92 V72"
        fill="none"
        stroke="currentColor"
        strokeWidth={16}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
