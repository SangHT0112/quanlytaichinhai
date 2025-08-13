import type { NextConfig } from "next";

const nextConfig: NextConfig = {
 images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/dvvsfnmys/**", // Thay 'dvvsfnmys' bằng cloud name của bạn
      },
    ],
  },
};

export default nextConfig;
