import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // read-excel-file runs only on the server, inside the API routes.
  serverExternalPackages: ["read-excel-file"],
};

export default nextConfig;
