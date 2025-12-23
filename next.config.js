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
  // Принудительное обновление кеша для статических файлов
  generateBuildId: async () => {
    return `build-${Date.now()}`
  },
  // Отключаем кеширование статических файлов в production
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
  // Заголовки для отключения кеша в браузере
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig

