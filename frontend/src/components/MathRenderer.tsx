'use client';

import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import 'katex/dist/katex.min.css';

interface MathRendererProps {
    content: string;
    className?: string;
}

export default function MathRenderer({ content, className = "" }: MathRendererProps) {
    return (
        <div className={`prose prose-slate dark:prose-invert max-w-none ${className}`}>
            <ReactMarkdown
                remarkPlugins={[remarkMath, remarkGfm]}
                rehypePlugins={[rehypeKatex]}
                components={{
                    // Maintain some of the old styles if needed, or stick to prose defaults
                    p: ({ node, ...props }) => <p className="mb-2 leading-relaxed" {...props} />,
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
}
