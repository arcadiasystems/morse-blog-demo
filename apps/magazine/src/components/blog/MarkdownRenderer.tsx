import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Props = {
  source: string;
};

export function MarkdownRenderer({ source }: Props) {
  return (
    <div className="prose prose-invert prose-lg font-sans prose-headings:font-heading prose-headings:tracking-tight prose-headings:font-bold prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl prose-p:leading-relaxed prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-blockquote:border-l-primary/50 prose-pre:bg-card/70 prose-pre:border prose-pre:border-border/60 prose-pre:rounded-lg prose-code:text-accent-foreground prose-code:font-mono prose-code:text-[0.9em] prose-code:before:content-none prose-code:after:content-none prose-img:rounded-lg max-w-none">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{source}</ReactMarkdown>
    </div>
  );
}
