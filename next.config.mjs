import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  // NOTE: Do NOT use output: 'standalone' on Vercel — Vercel uses its own
  // serverless deployment system and standalone mode breaks API routes.
  images: {
    unoptimized: true,
  },
  turbopack: {
    root: rootDir,
  },
  experimental: {
    webpackBuildWorker: true,
    parallelServerBuildTraces: true,
    parallelServerCompiles: true,
  },
  // Allow Agora RTC/RTM WebSocket connections to edge servers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "connect-src 'self' wss://*.agora.io wss://*.sd-rtn.com https://*.agora.io https://*.sd-rtn.com https://*.agora.io:* wss://*.agora.io:* wss://*.sd-rtn.com:* https://api.agora.io",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "media-src 'self' blob:",
              "worker-src 'self' blob:",
              "img-src 'self' data: blob:",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
