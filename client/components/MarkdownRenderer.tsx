import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownRendererProps {
  content: string;
  onEvidenceClick?: (evidenceId: string) => void; // Callback for evidence ID clicks
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, onEvidenceClick }) => {
  // Helper function to detect and render evidence IDs as clickable links
  const renderTextWithEvidenceLinks = (text: string) => {
    // Regex to match evidence IDs (e.g., #EV12345, Evidence #123, ID: 456)
    const evidenceIdPattern = /(#EV[\d]+|Evidence\s+#?[\d]+|ID:\s*[\d]+|EvidenceID:\s*[\d]+)/gi;
    const parts = text.split(evidenceIdPattern);
    
    return parts.map((part, index) => {
      if (evidenceIdPattern.test(part)) {
        // Extract numeric ID
        const numericId = part.match(/\d+/)?.[0] || '';
        return (
          <button
            key={index}
            onClick={(e) => {
              e.stopPropagation();
              if (onEvidenceClick && numericId) {
                onEvidenceClick(numericId);
              }
            }}
            className="inline-flex items-center gap-1 px-2 py-0.5 mx-0.5 bg-cyan-900/40 hover:bg-cyan-800/60 text-cyan-300 hover:text-cyan-200 rounded border border-cyan-700/50 hover:border-cyan-500 transition-all text-xs font-mono cursor-pointer"
            title="Click to view evidence"
          >
            🔍 {part}
          </button>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        // Headings
        h1: ({ node, ...props }) => (
          <h1 className="text-2xl font-bold text-white mt-6 mb-4 border-b border-slate-600 pb-2" {...props} />
        ),
        h2: ({ node, ...props }) => (
          <h2 className="text-xl font-bold text-white mt-5 mb-3 border-b border-slate-700 pb-2" {...props} />
        ),
        h3: ({ node, ...props }) => (
          <h3 className="text-lg font-semibold text-cyan-300 mt-4 mb-2" {...props} />
        ),
        h4: ({ node, ...props }) => (
          <h4 className="text-base font-semibold text-cyan-400 mt-3 mb-2" {...props} />
        ),
        h5: ({ node, ...props }) => (
          <h5 className="text-sm font-semibold text-slate-300 mt-2 mb-1" {...props} />
        ),
        h6: ({ node, ...props }) => (
          <h6 className="text-sm font-semibold text-slate-400 mt-2 mb-1" {...props} />
        ),

        // Paragraphs
        p: ({ node, ...props }) => (
          <p className="text-sm text-slate-300 mb-3 leading-relaxed" {...props} />
        ),

        // Lists
        ul: ({ node, ...props }) => (
          <ul className="list-disc list-inside mb-3 space-y-1 text-slate-300 ml-2" {...props} />
        ),
        ol: ({ node, ...props }) => (
          <ol className="list-decimal list-inside mb-3 space-y-1 text-slate-300 ml-2" {...props} />
        ),
        li: ({ node, ...props }) => (
          <li className="text-sm text-slate-300 ml-2" {...props} />
        ),

        // Emphasis
        strong: ({ node, ...props }) => (
          <strong className="font-bold text-white" {...props} />
        ),
        em: ({ node, ...props }) => (
          <em className="italic text-cyan-200" {...props} />
        ),

        // Code
        code: ({ node, inline, className, children, ...props }: any) => {
          if (inline) {
            return (
              <code
                className="bg-slate-800 text-cyan-300 px-1.5 py-0.5 rounded text-xs font-mono border border-slate-700"
                {...props}
              >
                {children}
              </code>
            );
          }
          return (
            <code
              className="block bg-slate-900 text-cyan-300 p-3 rounded-lg text-xs font-mono overflow-x-auto border border-slate-700 my-3"
              {...props}
            >
              {children}
            </code>
          );
        },
        pre: ({ node, ...props }) => (
          <pre className="bg-slate-900 rounded-lg overflow-x-auto my-3" {...props} />
        ),

        // Blockquotes
        blockquote: ({ node, ...props }) => (
          <blockquote
            className="border-l-4 border-cyan-500 bg-slate-800/50 pl-4 py-2 my-3 italic text-slate-300"
            {...props}
          />
        ),

        // Links
        a: ({ node, ...props }) => (
          <a
            className="text-cyan-400 hover:text-cyan-300 underline transition-colors"
            target="_blank"
            rel="noopener noreferrer"
            {...props}
          />
        ),

        // Horizontal Rule
        hr: ({ node, ...props }) => (
          <hr className="border-slate-700 my-4" {...props} />
        ),

        // Tables
        table: ({ node, ...props }) => (
          <div className="overflow-x-auto my-4">
            <table className="min-w-full border border-slate-700 rounded-lg" {...props} />
          </div>
        ),
        thead: ({ node, ...props }) => (
          <thead className="bg-slate-800" {...props} />
        ),
        tbody: ({ node, ...props }) => (
          <tbody className="divide-y divide-slate-700" {...props} />
        ),
        tr: ({ node, ...props }) => (
          <tr className="hover:bg-slate-800/30 transition-colors" {...props} />
        ),
        th: ({ node, ...props }) => (
          <th className="px-4 py-2 text-left text-xs font-semibold text-cyan-300 border border-slate-700" {...props} />
        ),
        td: ({ node, ...props }) => (
          <td className="px-4 py-2 text-sm text-slate-300 border border-slate-700" {...props} />
        ),

        // Task Lists (GitHub Flavored Markdown)
        input: ({ node, ...props }: any) => {
          if (props.type === 'checkbox') {
            return (
              <input
                type="checkbox"
                disabled
                className="mr-2 accent-cyan-500"
                {...props}
              />
            );
          }
          return <input {...props} />;
        },

        // Custom text renderer to make evidence IDs clickable
        text: ({ node, ...props }: any) => {
          const textContent = props.children as string;
          if (typeof textContent === 'string' && onEvidenceClick) {
            return <>{renderTextWithEvidenceLinks(textContent)}</>;
          }
          return <>{textContent}</>;
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
};

export default MarkdownRenderer;
