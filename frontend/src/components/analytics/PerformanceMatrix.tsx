'use client';

import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, Cell, Legend } from 'recharts';

export default function PerformanceMatrix({ data }: { data: any[] }) {
    if (!data || data.length === 0) return <div>No data available</div>;

    const COLORS = {
        'Mastered': '#22c55e', // Green
        'Building Strength': '#3b82f6', // Blue
        'Needs Focus': '#f59e0b', // Amber
        'Careless/Guessing': '#ef4444' // Red
    };

    return (
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Speed vs. Accuracy Matrix</h3>
            <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                        <XAxis
                            type="number"
                            dataKey="speed"
                            name="Avg Time (s)"
                            unit="s"
                            label={{ value: 'Time Taken (Lower is Faster)', position: 'bottom', offset: 0 }}
                            reversed // Lower time is better/faster
                        />
                        <YAxis
                            type="number"
                            dataKey="accuracy"
                            name="Accuracy"
                            unit="%"
                            domain={[0, 100]}
                            label={{ value: 'Accuracy', angle: -90, position: 'insideLeft' }}
                        />
                        <ZAxis type="number" dataKey="total" range={[100, 500]} name="Questions" />
                        <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                        <Legend />
                        <Scatter name="Topics" data={data} fill="#8884d8">
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={(COLORS as any)[entry.quadrant] || '#8884d8'} />
                            ))}
                        </Scatter>
                    </ScatterChart>
                </ResponsiveContainer>
            </div>
            <div className="mt-4 flex flex-wrap gap-4 text-xs font-bold text-slate-500 justify-center">
                {Object.entries(COLORS).map(([label, color]) => (
                    <div key={label} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                        {label}
                    </div>
                ))}
            </div>
        </div>
    );
}
