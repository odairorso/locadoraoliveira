import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
// import { cloudflare } from "@cloudflare/vite-plugin";
// import { mochaPlugins } from "@getmocha/vite-plugins";

export default defineConfig(() => {
  return {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  plugins: [/*...mochaPlugins(process.env as any),*/ react()/*, cloudflare()*/],
  server: {
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        configure: (proxy) => {
          // Fallback para servir arquivos .mjs como APIs
          proxy.on('error', (err) => {
            console.log('proxy error', err);
          });
        }
      }
    }
  },
  build: {
    chunkSizeWarningLimit: 5000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  envDir: '.',
  envPrefix: ['VITE_'],
  };
});
