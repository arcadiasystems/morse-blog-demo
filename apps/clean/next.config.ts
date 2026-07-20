import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@morse/shared",
    "@mysten/dapp-kit",
    "@mysten/sui",
    "@mysten/walrus",
    "@mysten/seal",
    "@arcadiasystems/morse-sdk",
  ],
};

export default nextConfig;
