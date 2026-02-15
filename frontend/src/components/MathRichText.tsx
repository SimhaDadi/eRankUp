'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import 'katex/dist/katex.min.css';

interface MathRichTextProps {
    content: string;
    className?: string;
}

export const MathRichText: React.FC<MathRichTextProps> = ({ content, className = '' }) => {
    return (
        <div className={`math-rich-text ${className}`}>
            <ReactMarkdown
                remarkPlugins={[remarkMath, remarkGfm]}
                rehypePlugins={[rehypeKatex]}
                components={{
                    p: ({ node, ...props }) => <p className="mb-2" {...props} />,
                    ul: ({ node, ...props }) => <ul className="list-disc ml-6 mb-2" {...props} />,
                    ol: ({ node, ...props }) => <ol className="list-decimal ml-6 mb-2" {...props} />,
                    table: ({ node, ...props }) => (
                        <div className="overflow-x-auto mb-4">
                            <table className="min-w-full divide-y divide-slate-700 border border-slate-700" {...props} />
                        </div>
                    ),
                    th: ({ node, ...props }) => <th className="px-3 py-2 bg-slate-800 text-left font-bold" {...props} />,
                    td: ({ node, ...props }) => <td className="px-3 py-2 border-t border-slate-700" {...props} />,
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
};
