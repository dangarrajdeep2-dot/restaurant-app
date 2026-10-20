import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

/**
 * In-memory local network synchronization plugin
 * Enables real-time sync between mobile phones, tablets, and PC laptops on the same Wi-Fi
 */
function lanSyncPlugin(): Plugin {
  const store: Record<string, unknown> = {};

  return {
    name: 'lan-sync-plugin',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === '/api/sync' && req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(store));
          return;
        }
        if (req.url === '/api/sync' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });
          req.on('end', () => {
            try {
              const data = JSON.parse(body || '{}');
              Object.assign(store, data, { _updatedAt: Date.now() });
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ ok: true, _updatedAt: store._updatedAt }));
            } catch {
              res.statusCode = 400;
              res.end('{"error":"Invalid payload"}');
            }
          });
          return;
        }
        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), lanSyncPlugin()],
  resolve: {
    alias: {
      '@': new URL('./src', import.meta.url).pathname,
    },
  },
  build: {
    chunkSizeWarningLimit: 1500,
  },
  server: {
    host: true, // Listen on all network interfaces (0.0.0.0)
    port: 5173,
  },
});
