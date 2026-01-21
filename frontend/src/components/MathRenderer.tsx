'use client';

import { useEffect, useRef } from 'react';

declare global {
    interface Window {
        MathJax: any;
    }
}

interface MathRendererProps {
    content: string;
    className?: string;
}

export default function MathRenderer({ content, className = '' }: MathRendererProps) {
    const containerRef = useRef<HTMLDivElement>(null);

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
                svg: {
                    fontCache: 'global'
                },
                startup: {
                    pageReady: () => {
                        return window.MathJax.startup.defaultPageReady().then(() => {
                            if (containerRef.current) {
                                window.MathJax.typesetPromise([containerRef.current]);
                            }
                        });
                    }
                }
            };
        } else if (window.MathJax.typesetPromise && containerRef.current) {
            window.MathJax.typesetPromise([containerRef.current]);
        }
    }, [content]);

    return (
        <div
            ref={containerRef}
            className={className}
            dangerouslySetInnerHTML={{ __html: content }}
        />
    );
}
