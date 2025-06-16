import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
        pathname: '/latest-plot*',
      },{
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
        pathname: '/latest-frame*',
      },{
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
        pathname: '/video',
      },{
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
        pathname: '/video_transformed',
      },
    ],
  },
};

export default nextConfig;
