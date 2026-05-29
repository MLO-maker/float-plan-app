import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
//
// The site is served from a project page (https://mlo-maker.github.io/
// float-plan-app/) so production builds need that sub-path as the base. The
// dev server stays at the root so local development and the launch preview are
// unaffected.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/float-plan-app/' : '/',
  plugins: [react()],
}))
