/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
  },
  async rewrites() {
    return [
      // Go backend — 知识图谱 (暂时禁用)
      // { source: '/api/pathway', destination: 'http://127.0.0.1:8080/api/pathway' },
      // { source: '/api/nodes', destination: 'http://127.0.0.1:8080/api/nodes' },
      // { source: '/api/lineages', destination: 'http://127.0.0.1:8080/api/lineages' },

      // Python backend — 主应用 (profile / tasks / group / stats)
      // 注意：排除已有 Next.js Route Handler 的路径（nav / concept / content）
      {
        source: '/api/:path((?!nav|concept|content).*)',
        destination: 'http://127.0.0.1:8000/api/:path*',
      },
    ]
  },
}

module.exports = nextConfig
