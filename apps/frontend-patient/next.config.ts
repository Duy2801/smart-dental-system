import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ẩn huy hiệu dev của Next.js: nó nằm đè lên ô CAPTCHA trong WebView mobile (/captcha/mobile)
  devIndicators: false,
  // Trang đăng nhập đã chuyển từ /auth/login sang /login; giữ link cũ còn chạy
  async redirects() {
    return [{ source: "/auth/login", destination: "/login", permanent: true }];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
};

export default nextConfig;
