import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'
import { handleAiProxyRequest } from './server/apiProxy.ts'

function aiProxyPlugin(): Plugin {
  return {
    name: 'neon-ai-proxy',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url?.split('?')[0] || ''
        if (url.startsWith('/api/ai')) {
          try {
            await handleAiProxyRequest(req, res, url, __dirname)
          } catch (err) {
            console.error('[AI Proxy Error]', err)
            res.statusCode = 500
            res.end(JSON.stringify({ error: String(err) }))
          }
          return
        }
        next()
      })
    },
    configurePreviewServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url?.split('?')[0] || ''
        if (url.startsWith('/api/ai')) {
          try {
            await handleAiProxyRequest(req, res, url, __dirname)
          } catch (err) {
            res.statusCode = 500
            res.end(JSON.stringify({ error: String(err) }))
          }
          return
        }
        next()
      })
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [react(), aiProxyPlugin()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: true
  },
  preview: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: true
  }
})

