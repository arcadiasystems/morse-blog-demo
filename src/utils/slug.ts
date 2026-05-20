const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/;

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

export function isValidSlug(slug: string): boolean {
  return SLUG_RE.test(slug);
}

export type SlugValidationError =
  | "empty"
  | "too-long"
  | "invalid-chars"
  | "leading-trailing-hyphen";

export function validateSlug(slug: string): SlugValidationError | null {
  if (slug.length === 0) return "empty";
  if (slug.length > 64) return "too-long";
  if (slug.startsWith("-") || slug.endsWith("-"))
    return "leading-trailing-hyphen";
  if (!SLUG_RE.test(slug)) return "invalid-chars";
  return null;
}

export function slugErrorMessage(err: SlugValidationError): string {
  switch (err) {
    case "empty":
      return "Slug is required.";
    case "too-long":
      return "Slug must be 64 characters or fewer.";
    case "leading-trailing-hyphen":
      return "Slug cannot start or end with a hyphen.";
    case "invalid-chars":
      return "Use lowercase letters, numbers, and hyphens only.";
  }
}
