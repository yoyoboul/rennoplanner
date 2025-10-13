import type { NextConfig } from "next";
import path from "path";

const isMobileBuild = process.env.MOBILE_BUILD === 'true';

const nextConfig: NextConfig = {
  // Isoler le projet du workspace parent
  outputFileTracingRoot: path.join(__dirname),
  experimental: {
    externalDir: false,
  },
  // Optimisations
  reactStrictMode: true,
  // Configuration des images
  images: {
    domains: [],
    formats: ['image/avif', 'image/webp'],
    unoptimized: true, // Nécessaire pour export statique
  },
  // Pour Capacitor : export statique quand MOBILE_BUILD=true
  ...(isMobileBuild && {
    output: 'export',
    distDir: 'out',
    // Désactiver les features non compatibles avec l'export statique
    trailingSlash: true,
    // eslint doit être ignoré en mode mobile build
    eslint: {
      ignoreDuringBuilds: true,
    },
    typescript: {
      ignoreBuildErrors: true,
    },
  }),
  // Headers pour améliorer les performances (seulement en mode non-export)
  ...(!isMobileBuild && {
    async headers() {
      return [
        {
          source: '/:path*',
          headers: [
            {
              key: 'X-DNS-Prefetch-Control',
              value: 'on'
            },
            {
              key: 'X-Frame-Options',
              value: 'SAMEORIGIN'
            },
          ],
        },
      ];
    },
  }),
};

export default nextConfig;
