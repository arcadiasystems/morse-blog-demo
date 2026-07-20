import { AboutContent } from "@morse/shared/components/blog/AboutContent";

export default function AboutPage() {
  return (
    <article className="max-w-2xl mx-auto py-8">
      <div className="bg-card rounded-lg shadow-sm p-8 sm:p-10">
        <div className="prose prose-lg max-w-none">
          <AboutContent
            appName="morse"
            headingClassName="text-3xl font-bold tracking-tight text-foreground"
            codeClassName="text-sm bg-secondary px-1.5 py-0.5 rounded font-medium text-foreground"
            linksContainerClassName="flex flex-col gap-3 pt-4 mt-6 border-t border-border"
            linkClassName="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
            linkIcon={<>&rarr;</>}
          />
        </div>
      </div>
    </article>
  );
}
