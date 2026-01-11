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
    // Use custom loader to handle Unsplash and other external images
    loader: 'custom',
    loaderFile: './image-loader.js',
    
    // Keep remote patterns for security
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
        hostname: "*.unsplash.com",
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
      // Vercel deployments
      {
        protocol: "https",
        hostname: "*.vercel.app",
        pathname: "/**",
      },
    ],
    
    // Device sizes for responsive images
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    
    // Supported formats
    formats: ['image/webp', 'image/avif'],
    
    // Allow unoptimized for development
    unoptimized: process.env.NODE_ENV === 'development',
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