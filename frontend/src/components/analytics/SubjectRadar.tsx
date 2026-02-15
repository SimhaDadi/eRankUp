'use client';

import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip, Legend } from 'recharts';

export default function SubjectRadar({ data }: { data: any[] }) {
    if (!data || data.length === 0) return <div>No data available</div>;

    return (
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Subject Mastery</h3>
            <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
                        <PolarGrid stroke="#e2e8f0" />
                        <PolarAngleAxis dataKey="category" tick={{ fill: '#64748b', fontSize: 12, fontWeight: 'bold' }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                        <Radar
                            name="You"
                            dataKey="score"
                            stroke="#4f46e5"
                            strokeWidth={3}
                            fill="#4f46e5"
                            fillOpacity={0.3}
                        />
                        <Radar
                            name="Topper Avg"
                            dataKey="topperScore"
                            stroke="#10b981"
                            strokeWidth={2}
                            fill="#10b981"
                            fillOpacity={0.1}
                            strokeDasharray="4 4"
                        />
                        <Tooltip />
                        <Legend />
                    </RadarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
