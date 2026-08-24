/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // To run without Turbopack, use: npm run dev NODE_ENV=development
  // The actual disabling happens through environment
}

export default nextConfig