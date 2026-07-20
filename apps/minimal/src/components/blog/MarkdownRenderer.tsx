import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Props = {
  source: string;
};

export function MarkdownRenderer({ source }: Props) {
  return (
    <div className="prose prose-neutral dark:prose-invert max-w-none prose-headings:font-mono prose-headings:tracking-tight prose-headings:font-bold prose-h1:text-xl prose-h2:text-lg prose-h3:text-base prose-p:leading-relaxed prose-pre:bg-secondary prose-pre:text-foreground prose-pre:border prose-pre:border-border prose-pre:rounded-none prose-code:font-mono prose-code:text-foreground prose-code:text-[0.9em] prose-code:before:content-none prose-code:after:content-none prose-a:text-foreground prose-a:underline prose-blockquote:border-l-foreground/30 prose-img:rounded-none">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{source}</ReactMarkdown>
    </div>
  );
}
