/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    images: {
        domains: ['i.pravatar.cc'],
    },
    async rewrites() {
        // const backendUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        const backendUrl = 'http://127.0.0.1:3001';
        return [
            {
                source: '/api/:path*',
                destination: `${backendUrl}/:path*`, // Proxy to Backend with path
            },
        ]
    },
};

export default nextConfig;
