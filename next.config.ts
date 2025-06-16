import type {NextConfig} from 'next';
import path from 'path';
import CopyPlugin from 'copy-webpack-plugin';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Setting an alias for pdfjs-dist
    config.resolve.alias['pdfjs-dist'] = path.join(__dirname, 'node_modules/pdfjs-dist');
    
    // Copy the pdf.worker.min.js to the static directory
    if (!isServer) {
      config.plugins = config.plugins || [];
      config.plugins.push(
        new CopyPlugin({
          patterns: [
            {
              from: path.join(__dirname, 'node_modules/pdfjs-dist/build/pdf.worker.min.mjs'),
              to: path.join(__dirname, 'public/static'),
            },
            {
              from: path.join(__dirname, 'node_modules/pdfjs-dist/build/pdf.worker.min.mjs.map'),
              to: path.join(__dirname, 'public/static'),
            },
          ],
        })
      );
    }
    
    return config;
  },
};

export default nextConfig;
