import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

export default defineConfig({
  plugins: [
    react(),
    {
      // Some browsers still request `/favicon.ico` even if we provide an inline SVG icon.
      // Responding with 204 avoids noisy 404s during development.
      name: 'dev-favicon-204',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url === '/favicon.ico') {
            res.statusCode = 204;
            res.end();
            return;
          }
          next();
        });
      }
    }
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true
      }
    }
  }
});
