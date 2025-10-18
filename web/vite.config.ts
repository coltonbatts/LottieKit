import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import fs from 'node:fs/promises';

const templatesDir = path.resolve(__dirname, '../templates');

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'serve-parent-templates',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (!req.url) return next();
          if (req.url.startsWith('/templates/')) {
            const rel = req.url.replace('/templates/', '');
            const file = path.join(templatesDir, rel);
            try {
              const txt = await fs.readFile(file, 'utf8');
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.end(txt);
              return;
            } catch (e) {
              res.statusCode = 404;
              res.end('Not found');
              return;
            }
          }
          next();
        });
      }
    }
  ],
  resolve: {
    alias: {
      '@core': path.resolve(__dirname, '../packages/core/dist')
    }
  },
  server: {
    fs: {
      allow: [templatesDir, path.resolve(__dirname, '..')]
    }
  }
});
