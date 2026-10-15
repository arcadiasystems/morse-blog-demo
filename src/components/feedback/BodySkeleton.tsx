import styles from "./states.module.css";

/** Five-line shimmer shown while a post body is fetched from Walrus. */
export function BodySkeleton({ className }: { className?: string }) {
  return (
    <div className={`${styles.skel} ${className ?? ""}`} role="status">
      <span className="sr-only">Loading the post from Walrus</span>
      <i aria-hidden="true" />
      <i aria-hidden="true" />
      <i aria-hidden="true" />
      <i aria-hidden="true" />
      <i aria-hidden="true" />
    </div>
  );
}
