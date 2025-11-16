import { defineConfig } from 'vite'

export default defineConfig({
  base: '/', // Use root path for username.github.io sites
  build: {
    outDir: 'dist',
  }
})