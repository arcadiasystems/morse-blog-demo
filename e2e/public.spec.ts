import {
  type APIRequestContext,
  expect,
  type Page,
  test,
} from "@playwright/test";

/**
 * The reader side of the app: no wallet, no key. These tests read the seeded
 * demo publication from Testnet through the server, so they run in CI. They
 * assert what Sui holds forever (names, entries, the on-chain record), not
 * the Walrus bodies, whose storage lease runs out; a fresh body rendered on
 * the server is covered by the wallet suite.
 */

const MISSING_PUBLICATION = `0x${"0".repeat(61)}abc`;

/** The demo publication's path, as linked from the home page of this build. */
async function demoBlogPath(page: Page): Promise<string> {
  await page.goto("/");
  const href = await page
    .getByRole("link", { name: "Read the demo blog" })
    .getAttribute("href");
  if (!href) throw new Error("The home page does not link to a demo blog.");
  return href;
}

/** Server-rendered HTML of a page, fetched without running any JavaScript. */
async function serverHtml(
  request: APIRequestContext,
  path: string,
): Promise<string> {
  const response = await request.get(path);
  expect(response.status(), `GET ${path}`).toBe(200);
  return response.text();
}

test.describe("public pages", () => {
  test("the home page renders and offers to connect a wallet", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "Build a blog you actually own." }),
    ).toBeVisible();
    await expect(
      page.getByRole("banner").getByRole("button", { name: "Connect wallet" }),
    ).toBeVisible();
  });

  test("a blog index is rendered on the server", async ({ page, request }) => {
    const blog = await demoBlogPath(page);
    const html = await serverHtml(request, blog);
    expect(html).toContain("The Morse Demo Blog");
    expect(html).toContain("Welcome, this blog has no backend");

    await page.goto(blog);
    await expect(
      page.getByRole("heading", { name: "The Morse Demo Blog" }),
    ).toBeVisible();
    // A reader without a wallet gets no writer actions and no error.
    await expect(page.getByRole("link", { name: "New post" })).toBeHidden();
    await expect(
      page.getByRole("button", { name: /Access check failed/ }),
    ).toBeHidden();
  });

  test("a published post is rendered on the server with its on-chain record", async ({
    page,
    request,
  }) => {
    const blog = await demoBlogPath(page);
    const html = await serverHtml(request, `${blog}/0`);
    expect(html).toContain("Welcome, this blog has no backend");
    expect(html).toContain("On-chain record");
    expect(html).toContain("Sui transaction");
  });

  test("a premium post stays locked for a reader without a wallet", async ({
    page,
  }) => {
    const blog = await demoBlogPath(page);
    await page.goto(blog);
    await page
      .getByRole("link", { name: /The launch playbook \(premium\)/ })
      .first()
      .click();
    await expect(
      page.getByRole("heading", { name: "Connect to unlock" }),
    ).toBeVisible();
  });

  test("a blog or post that does not exist is a 404", async ({
    page,
    request,
  }) => {
    const blog = await demoBlogPath(page);
    for (const path of [
      `/${MISSING_PUBLICATION}`,
      "/not-a-publication-id",
      `${blog}/99999`,
    ]) {
      const response = await request.get(path);
      expect(response.status(), `GET ${path}`).toBe(404);
    }
  });

  test("the blog index fits a 390px screen", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(await demoBlogPath(page));
    await expect(
      page.getByRole("heading", { name: "The Morse Demo Blog" }),
    ).toBeVisible();
    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
});
