import { ReactNode } from "react";
import { Label } from "@/components/ui/label";

type Props = {
  id: string;
  label: string;
  help?: ReactNode;
  error?: string | null;
  required?: boolean;
  children: ReactNode;
};

export function Field({ id, label, help, error, required, children }: Props) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} className="text-sm font-medium">
        {label}
        {required ? (
          <span className="text-destructive ml-0.5" aria-hidden>
            *
          </span>
        ) : null}
      </Label>
      {children}
      {error ? (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : help ? (
        <p className="text-xs text-muted-foreground leading-relaxed">{help}</p>
      ) : null}
    </div>
  );
}
