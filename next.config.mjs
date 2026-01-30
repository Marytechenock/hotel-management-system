/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
    allowedDevOrigins: [
    'http://192.168.4.144:3000',
    'http://192.168.4.144',
    'http://localhost:3000',
  ],
}

export default nextConfig
