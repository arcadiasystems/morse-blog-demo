import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import {
  type APIRequestContext,
  type BrowserContext,
  expect,
  type Page,
  test,
} from "@playwright/test";
import { connect } from "./app-actions";
import { revocationRowIds } from "./chain";
import {
  COAUTHOR_KEY_ENV,
  installTestWallet,
  keypairFromEnv,
  OWNER_KEY_ENV,
} from "./test-wallet";

const owner = keypairFromEnv(OWNER_KEY_ENV);
// The co-author only receives a cap and reads, so a throwaway key will do.
const coauthor = keypairFromEnv(COAUTHOR_KEY_ENV) ?? new Ed25519Keypair();

/** Unique per run: slugs are unique across every Morse publication. */
const stamp = Date.now().toString(36);
const blogName = `E2E ${stamp}`;
const post = {
  title: `Public post ${stamp}`,
  first: `first-body-${stamp}`,
  second: `second-body-${stamp}`,
};
const premium = {
  title: `Premium post ${stamp}`,
  first: `sealed-first-${stamp}`,
  second: `sealed-second-${stamp}`,
};

/** A transaction and the reads after it: Testnet finality plus indexing. */
const ON_CHAIN = { timeout: 90_000 };

function editor(page: Page) {
  return page.getByPlaceholder("# Your post");
}

async function openTab(page: Page, name: string): Promise<void> {
  await page.getByRole("tab", { name }).click();
}

/** The server-rendered HTML of a public page, with no JavaScript run. */
async function serverHtml(
  request: APIRequestContext,
  path: string,
): Promise<string> {
  const response = await request.get(path);
  expect(response.status(), `GET ${path}`).toBe(200);
  return response.text();
}

async function writePost(
  page: Page,
  publicationId: string,
  draft: { title: string; body: string; premium: boolean },
): Promise<void> {
  // Right after the blog is created the fullnode may not list its new
  // PublisherCap yet, and the page then says there is none: load it again.
  const title = page.locator("input#title");
  await expect(async () => {
    await page.goto(`/my-blogs/${publicationId}/write`);
    await expect(title).toBeVisible({ timeout: 15_000 });
  }).toPass(ON_CHAIN);
  await title.fill(draft.title);
  await editor(page).fill(draft.body);
  if (draft.premium) await page.getByRole("switch").click();
  await page
    .getByRole("button", {
      name: draft.premium ? "Publish premium" : "Publish post",
    })
    .click();
  await page.waitForURL(`**/my-blogs/${publicationId}`, ON_CHAIN);
}

/** The id of the entry called `title`, read from its row on the admin page. */
async function entryIdOf(
  page: Page,
  publicationId: string,
  tab: "Posts" | "Drafts",
  title: string,
): Promise<number> {
  await page.goto(`/my-blogs/${publicationId}`);
  await openTab(page, tab);
  const row = page.getByRole("link", { name: title });
  await expect(row).toBeVisible(ON_CHAIN);
  const href = await row.getAttribute("href");
  const match = href?.match(/\/posts\/(\d+)\/edit/);
  if (!match) throw new Error(`No entry id in the row link ${href}.`);
  return Number(match[1]);
}

test.describe.serial("authoring with a wallet on Testnet", () => {
  test.skip(!owner, `Set ${OWNER_KEY_ENV} to run the wallet tests.`);
  test.setTimeout(300_000);

  let ownerContext: BrowserContext;
  let coauthorContext: BrowserContext;
  let ownerPage: Page;
  let coauthorPage: Page;
  let publicationId: string;
  let postId: number;
  let premiumId: number;

  test.beforeAll(async ({ browser }) => {
    if (!owner) return;
    ownerContext = await browser.newContext({
      viewport: { width: 1440, height: 900 },
    });
    await installTestWallet(ownerContext, owner);
    ownerPage = await ownerContext.newPage();
    await ownerPage.goto("/my-blogs");
    await connect(ownerPage, owner.toSuiAddress());

    coauthorContext = await browser.newContext({
      viewport: { width: 1440, height: 900 },
    });
    await installTestWallet(coauthorContext, coauthor);
    coauthorPage = await coauthorContext.newPage();
    await coauthorPage.goto("/my-blogs");
    await connect(coauthorPage, coauthor.toSuiAddress());
  });

  test.afterAll(async () => {
    await ownerContext?.close();
    await coauthorContext?.close();
  });

  test("creates a blog", async () => {
    await ownerPage.goto("/my-blogs/new");
    await ownerPage.getByLabel("Name").fill(blogName);
    await ownerPage.getByLabel("Slug").fill(`e2e-${stamp}`);
    await ownerPage.getByRole("button", { name: "Create blog" }).click();
    await ownerPage.waitForURL(/\/my-blogs\/0x[0-9a-f]{64}$/, ON_CHAIN);
    publicationId = new URL(ownerPage.url()).pathname.split("/")[2];
    await expect(
      ownerPage.getByRole("heading", { name: blogName }),
    ).toBeVisible(ON_CHAIN);
  });

  test("publishes a post that the public pages render on the server", async ({
    request,
  }) => {
    await writePost(ownerPage, publicationId, {
      title: post.title,
      body: post.first,
      premium: false,
    });
    postId = await entryIdOf(ownerPage, publicationId, "Posts", post.title);

    // No browser: the title and the Walrus body are in the HTML itself.
    await expect(async () => {
      expect(await serverHtml(request, `/${publicationId}`)).toContain(
        post.title,
      );
      const html = await serverHtml(request, `/${publicationId}/${postId}`);
      expect(html).toContain(post.title);
      expect(html).toContain(post.first);
    }).toPass(ON_CHAIN);
  });

  test("edits the post and publishes the revision", async ({ request }) => {
    await ownerPage.goto(`/my-blogs/${publicationId}/posts/${postId}/edit`);
    await expect(editor(ownerPage)).toHaveValue(post.first, ON_CHAIN);
    await editor(ownerPage).fill(post.second);
    await ownerPage.getByRole("button", { name: "Save draft" }).click();
    await expect(ownerPage.getByText("Draft saved").first()).toBeVisible(
      ON_CHAIN,
    );
    await ownerPage.getByRole("button", { name: "Publish draft" }).click();
    await expect(
      ownerPage.getByText("Published", { exact: true }).first(),
    ).toBeVisible(ON_CHAIN);

    await expect(async () => {
      const current = await serverHtml(request, `/${publicationId}/${postId}`);
      expect(current).toContain(post.second);
      expect(current).not.toContain(post.first);
      // The first revision is still there, under its own number.
      expect(
        await serverHtml(request, `/${publicationId}/${postId}?rev=1`),
      ).toContain(post.first);
    }).toPass(ON_CHAIN);
  });

  test("saves an encrypted draft and decrypts it", async ({ request }) => {
    await writePost(ownerPage, publicationId, {
      title: premium.title,
      body: premium.first,
      premium: true,
    });
    premiumId = await entryIdOf(
      ownerPage,
      publicationId,
      "Drafts",
      premium.title,
    );

    // Decrypt in the editor, then save a second encrypted revision.
    await ownerPage.goto(`/my-blogs/${publicationId}/posts/${premiumId}/edit`);
    await ownerPage.getByRole("button", { name: "Unlock to edit" }).click();
    await expect(editor(ownerPage)).toHaveValue(premium.first, ON_CHAIN);
    await editor(ownerPage).fill(premium.second);
    await ownerPage
      .getByRole("button", { name: "Save encrypted draft" })
      .click();
    await expect(
      ownerPage.getByText("Encrypted draft saved").first(),
    ).toBeVisible(ON_CHAIN);

    // The server never sees the plaintext of either revision.
    const html = await serverHtml(request, `/${publicationId}/${premiumId}`);
    expect(html).toContain(premium.title);
    expect(html).not.toContain(premium.first);
    expect(html).not.toContain(premium.second);

    // A reader holding the cap unlocks the new revision with one signature.
    await ownerPage.goto(`/${publicationId}/${premiumId}`);
    await ownerPage.getByRole("button", { name: "Unlock post" }).click();
    await ownerPage.getByRole("button", { name: "Sign message" }).click();
    await expect(ownerPage.getByText(premium.second)).toBeVisible(ON_CHAIN);
  });

  test("a co-author with a PublisherCap sees the shared blog and can write", async () => {
    await ownerPage.goto(`/my-blogs/${publicationId}`);
    await openTab(ownerPage, "Members");
    await ownerPage.getByLabel("Sui address").fill(coauthor.toSuiAddress());
    await ownerPage.getByRole("button", { name: "Invite" }).click();
    await expect(
      ownerPage.getByText("Publisher cap issued").first(),
    ).toBeVisible(ON_CHAIN);

    await expect(async () => {
      await coauthorPage.goto("/my-blogs");
      await expect(
        coauthorPage
          .locator("section", { hasText: "Shared with me" })
          .getByText(blogName),
      ).toBeVisible({ timeout: 15_000 });
    }).toPass(ON_CHAIN);

    await coauthorPage.goto(`/${publicationId}`);
    await expect(
      coauthorPage.getByRole("link", { name: "New post" }),
    ).toBeVisible();
    await expect(
      coauthorPage.getByRole("link", { name: "Manage caps" }),
    ).toBeHidden();

    await coauthorPage.goto(`/my-blogs/${publicationId}/write`);
    await expect(
      coauthorPage.getByRole("heading", { name: "Write post" }),
    ).toBeVisible();
    await expect(editor(coauthorPage)).toBeEditable();
  });

  test("a failed revocation read shows an error with a retry, never 'no access'", async () => {
    const rowIds = await revocationRowIds(
      publicationId,
      coauthor.toSuiAddress(),
    );
    expect(rowIds).toHaveLength(1);
    const batchGetObjects = "**/sui.rpc.v2.LedgerService/BatchGetObjects";
    await coauthorContext.route(batchGetObjects, async (route) => {
      // gRPC-web text framing: the body is base64 of the protobuf message,
      // which carries the requested object ids as plain strings.
      const body = Buffer.from(
        route.request().postData() ?? "",
        "base64",
      ).toString("latin1");
      if (rowIds.some((id) => body.includes(id))) await route.abort();
      else await route.continue();
    });

    await coauthorPage.goto(`/my-blogs/${publicationId}/write`);
    await expect(
      coauthorPage.getByText("Couldn't check your publisher cap"),
    ).toBeVisible();
    await expect(
      coauthorPage.getByText("No publisher cap for this blog"),
    ).toBeHidden();

    await coauthorPage.goto(`/my-blogs/${publicationId}/posts/${postId}/edit`);
    await expect(
      coauthorPage.getByText("Couldn't check your publisher cap"),
    ).toBeVisible();

    await coauthorPage.goto("/my-blogs");
    await expect(
      coauthorPage.getByText("Couldn't load blogs shared with you"),
    ).toBeVisible();

    await coauthorPage.goto(`/${publicationId}`);
    await expect(
      coauthorPage.getByRole("button", {
        name: "Access check failed. Try again",
      }),
    ).toBeVisible();

    await coauthorPage.goto(`/${publicationId}/${premiumId}`);
    await expect(
      coauthorPage.getByRole("heading", {
        name: "Could not check your access",
      }),
    ).toBeVisible();
    await expect(
      coauthorPage.getByRole("heading", { name: "No access" }),
    ).toBeHidden();

    // Once the read works again, the retry restores what the cap grants.
    await coauthorContext.unroute(batchGetObjects);
    await coauthorPage.getByRole("button", { name: "Try again" }).click();
    await expect(
      coauthorPage.getByRole("button", { name: "Unlock post" }),
    ).toBeVisible();
  });

  test("revoking the cap ends the co-author's access and leaves the owner's", async () => {
    await ownerPage.goto(`/my-blogs/${publicationId}`);
    await openTab(ownerPage, "Members");
    await ownerPage.getByRole("button", { name: "Revoke cap" }).click();
    await ownerPage
      .getByRole("alertdialog")
      .getByRole("button", { name: "Revoke cap" })
      .click();
    await expect(
      ownerPage.getByText("Cap revoked").first(),
    ).toBeVisible(ON_CHAIN);

    await expect(async () => {
      await coauthorPage.goto(`/my-blogs/${publicationId}/write`);
      await expect(
        coauthorPage.getByText("No publisher cap for this blog"),
      ).toBeVisible({ timeout: 15_000 });
    }).toPass(ON_CHAIN);

    await coauthorPage.goto(`/${publicationId}`);
    await expect(
      coauthorPage.getByRole("heading", { name: blogName }),
    ).toBeVisible();
    await coauthorPage.waitForLoadState("networkidle");
    await expect(
      coauthorPage.getByRole("link", { name: "New post" }),
    ).toBeHidden();

    // The co-author wallet may hold caps on other blogs, so only this
    // blog's card is asserted on, once the lists have loaded.
    await coauthorPage.goto("/my-blogs");
    await expect(coauthorPage.getByText("No blogs yet")).toBeVisible();
    await coauthorPage.waitForLoadState("networkidle");
    await expect(coauthorPage.getByText(blogName)).toBeHidden();
    await expect(
      coauthorPage.getByText("Couldn't load blogs shared with you"),
    ).toBeHidden();

    // The publisher still holds a live cap of their own.
    await ownerPage.goto(`/${publicationId}`);
    await expect(
      ownerPage.getByRole("link", { name: "New post" }),
    ).toBeVisible();
    await ownerPage.goto(`/my-blogs/${publicationId}/write`);
    await expect(editor(ownerPage)).toBeEditable();
  });

  test("deletes a post", async ({ request }) => {
    await ownerPage.goto(`/my-blogs/${publicationId}`);
    await openTab(ownerPage, "Posts");
    await ownerPage.getByRole("button", { name: "Open actions menu" }).click();
    await ownerPage.getByRole("menuitem", { name: "Delete" }).click();
    await ownerPage
      .getByRole("button", { name: "Delete permanently" })
      .click();
    await expect(ownerPage.getByText("Post deleted").first()).toBeVisible(
      ON_CHAIN,
    );
    await expect(ownerPage.getByRole("link", { name: post.title })).toBeHidden(
      ON_CHAIN,
    );

    await expect(async () => {
      const response = await request.get(`/${publicationId}/${postId}`);
      expect(response.status()).toBe(404);
    }).toPass(ON_CHAIN);
  });
});
