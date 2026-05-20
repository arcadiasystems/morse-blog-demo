import { ReactNode } from "react";
import { TriangleAlert } from "lucide-react";

export function ErrorState({
  title = "Something went wrong",
  description,
  action,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center text-center gap-3 rounded-xl border border-destructive/40 bg-destructive/5 px-6 py-10">
      <div className="grid place-items-center size-11 rounded-full bg-destructive/15 text-destructive border border-destructive/40">
        <TriangleAlert className="size-5" />
      </div>
      <h3 className="text-base font-semibold tracking-tight">{title}</h3>
      {description ? (
        <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
