"use client";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { LockIcon } from "@/components/brand/icons";
import styles from "@/components/feedback/states.module.css";

/**
 * Confirmation shown before a Seal unlock asks the wallet for a signature,
 * so the popup that follows is expected and its cost (none) is clear.
 */
export function SignToDecryptDialog({
  open,
  onOpenChange,
  onSign,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSign: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className={`${styles.state} ${styles.dialog}`}
      >
        <span className={styles.icon}>
          <LockIcon size={20} />
        </span>
        <div>
          <DialogTitle className={styles.title}>Sign to decrypt</DialogTitle>
          <DialogDescription className={styles.text}>
            Your wallet will ask you to sign one message. Nothing is sent
            on-chain and no gas is spent. The Seal key server checks your
            capability and returns the key.
          </DialogDescription>
          <div className={styles.acts}>
            <button type="button" className="btn btn-ultra sm" onClick={onSign}>
              Sign message
            </button>
            <DialogClose asChild>
              <button type="button" className="btn btn-soft sm">
                Cancel
              </button>
            </DialogClose>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
