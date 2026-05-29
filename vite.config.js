import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
//
// Served from the root of a custom domain (https://overdueboat.com/), so the
// base is "/". (When this was hosted on the github.io project page it needed
// the "/float-plan-app/" sub-path instead.)
export default defineConfig({
  base: '/',
  plugins: [react()],
})
