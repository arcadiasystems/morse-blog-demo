import { Loader2 } from "lucide-react";

export type StatusPhase =
  | "uploading-walrus"
  | "encrypting-seal"
  | "confirming-sui"
  | "signing-session"
  | "fetching-blob"
  | "decrypting"
  | "idle";

const LABELS: Record<Exclude<StatusPhase, "idle">, string> = {
  "uploading-walrus": "Uploading to Walrus",
  "encrypting-seal": "Encrypting with Seal",
  "confirming-sui": "Confirming on Sui",
  "signing-session": "Signing session key",
  "fetching-blob": "Fetching from Walrus",
  decrypting: "Decrypting",
};

export function StatusIndicator({ phase }: { phase: StatusPhase }) {
  if (phase === "idle") return null;
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs text-primary">
      <Loader2 className="size-3 animate-spin" />
      <span className="font-medium">{LABELS[phase]}</span>
      <span className="inline-flex gap-0.5">
        <span className="animate-pulse">.</span>
        <span className="animate-pulse [animation-delay:200ms]">.</span>
        <span className="animate-pulse [animation-delay:400ms]">.</span>
      </span>
    </div>
  );
}
