import React from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import remarkGfm from "remark-gfm";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css"; // Ensure Katex CSS is imported for math styling

interface MarkdownRendererProps {
  content: string;
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  if (!content) return null;

  return (
    <div className="markdown-content select-text">
      <ReactMarkdown
        remarkPlugins={[remarkMath, remarkGfm]}
        rehypePlugins={[rehypeKatex]}
        components={{
          h1: ({ node, ...props }) => <h2 className="font-display font-bold text-slate-800 dark:text-slate-100 text-xl md:text-2xl tracking-tight mt-10 mb-4 pb-2 border-b-2 border-slate-200 dark:border-slate-800" {...props} />,
          h2: ({ node, ...props }) => <h3 className="font-display font-bold text-slate-800 dark:text-slate-100 text-lg md:text-xl tracking-tight mt-8 mb-4 pb-2 border-b border-slate-100 dark:border-slate-800" {...props} />,
          h3: ({ node, ...props }) => <h4 className="font-display font-medium text-slate-800 dark:text-slate-100 text-base md:text-lg tracking-tight mt-6 mb-3 border-l-[3px] border-indigo-500 pl-3.5 flex items-center gap-2" {...props} />,
          h4: ({ node, ...props }) => <h5 className="font-sans font-medium text-slate-700 dark:text-slate-200 text-sm md:text-base tracking-tight mt-5 mb-2 flex items-center gap-2" {...props} />,
          p: ({ node, ...props }) => <div className="text-[15px] leading-[1.75] text-slate-700 dark:text-slate-300 font-sans my-4" {...props} />,
          ul: ({ node, ...props }) => <ul className="space-y-2 my-4 pl-1" {...props} />,
          ol: ({ node, ...props }) => <ol className="space-y-2 my-4 pl-1 list-decimal list-inside text-[15px] text-slate-700 dark:text-slate-300 font-sans" {...props} />,
          li: ({ node, ...props }) => (
            <li className="group flex items-start gap-3 transition-colors duration-200 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900/40">
              <span className="w-2 h-2 rounded-full bg-indigo-500/80 shrink-0 mt-2 group-hover:bg-indigo-600 transition-colors duration-200 shadow-sm mt-1.5" />
              <div className="flex-1 text-[15px] text-slate-700 dark:text-slate-300 leading-[1.7] font-sans break-words" {...props} />
            </li>
          ),
          blockquote: ({ node, ...props }) => (
            <blockquote className="my-6 p-5 italic bg-indigo-50/40 dark:bg-slate-900/50 border-l-4 border-indigo-500 rounded-r-2xl text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed" {...props} />
          ),
          pre: ({ children, ...props }: any) => {
            let codeText = children;
            let className = '';

            if (React.isValidElement(children) && children.type === 'code') {
              className = (children.props as any).className || '';
              codeText = (children.props as any).children || '';
            }

            const match = /language-(\w+)/.exec(className);
            return (
              <div className="my-5 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                <div className="flex items-center justify-between px-4 py-2 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 select-none">
                  <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">{match ? match[1] : "Code"}</span>
                  <span className="font-mono text-[20px] text-indigo-500 leading-none">·</span>
                </div>
                <div className="p-4 bg-slate-950 text-slate-200 dark:text-slate-100 font-mono text-xs overflow-x-auto leading-relaxed overflow-hidden">
                  <pre className="!bg-transparent !p-0 !m-0 overflow-auto" {...props}>
                    <code className={className}>
                      {codeText}
                    </code>
                  </pre>
                </div>
              </div>
            );
          },
          code: ({ node, className, children, ...props }: any) => {
            return (
              <code className="bg-slate-100 dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 font-mono text-[13px] font-medium px-1.5 py-0.5 rounded-md border border-slate-200/50 dark:border-slate-700/50 break-words" {...props}>
                {children}
              </code>
            );
          },
          table: ({ node, ...props }) => <div className="w-full overflow-x-auto my-6"><table className="w-full text-left border-collapse text-sm text-slate-700 dark:text-slate-300" {...props} /></div>,
          thead: ({ node, ...props }) => <thead className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 font-semibold" {...props} />,
          tbody: ({ node, ...props }) => <tbody className="divide-y divide-slate-100 dark:divide-slate-800" {...props} />,
          tr: ({ node, ...props }) => <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors" {...props} />,
          th: ({ node, ...props }) => <th className="px-4 py-3 font-medium border-b-2 border-slate-200 dark:border-slate-800 whitespace-nowrap bg-slate-100/50 dark:bg-slate-900" {...props} />,
          td: ({ node, ...props }) => <td className="px-4 py-3 leading-relaxed border-b border-slate-100 dark:border-slate-800/50" {...props} />,
          strong: ({ node, ...props }) => <strong className="font-semibold text-slate-900 dark:text-slate-100" {...props} />,
          em: ({ node, ...props }) => <em className="italic text-slate-800 dark:text-slate-200" {...props} />,
          hr: ({ node, ...props }) => <hr className="my-8 border-slate-200 dark:border-slate-800" {...props} />,
          a: ({ node, ...props }) => <a className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline decoration-indigo-300 dark:decoration-indigo-600 underline-offset-2" {...props} />
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
