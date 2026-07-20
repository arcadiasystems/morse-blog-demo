import { AboutContent } from "@morse/shared/components/blog/AboutContent";

export default function AboutPage() {
  return (
    <article className="prose prose-neutral dark:prose-invert max-w-none py-8 flex flex-col gap-6 prose-headings:font-mono">
      <AboutContent
        appName="morse"
        headingClassName="text-xl font-bold font-mono"
        linksContainerClassName="flex flex-col gap-2 text-sm pt-2 font-mono"
        linkClassName="text-primary hover:underline"
        linkIcon={<span className="text-muted-foreground">→</span>}
      />
    </article>
  );
}
