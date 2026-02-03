import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  define: {
    'process.env': {} // Bu satır "process is not defined" hatasını kökten çözer
  },
  build: {
    outDir: 'build'
  }
})