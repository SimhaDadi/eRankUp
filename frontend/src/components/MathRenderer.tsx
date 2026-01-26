'use client';

import { useEffect, useRef } from 'react';

declare global {
    interface Window {
        MathJax: any;
    }
}

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MathRendererProps {
    content: string;
    className?: string;
}

export default function MathRenderer({ content, className = '' }: MathRendererProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    // Function to render math
    const renderMath = () => {
        if (!window.MathJax) return;

        if (window.MathJax.startup && window.MathJax.startup.promise) {
            window.MathJax.startup.promise.then(() => {
                if (containerRef.current) {
                    window.MathJax.typesetPromise([containerRef.current]);
                }
            });
        } else if (window.MathJax.typesetPromise && containerRef.current) {
            window.MathJax.typesetPromise([containerRef.current]);
        }
    };

    useEffect(() => {
        // Load MathJax script if not already present
        if (!window.MathJax) {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js';
            script.async = true;
            script.id = 'mathjax-script';
            document.head.appendChild(script);

            window.MathJax = {
                tex: {
                    inlineMath: [['$', '$'], ['\\(', '\\)']],
                    displayMath: [['$$', '$$'], ['\\[', '\\]']],
                },
                svg: { fontCache: 'global' },
                startup: {
                    pageReady: () => {
                        return window.MathJax.startup.defaultPageReady().then(() => {
                            renderMath();
                        });
                    }
                }
            };
        } else {
            renderMath();
        }
    }, [content]);

    // Re-run math rendering after content updates (ReactMarkdown renders first)
    useEffect(() => {
        renderMath();
    }, [content]);

    return (
        <div ref={containerRef} className={`markdown-content ${className}`}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    // Style specific elements for better UI
                    p: ({ node, ...props }) => <p className="mb-2 leading-relaxed" {...props} />,
                    ul: ({ node, ...props }) => <ul className="list-disc pl-5 mb-2 space-y-1" {...props} />,
                    ol: ({ node, ...props }) => <ol className="list-decimal pl-5 mb-2 space-y-1" {...props} />,
                    li: ({ node, ...props }) => <li className="pl-1" {...props} />,
                    strong: ({ node, ...props }) => <strong className="font-bold text-slate-800" {...props} />,
                    a: ({ node, ...props }) => <a className="text-blue-600 hover:underline" {...props} />,
                    blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-slate-200 pl-4 italic text-slate-600 my-2" {...props} />,
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
}
