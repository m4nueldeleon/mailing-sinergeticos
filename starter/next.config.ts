import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // App interna: nada de indexación (además del robots.ts y el metadata del layout).
  async headers() {
    return [{ source: "/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] }];
  },
};

export default nextConfig;
