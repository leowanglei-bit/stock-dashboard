import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// 如果部署到 GitHub Pages 的自定义域名或根域名，base 设为 '/'
// 如果部署到 username.github.io/repo-name，base 设为 '/repo-name/'
export default defineConfig({
  plugins: [react()],
  base: './',
})
