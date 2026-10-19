import type { ReactNode } from "react";
import {
  CodeBlock,
  CodeBlockActions,
  CodeBlockContent,
  CodeBlockCopyButton,
  CodeBlockHeader,
  CodeBlockTitle,
} from "@/components/ui/code-block";

export function SampleCode({
  title,
  value,
  children,
  extra,
}: {
  title: string;
  value: string;
  children: ReactNode;
  extra?: ReactNode;
}) {
  return (
    <CodeBlock className="bg-white shadow-[0_8px_24px_-18px_rgba(15,23,42,0.45)]">
      <CodeBlockHeader>
        <CodeBlockTitle>
          {title}
          {extra}
        </CodeBlockTitle>
        <CodeBlockActions>
          <CodeBlockCopyButton value={value} />
        </CodeBlockActions>
      </CodeBlockHeader>
      <CodeBlockContent lineNumbers>{children}</CodeBlockContent>
    </CodeBlock>
  );
}
