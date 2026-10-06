import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/ionicons')) return 'icons';
          if (id.includes('node_modules/@ionic') || id.includes('node_modules/@stencil'))
            return 'ionic';
          if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/'))
            return 'react';
        },
      },
    },
  },
});
