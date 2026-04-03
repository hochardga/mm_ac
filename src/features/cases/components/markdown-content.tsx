"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type MarkdownContentProps = {
  content: string;
  className?: string;
  tone?: "dark" | "paper";
};

const markdownToneClasses = {
  dark: {
    wrapper: "space-y-4 text-sm leading-7 text-stone-100",
    heading: "text-stone-50",
    link: "font-medium text-[#f3a178] underline decoration-[#f3a178]/50 underline-offset-4 transition hover:decoration-[#f3a178]",
    blockquote: "border-l-2 border-stone-500/50 pl-4 italic text-stone-300",
    codeInline:
      "rounded bg-white/10 px-1.5 py-0.5 font-mono text-[0.95em] text-stone-100",
    codeBlock:
      "overflow-x-auto rounded-2xl border border-white/10 bg-black/40 p-4 text-sm leading-6 text-stone-100",
    table: "w-full border-collapse text-left text-sm text-stone-100",
    tableHead: "border-b border-white/10 text-stone-300",
    tableRow: "border-b border-white/10 last:border-0",
    tableHeader:
      "px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-stone-300",
    tableCell: "px-3 py-2 align-top",
  },
  paper: {
    wrapper:
      "space-y-4 font-serif text-[0.98rem] leading-8 text-stone-900 [text-wrap:pretty]",
    heading: "text-stone-950",
    link: "font-medium text-[#8b5a2b] underline decoration-[#8b5a2b]/45 underline-offset-4 transition hover:decoration-[#8b5a2b]",
    blockquote: "border-l-2 border-stone-500/45 pl-4 italic text-stone-700",
    codeInline:
      "rounded bg-stone-900/10 px-1.5 py-0.5 font-mono text-[0.95em] text-stone-900",
    codeBlock:
      "overflow-x-auto rounded-2xl border border-stone-900/10 bg-stone-900/5 p-4 text-sm leading-6 text-stone-900",
    table: "w-full border-collapse text-left text-sm text-stone-900",
    tableHead: "border-b border-stone-900/10 text-stone-700",
    tableRow: "border-b border-stone-900/10 last:border-0",
    tableHeader:
      "px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-stone-700",
    tableCell: "px-3 py-2 align-top",
  },
} as const;

export function MarkdownContent({
  content,
  className,
  tone = "dark",
}: MarkdownContentProps) {
  const styles = markdownToneClasses[tone];

  return (
    <div className={className ?? styles.wrapper}>
      <ReactMarkdown
        components={{
          h1: ({ children }) => (
            <h3 className={`text-xl font-semibold ${styles.heading}`}>
              {children}
            </h3>
          ),
          h2: ({ children }) => (
            <h4 className={`text-lg font-semibold ${styles.heading}`}>
              {children}
            </h4>
          ),
          h3: ({ children }) => (
            <h5 className={`text-base font-semibold ${styles.heading}`}>
              {children}
            </h5>
          ),
          h4: ({ children }) => (
            <h6
              className={`text-sm font-semibold uppercase tracking-[0.18em] ${styles.heading}`}
            >
              {children}
            </h6>
          ),
          p: ({ children }) => <p>{children}</p>,
          ul: ({ children }) => (
            <ul className="list-disc space-y-2 pl-6">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal space-y-2 pl-6">{children}</ol>
          ),
          li: ({ children }) => <li className="pl-1">{children}</li>,
          strong: ({ children }) => (
            <strong className={`font-semibold ${styles.heading}`}>
              {children}
            </strong>
          ),
          em: ({ children }) => (
            <em className="italic text-inherit">{children}</em>
          ),
          a: ({ href, children }) => (
            <a
              className={styles.link}
              href={href}
            >
              {children}
            </a>
          ),
          blockquote: ({ children }) => (
            <blockquote className={styles.blockquote}>
              {children}
            </blockquote>
          ),
          code: ({ children, className }) => {
            const isBlockCode =
              typeof className === "string" && className.includes("language-");

            return (
              <code
                className={
                  isBlockCode
                    ? "font-mono text-sm"
                    : styles.codeInline
                }
              >
                {children}
              </code>
            );
          },
          pre: ({ children }) => (
            <pre className={styles.codeBlock}>
              {children}
            </pre>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto">
              <table className={styles.table}>
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => <thead className={styles.tableHead}>{children}</thead>,
          tbody: ({ children }) => <tbody>{children}</tbody>,
          tr: ({ children }) => <tr className={styles.tableRow}>{children}</tr>,
          th: ({ children }) => <th className={styles.tableHeader}>{children}</th>,
          td: ({ children }) => <td className={styles.tableCell}>{children}</td>,
        }}
        remarkPlugins={[remarkGfm]}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
