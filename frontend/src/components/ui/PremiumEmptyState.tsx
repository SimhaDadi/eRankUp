import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface PremiumEmptyStateProps {
    icon: LucideIcon;
    title: string;
    description: string;
    colorScheme?: 'red' | 'blue' | 'amber' | 'emerald' | 'purple' | 'sky';
    actionLabel?: string;
    onAction?: () => void;
}

export default function PremiumEmptyState({
    icon: Icon,
    title,
    description,
    colorScheme = 'blue',
    actionLabel,
    onAction
}: PremiumEmptyStateProps) {
    const colors = {
        red: {
            border: 'border-red-100',
            iconBg: 'bg-red-50',
            iconColor: 'text-red-500',
            button: 'bg-red-600 hover:bg-red-700 shadow-red-500/20',
            gradient: 'from-red-500/5 to-orange-500/5',
            ring: 'ring-red-50'
        },
        blue: {
            border: 'border-blue-100',
            iconBg: 'bg-blue-50',
            iconColor: 'text-blue-500',
            button: 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20',
            gradient: 'from-blue-500/5 to-indigo-500/5',
            ring: 'ring-blue-50'
        },
        amber: {
            border: 'border-amber-100',
            iconBg: 'bg-amber-50',
            iconColor: 'text-amber-500',
            button: 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20',
            gradient: 'from-amber-500/5 to-orange-500/5',
            ring: 'ring-amber-50'
        },
        emerald: {
            border: 'border-emerald-100',
            iconBg: 'bg-emerald-50',
            iconColor: 'text-emerald-500',
            button: 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20',
            gradient: 'from-emerald-500/5 to-teal-500/5',
            ring: 'ring-emerald-50'
        },
        sky: {
            border: 'border-sky-100',
            iconBg: 'bg-sky-50',
            iconColor: 'text-sky-500',
            button: 'bg-sky-600 hover:bg-sky-700 shadow-sky-500/20',
            gradient: 'from-sky-500/5 to-cyan-500/5',
            ring: 'ring-sky-50'
        },
        purple: {
            border: 'border-purple-100',
            iconBg: 'bg-purple-50',
            iconColor: 'text-purple-500',
            button: 'bg-purple-600 hover:bg-purple-700 shadow-purple-500/20',
            gradient: 'from-purple-500/5 to-pink-500/5',
            ring: 'ring-purple-50'
        }
    };

    const c = colors[colorScheme];

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", duration: 0.6 }}
            className={`relative overflow-hidden rounded-[3rem] border ${c.border} bg-white/60 backdrop-blur-xl p-16 text-center shadow-2xl shadow-slate-200/50 col-span-full`}
        >
            {/* Background Gradients/Shapes */}
            <div className={`absolute inset-0 bg-gradient-to-br ${c.gradient} opacity-100`} />

            {/* Floating Blobs */}
            <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-current opacity-[0.03] rounded-full blur-3xl animate-pulse" style={{ color: c.iconColor }} />
            <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-64 h-64 bg-current opacity-[0.03] rounded-full blur-3xl animate-pulse" style={{ color: c.iconColor }} />

            <div className="relative z-10 flex flex-col items-center max-w-lg mx-auto">
                {/* Animated Icon Container */}
                <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                    className={`mb-8 flex h-28 w-28 items-center justify-center rounded-[2rem] ${c.iconBg} shadow-sm border border-white ring-8 ring-white/60`}
                >
                    <Icon className={`h-12 w-12 ${c.iconColor}`} strokeWidth={1.5} />
                </motion.div>

                <h3 className="mb-4 text-3xl font-black uppercase tracking-tight text-slate-800">
                    {title}
                </h3>

                <p className="mb-8 text-lg font-medium leading-relaxed text-slate-500">
                    {description}
                </p>

                {onAction && (
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onAction}
                        className={`rounded-2xl px-10 py-4 text-xs font-black uppercase tracking-[0.2em] text-white shadow-xl transition-all ${c.button}`}
                    >
                        {actionLabel}
                    </motion.button>
                )}
            </div>
        </motion.div>
    );
}
