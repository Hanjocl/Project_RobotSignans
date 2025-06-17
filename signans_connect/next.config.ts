import type { NextConfig } from "next";
import { ROBO } from "@/context/WebSockets";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['http://localhost:8000',  "0.0.0.0", "192.168.178.22", ROBO ],
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: ROBO,
        port: '8000',
        pathname: '/latest-plot*',
      },{
        protocol: 'http',
        hostname: ROBO,
        port: '8000',
        pathname: '/latest-frame*',
      },{
        protocol: 'http',
        hostname: ROBO,
        port: '8000',
        pathname: '/video',
      },{
        protocol: 'http',
        hostname: ROBO,
        port: '8000',
        pathname: '/video_transformed',
      },
    ],
  },
};

export default nextConfig;
