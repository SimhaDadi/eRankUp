import type { Config } from 'tailwindcss'

const config: Config = {
    content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    50: '#f5f3ff',
                    100: '#ede9fe',
                    500: '#8b5cf6', // Electric Indigo
                    600: '#7c3aed',
                    700: '#6d28d9',
                    900: '#4c1d95',
                },
                accent: {
                    cyan: '#06b6d4', // Cyber Cyan
                    neon: '#10b981', // Emerald
                },
                nebula: {
                    bg: '#020617', // Near Black/Navy
                    surface: '#0f172a',
                    border: '#1e293b',
                    glow: 'rgba(139, 92, 246, 0.3)',
                }
            },
            backgroundImage: {
                'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
                'hero-gradient': 'linear-gradient(to right bottom, #0f172a, #1e293b, #0f172a)',
            },
        },
    },
    plugins: [],
}
export default config
