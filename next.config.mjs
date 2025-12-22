/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost', 'ykz.tw1.ru', 'www.ykz.tw1.ru'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ykz.tw1.ru',
      },
      {
        protocol: 'https',
        hostname: 'www.ykz.tw1.ru',
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  // Для production с Docker - всегда standalone для Docker
  output: 'standalone',
}

export default nextConfig
