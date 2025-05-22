// vite.config.js
import { defineConfig } from 'vite'; // Import defineConfig
import react from '@vitejs/plugin-react'; // Import React plugin (assuming you use it)

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()], // Use the React plugin
  base: '/myclinic-backend/',
  build: {
    outDir: '../docs' // Changed output directory
  }
});