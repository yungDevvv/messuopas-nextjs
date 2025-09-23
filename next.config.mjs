/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb', // Increase body size limit to 10MB
    },
  },
};

export default nextConfig;
