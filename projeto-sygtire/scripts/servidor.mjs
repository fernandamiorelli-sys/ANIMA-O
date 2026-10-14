// Servidor estático mínimo (sem dependências) para a pré-visualização, a renderização e a validação.
// Uso direto: node scripts/servidor.mjs [porta]  →  http://127.0.0.1:<porta>/index.html
import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

export const RAIZ = resolve(fileURLToPath(new URL('..', import.meta.url)));

const TIPOS = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.woff2': 'font/woff2',
  '.mp4': 'video/mp4', '.md': 'text/markdown; charset=utf-8', '.txt': 'text/plain; charset=utf-8'
};

export function iniciarServidor(porta = 0) {
  const servidor = http.createServer(async (req, res) => {
    try {
      const caminho = decodeURIComponent(new URL(req.url, 'http://local').pathname);
      let arquivo = normalize(join(RAIZ, caminho));
      if (arquivo !== RAIZ && !arquivo.startsWith(RAIZ + sep)) { res.writeHead(403).end(); return; }
      if ((await stat(arquivo)).isDirectory()) arquivo = join(arquivo, 'index.html');
      const corpo = await readFile(arquivo);
      res.writeHead(200, {
        'Content-Type': TIPOS[extname(arquivo).toLowerCase()] || 'application/octet-stream',
        'Cache-Control': 'no-store'
      });
      res.end(corpo);
    } catch {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Não encontrado');
    }
  });
  return new Promise((ok) => servidor.listen(porta, '127.0.0.1', () => {
    ok({ servidor, url: `http://127.0.0.1:${servidor.address().port}` });
  }));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { url } = await iniciarServidor(Number(process.argv[2]) || 8080);
  console.log(`Pré-visualização: ${url}/index.html   (Ctrl+C para encerrar)`);
}
