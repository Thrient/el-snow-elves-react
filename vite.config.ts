import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import UnoCSS from 'unocss/vite';


const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    UnoCSS(),
    react()
  ],
  resolve: {
    alias: [
      // map imports starting with "@/" to the src directory
      {find: /^@\//, replacement: resolve(__dirname, 'src') + '/'},
      // optional: allow plain "@" to resolve to src
      {find: '@', replacement: resolve(__dirname, 'src')}
    ]
  }
})
