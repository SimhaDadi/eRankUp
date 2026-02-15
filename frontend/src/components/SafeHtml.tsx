'use client';

import React, { useMemo } from 'react';
import DOMPurify from 'dompurify';

interface SafeHtmlProps {
    html: string;
    className?: string;
}

export const SafeHtml: React.FC<SafeHtmlProps> = ({ html, className = '' }) => {
    const sanitizedHtml = useMemo(() => {
        // Only run on client-side
        if (typeof window === 'undefined') return '';

        return DOMPurify.sanitize(html, {
            ALLOWED_TAGS: [
                'p', 'b', 'i', 'em', 'strong', 'a', 'ul', 'ol', 'li', 'br', 'hr',
                'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span', 'div', 'blockquote',
                'img', 'table', 'thead', 'tbody', 'tr', 'th', 'td'
            ],
            ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'target', 'rel']
        });
    }, [html]);

    return (
        <div
            className={className}
            dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
        />
    );
};
