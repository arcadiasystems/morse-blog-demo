import { ReactNode } from "react";

type Props = {
  title: string;
  description?: string;
  footer?: ReactNode;
  children: ReactNode;
  onSubmit?: (e: React.FormEvent<HTMLFormElement>) => void;
};

export function FormShell({
  title,
  description,
  footer,
  children,
  onSubmit,
}: Props) {
  return (
    <form
      onSubmit={onSubmit}
      className="rounded-xl border border-border/60 bg-card/40 overflow-hidden"
    >
      <div className="p-5 sm:p-6 border-b border-border/60 flex flex-col gap-1.5">
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      <div className="p-5 sm:p-6 flex flex-col gap-5">{children}</div>
      {footer ? (
        <div className="px-5 sm:px-6 py-4 border-t border-border/60 bg-card/30 flex items-center justify-between gap-3">
          {footer}
        </div>
      ) : null}
    </form>
  );
}
