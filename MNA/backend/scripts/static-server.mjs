/* Minimal static file server for local integration testing.
 * Usage: node scripts/static-server.mjs <root-dir> <port>
 */
import http from 'http'
import { readFile } from 'fs/promises'
import { existsSync, statSync } from 'fs'
import path from 'path'

const root = path.resolve(process.argv[2] || '.')
const port = Number(process.argv[3] || 5190)

const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
  '.ico': 'image/x-icon',
  '.mp4': 'video/mp4',
}

http
  .createServer(async (req, res) => {
    try {
      let urlPath = decodeURIComponent((req.url || '/').split('?')[0])
      if (urlPath.endsWith('/')) urlPath += 'index.html'
      const filePath = path.join(root, urlPath)
      if (!filePath.startsWith(root)) {
        res.writeHead(403)
        res.end('Forbidden')
        return
      }
      if (!existsSync(filePath) || statSync(filePath).isDirectory()) {
        res.writeHead(404)
        res.end('Not found')
        return
      }
      const data = await readFile(filePath)
      res.writeHead(200, { 'Content-Type': types[path.extname(filePath).toLowerCase()] || 'application/octet-stream' })
      res.end(data)
    } catch (e) {
      res.writeHead(500)
      res.end(String(e))
    }
  })
  .listen(port, () => console.log(`static server on http://localhost:${port} root=${root}`))
