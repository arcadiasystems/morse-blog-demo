import { expect, type Page } from "@playwright/test";
import { TEST_WALLET_NAME } from "./test-wallet";

/** An address as the app shortens it: `0x4ea7…4c75`. */
export function short(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

/** Connects the test wallet from the header and waits for the account pill. */
export async function connect(page: Page, address: string): Promise<void> {
  await page
    .getByRole("banner")
    .getByRole("button", { name: "Connect wallet" })
    .click();
  await page
    .getByRole("dialog", { name: "Connect a wallet" })
    .getByRole("button", { name: TEST_WALLET_NAME })
    .click();
  await expect(
    page.getByRole("button", { name: `Wallet ${short(address)}, open menu` }),
  ).toBeVisible();
}
