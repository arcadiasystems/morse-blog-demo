import type { ReactNode } from "react";

/** Inline icon set from the reference screens. Decorative: always aria-hidden. */
type IconProps = {
  size?: number;
  strokeWidth?: number;
  className?: string;
};

function Icon({
  size = 16,
  strokeWidth = 2,
  className,
  children,
}: IconProps & { children: ReactNode }) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {children}
    </svg>
  );
}

export function WalletIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="3" y="6" width="18" height="13" rx="3" />
      <path d="M16 12h2M3 10h18" />
    </Icon>
  );
}

export function PenIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 20h16M6 16l10-10 2 2-10 10H6v-2z" />
    </Icon>
  );
}

export function LockIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </Icon>
  );
}

export function WarnIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
    </Icon>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 5v14M5 12h14" />
    </Icon>
  );
}
