'use client';

import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

export default function LoadingBar() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
        setIsAnimating(true);
        const timer = setTimeout(() => setIsAnimating(false), 800);
        return () => clearTimeout(timer);
    }, [pathname, searchParams]);

    return (
        <AnimatePresence>
            {isAnimating && (
                <motion.div
                    initial={{ scaleX: 0, opacity: 1, transformOrigin: 'left' }}
                    animate={{
                        scaleX: [0, 0.3, 0.7, 1],
                        opacity: [1, 1, 1, 0]
                    }}
                    transition={{
                        duration: 0.8,
                        times: [0, 0.2, 0.8, 1],
                        ease: "easeInOut"
                    }}
                    className="fixed top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-sky-400 via-indigo-500 to-purple-600 z-[9999] shadow-[0_0_10px_rgba(56,189,248,0.5)]"
                />
            )}
        </AnimatePresence>
    );
}
