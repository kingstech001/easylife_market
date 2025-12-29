let userConfig = undefined;

try {
  // Try to import ESM config first
  userConfig = await import("./v0-user-next.config.mjs");
} catch (e) {
  try {
    // Fallback to CommonJS config
    userConfig = await import("./v0-user-next.config");
  } catch (innerError) {
    // Ignore if no user config exists
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    webpackBuildWorker: true,
    parallelServerBuildTraces: true,
    parallelServerCompiles: true,
    // turbo: false,

    // ❌ Removed because it only works on Next.js canary
    // nodeMiddleware: true,
  },
};

if (userConfig) {
  // Handle both ESM default exports and CJS
  const config = userConfig.default || userConfig;

  for (const key in config) {
    if (
      typeof nextConfig[key] === "object" &&
      !Array.isArray(nextConfig[key])
    ) {
      nextConfig[key] = {
        ...nextConfig[key],
        ...config[key],
      };
    } else {
      nextConfig[key] = config[key];
    }
  }
}

export default nextConfig;
