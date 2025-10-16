// vite.config.js
import { defineConfig } from 'vite'
import laravel from 'laravel-vite-plugin'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    laravel({
      input: ['resources/css/app.css', 'resources/js/app.js'],
      refresh: true,
    }),
    tailwindcss(),
  ],

  // Para desenvolvimento (vite dev) — opcional
  server: {
    host: true,        // 0.0.0.0
    port: 5173,
    strictPort: true,
    allowedHosts: ['crm.fernandokerber.com'], // libere seu domínio
  },

  // Para produção com `vite preview` (o teu caso atrás do Traefik)
  preview: {
    host: true,        // 0.0.0.0
    port: 4173,
    strictPort: true,
    allowedHosts: ['crm.fernandokerber.com'], // libere seu domínio
    // Se preferir liberar geral: allowedHosts: 'all'
  },
})
