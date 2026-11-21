/** @type {import('next').NextConfig} */
const nextConfig = {
  // Export estático: gera `out/` com HTML/JS/CSS puros — o Coolify serve como site estático (Nginx/serve).
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
};
export default nextConfig;
