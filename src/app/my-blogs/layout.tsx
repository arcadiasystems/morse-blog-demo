/**
 * Admin screens share one centered column. Public pages lay out their own
 * full-bleed sections, so the root layout no longer constrains `<main>`.
 */
export default function MyBlogsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="wrap py-8">{children}</div>;
}
