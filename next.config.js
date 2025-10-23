/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Enable SWC minification for faster builds
  swcMinify: true,
  // Optimize images
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200],
  },
  // Performance optimizations
  compress: true,
  poweredByHeader: false,
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
    serverComponentsExternalPackages: ['@node-rs/argon2'],
    // Optimize route loading
    optimizeCss: true,
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Don't bundle native modules in client code
      config.resolve.fallback = {
        ...config.resolve.fallback,
        '@node-rs/argon2': false,
      }
    }

    // Externalize native modules on server
    config.externals = config.externals || []
    config.externals.push({
      '@node-rs/argon2': 'commonjs @node-rs/argon2',
    })

    return config
  },
}

module.exports = nextConfig
