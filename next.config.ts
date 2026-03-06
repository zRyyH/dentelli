import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "pbdentelli.awpsoft.com.br",
        pathname: "/api/files/**",
      },
    ],
  },
};

export default nextConfig;
