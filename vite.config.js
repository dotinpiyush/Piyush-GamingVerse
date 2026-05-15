import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Vite config yaha define hota hai.
export default defineConfig({
  // React plugin JSX aur React fast refresh ko enable karta hai.
  plugins: [react()],

  // Development server ki settings yaha rakhi gayi hain.
  server: {
    // Proxy frontend se aane wali /api requests ko backend server tak bhejta hai.
    proxy: {
      // Jo bhi request /api se start hogi, wo Express backend ko forward hogi.
      '/api': {
        // Backend API ka local URL.
        target: 'http://localhost:5000',

        // Origin change karne se backend ko request same source jaisi milti hai.
        changeOrigin: true
      }
    }
  }
});
