  // frontend/vite.config.ts
  import { defineConfig } from "vite";
  import react from "@vitejs/plugin-react";
  import path from "path";

  export default defineConfig({
    plugins: [react()],
    resolve: {
      alias: { "@": path.resolve(__dirname, "./src") },
    },
    server: {
      host: "0.0.0.0",
      port: 5174,
      proxy: {
        '/api': {
          target: 'http://nginx:80',
          changeOrigin: true,
          secure: false,
          // This ensures /api/auth/login goes to http://localhost:3000/api/auth/login
        },
      },
    },
  });