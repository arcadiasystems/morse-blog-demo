import { ReactNode } from "react";

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center text-center gap-3 rounded-xl border border-dashed border-border/70 bg-card/30 px-6 py-12">
      {icon ? (
        <div className="grid place-items-center size-12 rounded-full bg-primary/10 text-primary border border-primary/30 mb-1">
          {icon}
        </div>
      ) : null}
      <h3 className="text-base font-semibold tracking-tight">{title}</h3>
      {description ? (
        <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  );
}
