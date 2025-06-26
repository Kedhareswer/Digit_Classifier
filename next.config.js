/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['raw.githubusercontent.com'],
  },
  async rewrites() {
    return [
      {
        source: '/api/predict/:path*',
        destination: process.env.BACKEND_URL ? `${process.env.BACKEND_URL}/predict/:path*` : 'http://localhost:8000/predict/:path*',
      },
    ];
  },
};

module.exports = nextConfig; 