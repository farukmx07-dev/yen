import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === "production";

function resolveAppUrlFromEnv() {
  for (const key of [
    "NEXT_PUBLIC_APP_URL",
    "NEXT_PUBLIC_SITE_URL",
    "NEXT_SERVER_APP_URL",
    "SITE_URL",
    "SERVICE_URL",
  ]) {
    const value = process.env[key]?.trim();
    if (value) return value.replace(/\/$/, "");
  }
  return undefined;
}

function appUsesHttps() {
  const url = resolveAppUrlFromEnv();
  if (!url) return false;
  try {
    return new URL(url).protocol === "https:";
  } catch {
    return false;
  }
}

const securityHeaders = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

if (isProd && appUsesHttps()) {
  securityHeaders.push({
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains",
  });
}

const nextConfig = {
  output: "standalone",
  reactStrictMode: true,
  compress: true,
  poweredByHeader: false,
  generateEtags: true,
  swcMinify: true,
  images: {
    unoptimized: process.env.NEXT_IMAGE_UNOPTIMIZED === "1",
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      { protocol: "https", hostname: "i.ibb.co", pathname: "/**" },
      { protocol: "https", hostname: "ibb.co", pathname: "/**" },
      { protocol: "https", hostname: "i.imgbb.com", pathname: "/**" },
      { protocol: "https", hostname: "imgbb.com", pathname: "/**" },
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
    ],
  },
  compiler: {
    removeConsole:
      process.env.NODE_ENV === "production"
        ? { exclude: ["error", "warn"] }
        : false,
  },
  experimental: {
    outputFileTracingRoot: __dirname,
    instrumentationHook: true,
    outputFileTracingIncludes: {
      "/*": [
        "./server.js",
        "./lib/ws/**/*",
        "./scripts/server-guards.js",
        "./scripts/admin-live-sync.js",
        "./scripts/log-cleanup-scheduler.js",
        "./scripts/find-available-port.js",
        "./scripts/wait-for-mysql.js",
        "./scripts/migrate-json-to-mysql.js",
        "./scripts/copy-runtime-deps.js",
        "./node_modules/ws/**/*",
        "./node_modules/mysql2/**/*",
        "./node_modules/sql-escaper/**/*",
        "./node_modules/aws-ssl-profiles/**/*",
        "./node_modules/iconv-lite/**/*",
        "./node_modules/long/**/*",
        "./node_modules/lru.min/**/*",
        "./node_modules/named-placeholders/**/*",
        "./node_modules/denque/**/*",
        "./node_modules/generate-function/**/*",
        "./node_modules/is-property/**/*",
        "./node_modules/safer-buffer/**/*",
      ],
    },
  },
  async redirects() {
    return [];
  },
  async headers() {
    const rules = [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];

    if (isProd) {
      rules.push({
        source: "/((?!api|_next|favicon\\.ico|.*\\..*).*)",
        headers: [
          {
            key: "Cache-Control",
            value: "private, no-cache, no-store, max-age=0, must-revalidate",
          },
        ],
      });
    }

    return rules;
  },
  webpack(config, { dev }) {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@": path.join(__dirname),
    };

    if (dev) {
      config.watchOptions = {
        ...config.watchOptions,
        ignored:
          /[\\/](pagefile\.sys|swapfile\.sys|hiberfil\.sys|DumpStack\.log\.tmp)$|[\\/]node_modules[\\/]|[\\/]\.git[\\/]|[\\/]\.next[\\/]/i,
      };
    }

    return config;
  },
};

export default nextConfig;
