import { ExternalLink } from "lucide-react";
import { AboutContent } from "@morse/shared/components/blog/AboutContent";

export default function AboutPage() {
  return (
    <article className="prose dark:prose-invert prose-lg max-w-2xl mx-auto py-8 flex flex-col gap-6 prose-headings:font-serif">
      <AboutContent
        appName="morse"
        headingClassName="text-3xl font-semibold tracking-tight font-serif"
        linksContainerClassName="flex flex-col gap-2 text-sm pt-2"
        linkClassName="inline-flex items-center gap-1.5 text-foreground hover:text-primary transition-colors"
        linkIcon={<ExternalLink className="size-3.5" />}
      />
    </article>
  );
}
