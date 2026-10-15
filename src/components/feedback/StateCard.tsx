import type { ReactNode } from "react";
import styles from "./states.module.css";

type Props = {
  icon: ReactNode;
  title: string;
  /** Body copy; rendered as one paragraph. */
  children: ReactNode;
  actions?: ReactNode;
  tone?: "default" | "warn";
  role?: "status" | "alert";
  className?: string;
};

/** Icon, title, copy and actions in the `.state` card from states.html. */
export function StateCard({
  icon,
  title,
  children,
  actions,
  tone = "default",
  role,
  className,
}: Props) {
  const toneClass = tone === "warn" ? styles.warn : "";
  return (
    <div
      className={`${styles.state} ${toneClass} ${className ?? ""}`}
      role={role}
    >
      <span className={styles.icon}>{icon}</span>
      <div>
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.text}>{children}</p>
        {actions ? <div className={styles.acts}>{actions}</div> : null}
      </div>
    </div>
  );
}
