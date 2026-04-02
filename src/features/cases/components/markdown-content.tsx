"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type MarkdownContentProps = {
  content: string;
  className?: string;
};

export function MarkdownContent({
  content,
  className = "space-y-4 text-sm leading-7 text-stone-100",
}: MarkdownContentProps) {
  return (
    <div className={className}>
      <ReactMarkdown
        components={{
          h1: ({ children }) => (
            <h3 className="text-xl font-semibold text-stone-50">{children}</h3>
          ),
          h2: ({ children }) => (
            <h4 className="text-lg font-semibold text-stone-50">{children}</h4>
          ),
          h3: ({ children }) => (
            <h5 className="text-base font-semibold text-stone-50">
              {children}
            </h5>
          ),
          h4: ({ children }) => (
            <h6 className="text-sm font-semibold uppercase tracking-[0.18em] text-stone-50">
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
            <strong className="font-semibold text-stone-50">{children}</strong>
          ),
          em: ({ children }) => <em className="italic text-stone-100">{children}</em>,
          a: ({ href, children }) => (
            <a
              className="font-medium text-[#f3a178] underline decoration-[#f3a178]/50 underline-offset-4 transition hover:decoration-[#f3a178]"
              href={href}
            >
              {children}
            </a>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-stone-500/50 pl-4 italic text-stone-300">
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
                    ? "font-mono text-sm text-stone-100"
                    : "rounded bg-white/10 px-1.5 py-0.5 font-mono text-[0.95em] text-stone-100"
                }
              >
                {children}
              </code>
            );
          },
          pre: ({ children }) => (
            <pre className="overflow-x-auto rounded-2xl border border-white/10 bg-black/40 p-4 text-sm leading-6 text-stone-100">
              {children}
            </pre>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm text-stone-100">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="border-b border-white/10 text-stone-300">
              {children}
            </thead>
          ),
          tbody: ({ children }) => <tbody>{children}</tbody>,
          tr: ({ children }) => (
            <tr className="border-b border-white/10 last:border-0">{children}</tr>
          ),
          th: ({ children }) => (
            <th className="px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-stone-300">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-3 py-2 align-top">{children}</td>
          ),
        }}
        remarkPlugins={[remarkGfm]}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
