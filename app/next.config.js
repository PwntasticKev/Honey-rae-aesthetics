/** @type {import('next').NextConfig} */
const nextConfig = {
  // Add serverExternalPackages to the top level
  serverExternalPackages: ["mysql2", "drizzle-orm"],

  // Environment-specific configuration
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },

  // Security headers for production
  async headers() {
    const isDevelopment = process.env.NODE_ENV === "development";

    if (isDevelopment) {
      return [];
    }

    return [
      {
        // Apply to all routes
        source: "/(.*)",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "origin-when-cross-origin",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://accounts.google.com https://apis.google.com https://www.google-analytics.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: https: blob:",
              "connect-src 'self' https://api.stripe.com https://accounts.google.com https://www.googleapis.com https://vitals.vercel-insights.com",
              "frame-src 'self' https://accounts.google.com https://js.stripe.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
            ].join("; "),
          },
        ],
      },
    ];
  },

  // Redirects for production
  async redirects() {
    return [
      {
        source: "/admin",
        destination: "/login",
        permanent: false,
      },
    ];
  },

  // Image optimization
  images: {
    domains: [
      "localhost",
      process.env.DOMAIN || "your-domain.com",
      "your-s3-bucket.s3.amazonaws.com",
      "lh3.googleusercontent.com", // Google profile images
    ],
    formats: ["image/webp", "image/avif"],
  },

  // Performance optimizations
  compress: true,

  // Output configuration for deployment
  output: process.env.NODE_ENV === "production" ? "standalone" : undefined,

  // Disable source maps in production for security
  productionBrowserSourceMaps: false,

  // Power up with React strict mode
  reactStrictMode: true,

  // ESLint configuration
  eslint: {
    ignoreDuringBuilds: process.env.NODE_ENV === "production",
  },

  // TypeScript configuration
  typescript: {
    ignoreBuildErrors: process.env.NODE_ENV === "production",
  },

  // Force dynamic rendering for debug pages to avoid SSR issues
  async rewrites() {
    return [];
  },
};

module.exports = nextConfig; 