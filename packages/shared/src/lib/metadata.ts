import { loadPublicBlog } from "../services/public-blog.server";
import { loadPublicEntry } from "../services/public-blog.server";

/**
 * Shared generateMetadata logic for the [publicationId] route.
 *
 * Each template re-exports (or wraps) this from its page file,
 * passing its own `appName` so the title suffix matches the template.
 */
export async function generatePublicBlogMetadata(
  publicationId: string,
  appName: string = "morse blog",
) {
  const data = await loadPublicBlog(publicationId);
  if (!data) {
    return { title: `Publication not found - ${appName}` };
  }
  return {
    title: `${data.publication.name} - ${appName}`,
    description: `A morse publication. Read posts stored on Walrus.`,
  };
}

/**
 * Shared generateMetadata logic for the [publicationId]/[entryId] route.
 */
export async function generatePostMetadata(
  params: { publicationId: string; entryId: string },
  collection: string | undefined,
  appName: string = "morse blog",
) {
  const entryIdNum = Number(params.entryId);
  if (!Number.isFinite(entryIdNum)) {
    return { title: `Post not found - ${appName}` };
  }
  const data = await loadPublicEntry(
    params.publicationId,
    entryIdNum,
    collection,
  );
  if (!data) return { title: `Post not found - ${appName}` };
  return {
    title: `${data.entry.name || `Post #${data.entry.id}`} - ${data.publication.name}`,
  };
}
