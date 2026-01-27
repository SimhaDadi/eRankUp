'use client';

export default function DashboardSkeleton() {
    return (
        <div className="space-y-4 pb-12 max-w-7xl mx-auto animate-pulse">
            {/* Welcome Section Skeleton */}
            <div className="h-64 bg-slate-200 rounded-[2rem] border border-slate-100 mb-6"></div>

            {/* Stats Cards Skeleton */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-32 bg-slate-200 rounded-2xl border border-slate-100"></div>
                ))}
            </div>

            {/* Main Content Section Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left side skeleton */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="h-10 bg-slate-200 rounded-xl w-48 mb-4"></div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="h-48 bg-slate-200 rounded-3xl border border-slate-100"></div>
                        ))}
                    </div>
                </div>

                {/* Right side skeleton */}
                <div className="space-y-6">
                    <div className="h-10 bg-slate-200 rounded-xl w-48 mb-4"></div>
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-32 bg-slate-200 rounded-2xl border border-slate-100"></div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
