'use client';

import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, Cell } from 'recharts';

export default function PerformanceMatrix({ data }: { data: any[] }) {
    if (!data || data.length === 0) return <div>No data available</div>;

    const COLORS: Record<string, string> = {
        'Mastered': '#22c55e',
        'Building Strength': '#3b82f6',
        'Needs Focus': '#f59e0b',
        'Careless/Guessing': '#ef4444'
    };

    return (
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Speed vs. Accuracy Matrix</h3>
            <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 10, right: 20, bottom: 40, left: 20 }}>
                        <XAxis
                            type="number"
                            dataKey="speed"
                            name="Avg Time (s)"
                            unit="s"
                            reversed
                            label={{ value: 'Time Taken (Lower is Faster)', position: 'insideBottom', offset: -15, style: { fontSize: 11, fill: '#64748b' } }}
                            tick={{ fontSize: 11 }}
                        />
                        <YAxis
                            type="number"
                            dataKey="accuracy"
                            name="Accuracy"
                            unit="%"
                            domain={[0, 100]}
                            label={{ value: 'Accuracy', angle: -90, position: 'insideLeft', style: { fontSize: 11, fill: '#64748b' } }}
                            tick={{ fontSize: 11 }}
                        />
                        <ZAxis type="number" dataKey="total" range={[80, 400]} name="Questions" />
                        <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                        <Scatter name="Topics" data={data} fill="#8884d8">
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[entry.quadrant] || '#8884d8'} />
                            ))}
                        </Scatter>
                    </ScatterChart>
                </ResponsiveContainer>
            </div>
            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-xs font-bold text-slate-500 justify-center">
                {Object.entries(COLORS).map(([label, color]) => (
                    <div key={label} className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                        <span>{label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
