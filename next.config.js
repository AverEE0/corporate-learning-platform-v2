/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone', // Важно для Docker
  images: {
    domains: ['localhost', '212.113.123.94', 'ykz.tw1.ru', 'www.ykz.tw1.ru'],
    unoptimized: false,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '500mb',
    },
    middlewareClientMaxBodySize: '500mb',
  },
}

module.exports = nextConfig

