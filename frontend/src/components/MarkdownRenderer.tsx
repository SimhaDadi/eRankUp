import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

interface MarkdownRendererProps {
    content: string;
    className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
    // Pre-process content to handle common LaTeX quirks if necessary
    // For now, we assume standard $ delimiters works with remark-math default

    return (
        <div className={`prose prose-invert prose-headings:font-bold prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg prose-p:text-slate-300 prose-strong:text-white prose-code:text-cyan-400 max-w-none ${className}`}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeKatex]}
                components={{
                    // Custom overrides if needed
                    p: ({ node, ...props }) => <p className="mb-4 leading-relaxed" {...props} />,
                    li: ({ node, ...props }) => <li className="mb-1" {...props} />,
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
};
