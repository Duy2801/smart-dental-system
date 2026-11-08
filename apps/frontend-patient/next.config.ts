import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ẩn huy hiệu dev của Next.js: nó nằm đè lên ô CAPTCHA trong WebView mobile (/captcha/mobile)
  devIndicators: false,
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
