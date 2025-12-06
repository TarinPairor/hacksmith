import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync } from 'fs'
import { join } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Custom plugin to serve log file
    {
      name: 'log-file-server',
      configureServer(server) {
        server.middlewares.use('/api/logs', (req, res, next) => {
          try {
            const logPath = join(__dirname, '../backend-demo/proxy-access.log')
            const logContent = readFileSync(logPath, 'utf-8')
            res.setHeader('Content-Type', 'text/plain')
            res.end(logContent)
          } catch (error) {
            res.statusCode = 404
            res.end('Log file not found')
          }
        })
      }
    }
  ],
})
