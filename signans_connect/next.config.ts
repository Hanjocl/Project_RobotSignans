import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['http://localhost:8000', 'robosignans1', "0.0.0.0", ],
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'robosignans1',
        port: '8000',
        pathname: '/latest-plot*',
      },{
        protocol: 'http',
        hostname: 'robosignans1',
        port: '8000',
        pathname: '/latest-frame*',
      },{
        protocol: 'http',
        hostname: 'robosignans1',
        port: '8000',
        pathname: '/video',
      },{
        protocol: 'http',
        hostname: 'robosignans1',
        port: '8000',
        pathname: '/video_transformed',
      },
    ],
  },
};

export default nextConfig;
