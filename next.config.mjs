import { existsSync } from "fs";
import { pathToFileURL } from "url";

/** @type {import('next').NextConfig} */
let userConfig = {};

try {
  if (existsSync("./v0-user-next.config.mjs")) {
    const mod = await import(pathToFileURL("./v0-user-next.config.mjs").href);
    userConfig = mod.default || mod;
  } else if (existsSync("./v0-user-next.config.js")) {
    const mod = await import(pathToFileURL("./v0-user-next.config.js").href);
    userConfig = mod.default || mod;
  }
} catch (err) {
  console.warn("⚠️ Failed to load user Next config:", err.message);
}

const nextConfig = {
  images: {
    remotePatterns: [
      // Unsplash - Multiple domains
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "source.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "plus.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.unsplash.com", // Wildcard for all Unsplash subdomains
        pathname: "/**",
      },
      // Instagram
      {
        protocol: "https",
        hostname: "*.cdninstagram.com",
        pathname: "/**",
      },
      // Cloudinary
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
      // Add your domain if using local uploads
      {
        protocol: "https",
        hostname: "*.vercel.app",
        pathname: "/**",
      },
    ],
    // Increase the allowed image sizes
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Add formats
    formats: ['image/webp', 'image/avif'],
  },

  experimental: {
    webpackBuildWorker: true,
    parallelServerBuildTraces: true,
    parallelServerCompiles: true,
  },
};

// Merge user config safely
for (const key in userConfig) {
  const base = nextConfig[key];
  const override = userConfig[key];

  if (typeof base === "object" && base !== null && !Array.isArray(base)) {
    nextConfig[key] = { ...base, ...override };
  } else {
    nextConfig[key] = override;
  }
}

export default nextConfig;