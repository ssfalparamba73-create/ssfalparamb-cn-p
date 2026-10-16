import type { NextConfig } from "next";

function supabaseImagePattern(): URL[] {
  const rawUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!rawUrl) return [];
  try {
    return [new URL("/storage/v1/object/public/**", rawUrl)];
  } catch {
    return [];
  }
}

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: supabaseImagePattern(),
  },
  allowedDevOrigins: ['127.0.0.1', 'localhost', 'http://127.0.0.1:3000'],
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'no-referrer' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
      {
        source: '/sw.js',
        headers: [
          { key: 'Content-Type', value: 'application/javascript; charset=utf-8' },
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
    ];
  },
};

export default nextConfig;
