/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    images: {
        domains: ['i.pravatar.cc'],
    },
    // Transpile these packages to fix build issues
    transpilePackages: ['recharts', 'recharts-scale', 'd3-scale', 'd3-shape', 'd3-interpolate', 'd3-color', 'd3-format', 'd3-time', 'd3-time-format'],
    // Webpack configuration for handling ESM modules
    experimental: {
        esmExternals: 'loose',
    },
    async rewrites() {
        const backendUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        return [
            {
                source: '/api/:path*',
                destination: `${backendUrl}/:path*`, // Proxy to Backend with path
            },
        ]
    },
    // Webpack config to handle recharts properly
    webpack: (config, { isServer }) => {
        if (!isServer) {
            config.resolve.fallback = {
                ...config.resolve.fallback,
                fs: false,
            };
        }
        // Handle ESM packages
        config.resolve.alias = {
            ...config.resolve.alias,
        };
        return config;
    },
};

export default nextConfig;
