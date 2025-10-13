/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
    serverComponentsExternalPackages: ['@node-rs/argon2'],
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
