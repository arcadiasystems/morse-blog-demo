"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "../../components/ui/skeleton";
import "@uiw/react-md-editor/markdown-editor.css";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), {
  ssr: false,
  loading: () => <Skeleton className="h-[480px] w-full rounded-lg" />,
});

type Props = {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  minHeight?: number;
};

export function MarkdownEditor({
  value,
  onChange,
  placeholder = "# Your post\n\nWrite anything. Markdown is supported.",
  minHeight = 480,
}: Props) {
  return (
    <div data-color-mode="dark" className="rounded-lg overflow-hidden">
      <MDEditor
        value={value}
        onChange={(v) => onChange(v ?? "")}
        height={minHeight}
        textareaProps={{ placeholder }}
        preview="edit"
        visibleDragbar={false}
      />
    </div>
  );
}
