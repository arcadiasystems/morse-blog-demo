import { toast } from "sonner";

/**
 * Explains why an action that needs a PublisherCap cannot run. A lookup that
 * failed or has not finished is reported as such; only a completed lookup
 * that found no live cap says the cap is missing.
 */
export function toastPublisherCapUnavailable(
  cap: { isPending: boolean; isError: boolean; refetch: () => unknown },
  missingDescription: string,
): void {
  if (cap.isError) {
    toast.error("Couldn't check your publisher cap", {
      description:
        "The read from Sui did not complete. Checking again now; retry in a moment.",
    });
    cap.refetch();
    return;
  }
  if (cap.isPending) {
    toast.message("Still checking your publisher cap", {
      description: "Retry in a moment.",
    });
    return;
  }
  toast.error("Missing publisher cap", { description: missingDescription });
}
