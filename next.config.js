/** @type {import('next').NextConfig} */
const nextConfig = {
  // Listing thumbnails come from whichever retailer the AI found, so the host
  // can't be enumerated ahead of time. Product images are rendered with a plain
  // <img> (not next/image), so this only applies if that ever changes.
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
  // `ignoreDuringBuilds: true` was hiding lint errors from `npm run build`.
  // Lint problems should fail the build rather than ship.
  eslint: {
    dirs: ["app", "components", "lib", "types"],
  },
};

module.exports = nextConfig;
