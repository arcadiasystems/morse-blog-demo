import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import styles from "./MarkdownRenderer.module.css";

type Props = {
  source: string;
  className?: string;
};

export function MarkdownRenderer({ source, className }: Props) {
  return (
    <div className={`${styles.body} ${className ?? ""}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{source}</ReactMarkdown>
    </div>
  );
}
