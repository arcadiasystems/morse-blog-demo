import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/feedback/ErrorState";

/**
 * Shown when the PublisherCap lookup itself failed. That is not "no cap":
 * the wallet may well hold a live one, so the page offers the check again
 * instead of telling the author they have no access.
 */
export function PublisherCapCheckError({
  onRetry,
  retrying,
}: {
  onRetry: () => void;
  retrying: boolean;
}) {
  return (
    <ErrorState
      title="Couldn't check your publisher cap"
      description="The read from Sui that confirms your PublisherCap on this blog did not complete, so this page can't tell yet whether your wallet can write here. Nothing changed on chain."
      action={
        <Button variant="outline" onClick={onRetry} disabled={retrying}>
          {retrying ? "Trying again" : "Try again"}
        </Button>
      }
    />
  );
}
