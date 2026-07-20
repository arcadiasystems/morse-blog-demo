import { ExternalLink } from "lucide-react";
import { AboutContent } from "@morse/shared/components/blog/AboutContent";

export default function AboutPage() {
  return (
    <article className="prose prose-invert max-w-2xl mx-auto py-12 flex flex-col gap-8">
      <AboutContent
        appName="morse·blog"
        headingClassName="text-4xl font-heading font-bold tracking-tight"
        linksContainerClassName="flex flex-col gap-3 text-sm pt-4 border-t border-border/60"
        linkClassName="inline-flex items-center gap-1.5 text-primary hover:text-accent-foreground transition-colors no-underline"
        linkIcon={<ExternalLink className="size-3.5" />}
      />
    </article>
  );
}
