import type { NextConfig } from 'next'

// GitHub Pages serves this repo at /<repo-name>/ unless it's a user site or has a custom domain.
// The deploy workflow passes the right value from actions/configure-pages.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? ''

const nextConfig: NextConfig = {
  output: 'export',
  basePath,
  images: { unoptimized: true },
  trailingSlash: true,
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
}

export default nextConfig
