import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      /** Trình duyệt vẫn hay gọi /favicon.ico trước; tránh 404 sau khi xóa favicon.ico mặc định Vercel */
      { source: "/favicon.ico", destination: "/icon.png", permanent: false },
    ];
  },
};

export default nextConfig;
