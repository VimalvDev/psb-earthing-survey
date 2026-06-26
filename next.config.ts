import type { NextConfig } from "next"
import withPWA from "@ducanh2912/next-pwa"

const config = withPWA({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development",
})

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.1.9"],
  turbopack: {},
}

export default config(nextConfig)