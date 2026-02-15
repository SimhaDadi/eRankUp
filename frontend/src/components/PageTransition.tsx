'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';

export default function PageTransition({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    return (
        <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
                key={pathname}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{
                    duration: 0.3,
                    ease: [0.22, 1, 0.36, 1], // Custom Quintic ease-out for a softer feel
                }}
                className="w-full"
            >
                {children}
            </motion.div>
        </AnimatePresence>
    );
}
