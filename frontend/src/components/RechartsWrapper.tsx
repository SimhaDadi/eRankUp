'use client';

import dynamic from 'next/dynamic';
import { ComponentType } from 'react';

// Dynamically import recharts components with SSR disabled
const RechartsLib = dynamic(
    () => import('recharts').then((mod) => mod as any),
    { ssr: false }
);

// Re-export all components
export const LineChart = dynamic(
    () => import('recharts').then((mod) => mod.LineChart as ComponentType<any>),
    { ssr: false }
);

export const Line = dynamic(
    () => import('recharts').then((mod) => mod.Line as ComponentType<any>),
    { ssr: false }
);

export const BarChart = dynamic(
    () => import('recharts').then((mod) => mod.BarChart as ComponentType<any>),
    { ssr: false }
);

export const Bar = dynamic(
    () => import('recharts').then((mod) => mod.Bar as ComponentType<any>),
    { ssr: false }
);

export const XAxis = dynamic(
    () => import('recharts').then((mod) => mod.XAxis as ComponentType<any>),
    { ssr: false }
);

export const YAxis = dynamic(
    () => import('recharts').then((mod) => mod.YAxis as ComponentType<any>),
    { ssr: false }
);

export const CartesianGrid = dynamic(
    () => import('recharts').then((mod) => mod.CartesianGrid as ComponentType<any>),
    { ssr: false }
);

export const Tooltip = dynamic(
    () => import('recharts').then((mod) => mod.Tooltip as ComponentType<any>),
    { ssr: false }
);

export const Legend = dynamic(
    () => import('recharts').then((mod) => mod.Legend as ComponentType<any>),
    { ssr: false }
);

export const ResponsiveContainer = dynamic(
    () => import('recharts').then((mod) => mod.ResponsiveContainer as ComponentType<any>),
    { ssr: false }
);

export const AreaChart = dynamic(
    () => import('recharts').then((mod) => mod.AreaChart as ComponentType<any>),
    { ssr: false }
);

export const Area = dynamic(
    () => import('recharts').then((mod) => mod.Area as ComponentType<any>),
    { ssr: false }
);

export const PieChart = dynamic(
    () => import('recharts').then((mod) => mod.PieChart as ComponentType<any>),
    { ssr: false }
);

export const Pie = dynamic(
    () => import('recharts').then((mod) => mod.Pie as ComponentType<any>),
    { ssr: false }
);

export const Cell = dynamic(
    () => import('recharts').then((mod) => mod.Cell as ComponentType<any>),
    { ssr: false }
);
