import { existsSync } from "fs";
import { pathToFileURL } from "url";

/** @type {import('next').NextConfig} */
let userConfig = {};

// Safely load optional user config
try {
  if (existsSync("./v0-user-next.config.mjs")) {
    const mod = await import(
      pathToFileURL("./v0-user-next.config.mjs").href
    );
    userConfig = mod.default || mod;
  } else if (existsSync("./v0-user-next.config.js")) {
    const mod = await import(
      pathToFileURL("./v0-user-next.config.js").href
    );
    userConfig = mod.default || mod;
  }
} catch (err) {
  console.warn("⚠️ Failed to load user Next config:", err.message);
}

const nextConfig = {
  images: {
    unoptimized: true,
  },

  experimental: {
    // These are VALID in Next 16+
    webpackBuildWorker: true,
    parallelServerBuildTraces: true,
    parallelServerCompiles: true,
  },
};

// Merge user config safely
for (const key in userConfig) {
  const base = nextConfig[key];
  const override = userConfig[key];

  if (
    typeof base === "object" &&
    base !== null &&
    !Array.isArray(base)
  ) {
    nextConfig[key] = {
      ...base,
      ...override,
    };
  } else {
    nextConfig[key] = override;
  }
}

export default nextConfig;
