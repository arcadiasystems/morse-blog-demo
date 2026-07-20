import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Props = {
  source: string;
};

export function MarkdownRenderer({ source }: Props) {
  return (
    <div className="prose dark:prose-invert prose-lg prose-headings:tracking-tight prose-headings:font-semibold prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg prose-p:leading-relaxed prose-pre:bg-secondary prose-pre:rounded-lg prose-pre:border prose-pre:border-border prose-code:text-foreground prose-code:font-medium prose-code:text-[0.9em] prose-code:before:content-none prose-code:after:content-none prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-blockquote:border-l-4 prose-blockquote:border-primary/30 prose-blockquote:not-italic prose-img:rounded-lg max-w-none">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{source}</ReactMarkdown>
    </div>
  );
}
