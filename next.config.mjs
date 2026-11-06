/** @type {import('next').NextConfig} */
const nextConfig = {
  // Self-contained server build used by the Dockerfile.
  output: "standalone",
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**.public.blob.vercel-storage.com" }],
  },
};
export default nextConfig;
