// Renderização do vídeo final.
//
// Captura cada frame de index.html?render em PNG (sem perdas) com a timeline pausada e
// posicionada em n / 60 s (seek determinístico) e envia os PNGs direto ao FFmpeg: a fotografia
// passa por uma única compressão, a do vídeo final.
//
// Saídas em renders/ (<N> = duração da timeline em segundos):
//   sygtire_animacao_<N>s.mp4                          H.264 High 4:4:4, dimensões nativas do fundo
//   sygtire_animacao_<N>s_compativel_<L>x<A+1>.mp4     H.264 High 4:2:0 (só quando a altura é ímpar)
//
// H.264 4:2:0 exige largura e altura pares. Com o fundo de 1672 × 941, o arquivo nativo usa 4:4:4;
// a versão compatível acrescenta uma linha no rodapé repetindo a última linha da imagem
// (nenhum pixel da fotografia é alterado), para players e redes que não leem 4:4:4.
//
// Uso: node scripts/render.mjs [--frames renders/frames] [--crf 10] [--crf-compativel 12] [--ate N]
//   --frames  também grava cada PNG capturado;  --ate  renderiza só os N primeiros frames (teste)
import { abrirNavegador } from './navegador.mjs';
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { iniciarServidor, RAIZ } from './servidor.mjs';

const args = process.argv.slice(2);
const opcao = (nome, padrao) => { const i = args.indexOf(nome); return i >= 0 ? args[i + 1] : padrao; };
const pastaFrames = opcao('--frames', null);
const crf = opcao('--crf', '10');
const crfCompativel = opcao('--crf-compativel', '12');
const ate = opcao('--ate', null);
const pastaSaida = join(RAIZ, ate ? 'renders/teste' : 'renders');

const CORES = ['-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv'];
const ESCALA = 'scale=out_color_matrix=bt709:out_range=tv:flags=accurate_rnd+full_chroma_int';

function ffmpeg(saida, filtros, codec, fps) {
  const proc = spawn('ffmpeg', [
    '-hide_banner', '-loglevel', 'error', '-y',
    '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'png', '-i', '-',
    '-vf', filtros, ...codec, '-g', String(fps), ...CORES, '-movflags', '+faststart', '-r', String(fps), saida
  ], { stdio: ['pipe', 'inherit', 'inherit'] });
  const fim = new Promise((ok, erro) => proc.on('close', (c) => (c === 0 ? ok() : erro(new Error(`FFmpeg terminou com código ${c}: ${saida}`)))));
  return { proc, fim, saida };
}

function escrever(stream, dados) {
  return stream.write(dados) ? Promise.resolve() : new Promise((ok) => stream.once('drain', ok));
}

const { servidor, url } = await iniciarServidor();
const navegador = await abrirNavegador();
try {
  const pagina = await navegador.newPage({ viewport: { width: 1672, height: 941 }, deviceScaleFactor: 1 });
  let erroPagina = null;
  pagina.on('pageerror', (e) => { erroPagina = e; });
  await pagina.goto(`${url}/index.html?render`);
  const info = await pagina.evaluate(async () => {
    await SygTire.ready;
    const r = SygTire.render;
    return { largura: r.width, altura: r.height, fps: r.fps, total: r.totalFrames, duracao: SygTire.timeline.duration() };
  });
  if (info.largura !== 1672 || info.altura !== 941) await pagina.setViewportSize({ width: info.largura, height: info.altura });
  console.log(`Timeline de ${info.duracao.toFixed(2)} s · ${info.total} frames · ${info.fps} fps · ${info.largura} × ${info.altura}`);

  await mkdir(pastaSaida, { recursive: true });
  if (pastaFrames) await mkdir(join(RAIZ, pastaFrames), { recursive: true });

  const base = `sygtire_animacao_${Math.round(info.duracao)}s`;
  const codificadores = [ffmpeg(
    join(pastaSaida, `${base}.mp4`),
    `${ESCALA},format=yuv444p`,
    ['-c:v', 'libx264', '-preset', 'slow', '-crf', crf, '-profile:v', 'high444'],
    info.fps
  )];
  if (info.altura % 2 || info.largura % 2) {
    const L = info.largura + (info.largura % 2), A = info.altura + (info.altura % 2);
    codificadores.push(ffmpeg(
      join(pastaSaida, `${base}_compativel_${L}x${A}.mp4`),
      `pad=${L}:${A}:0:0,fillborders=right=${L - info.largura}:bottom=${A - info.altura}:mode=smear,${ESCALA},format=yuv420p`,
      ['-c:v', 'libx264', '-preset', 'slow', '-crf', crfCompativel, '-profile:v', 'high', '-level:v', '4.2'],
      info.fps
    ));
  }

  const total = ate ? Math.min(Number(ate), info.total) : info.total;
  const inicio = Date.now();
  for (let n = 0; n < total; n++) {
    await pagina.evaluate((f) => SygTire.render.frame(f), n);   // também verifica o fundo a cada frame
    if (erroPagina) throw erroPagina;
    const png = await pagina.screenshot({ type: 'png' });
    await Promise.all(codificadores.map((c) => escrever(c.proc.stdin, png)));
    if (pastaFrames) await writeFile(join(RAIZ, pastaFrames, `frame-${String(n).padStart(4, '0')}.png`), png);
    if ((n + 1) % 120 === 0) console.log(`  ${n + 1}/${total} frames · ${((Date.now() - inicio) / 1000).toFixed(0)} s`);
  }
  codificadores.forEach((c) => c.proc.stdin.end());
  await Promise.all(codificadores.map((c) => c.fim));
  codificadores.forEach((c) => console.log(`Gerado: ${c.saida}`));
} finally {
  await navegador.close();
  servidor.close();
}
