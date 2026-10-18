import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@mysten/dapp-kit-core",
    "@mysten/dapp-kit-react",
    "@mysten/sui",
    "@mysten/walrus",
    "@mysten/seal",
    "@arcadiasystems/morse-sdk",
  ],
};

export default nextConfig;
