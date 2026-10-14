// Validação final do projeto. Gera renders/validacao/ (relatório HTML + JSON + screenshots).
//
//  1. Auditoria dos SVGs das cenas: nenhum raster, textos editáveis, ids pedidos presentes.
//  2. Estrutura em execução: uma única <image> (a fotografia), camada inferior, sem transformações.
//  3. Tempos: cada animação conferida contra as janelas do roteiro, nas sete cenas.
//  4. Todos os frames: onde nenhuma camada de cena pinta, o frame é idêntico à fotografia
//     original pixel a pixel; os logotipos nunca são cobertos; cortes de cena limpos.
//  5. Seek determinístico: todos os frames recapturados em ordem inversa, numa página nova,
//     são idênticos aos da passagem sequencial.
//  6. Fundo isolado nos tempos de teste: sem as cenas, o quadro é igual ao fundo-original.png.
//  7. Vídeos MP4 em renders/: formato, codec, frames e fidelidade aos frames renderizados (PSNR).
//
// Uso: node scripts/validar.mjs
import { abrirNavegador } from './navegador.mjs';
import { PNG } from 'pngjs';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { iniciarServidor, RAIZ } from './servidor.mjs';

const SAIDA = join(RAIZ, 'renders', 'validacao');
// Tempos de teste (um durante a entrada de cada cena) e quadros de composição completa de cada cena.
const TEMPOS = [0, 1.2, 5.8, 10.6, 15.0, 18.8, 23.2, 26.5, 29.9];
const COMPOSICOES = [[1, 2.70], [2, 8.05], [3, 764 / 60], [4, 16.50], [5, 20.75], [6, 25.05], [7, 29.90]];
// Quadros de composição completa da versão de 20 s: os elementos precisam continuar idênticos.
const REFERENCIA_ANTERIOR = join(RAIZ, 'renders', 'backup-20s', 'composicoes');
// A mensagem final precisa ficar completa e parada por pelo menos este tempo.
const ENCERRAMENTO_MINIMO = 2.3;
// Área dos logotipos na fotografia (medida em fundo-original.png, sem folga).
const LOGOS = [{ nome: 'iSat', x: 62, y: 801, w: 111, h: 64 }, { nome: 'SygTire', x: 1440, y: 40, w: 179, h: 82 }];

// Janelas do roteiro (tempos locais da cena). Cada animação encontrada precisa caber na janela.
const ROTEIRO = {
  1: [['s1-titulo-linha-1', 'entrada', 0, 0.55], ['s1-titulo-sublinhado', 'entrada', 0, 0.55],
      ['s1-card-1', 'entrada', 0.55, 1.05], ['s1-card-2', 'entrada', 1.05, 1.55], ['s1-card-3', 'entrada', 1.55, 2.05],
      ['s1-card-3', 'saida', 3.35, 4.00], ['s1-titulo-linha-1', 'saida', 3.35, 4.00]],
  2: [['s2-titulo-linha-1', 'entrada', 0, 0.50], ['s2-celular', 'entrada', 0.35, 1.00], ['s2-cabecalho', 'entrada', 1.00, 1.45],
      ['s2-identificacao', 'entrada', 1.00, 1.45], ['s2-campo-sulco', 'entrada', 1.45, 2.75], ['s2-campo-pressao', 'entrada', 1.45, 2.75],
      ['s2-campo-hodometro', 'entrada', 1.45, 2.75], ['s2-botao-salvar', 'entrada', 2.75, 3.20], ['s2-botao-salvar', 'pulso', 2.75, 3.20],
      ['s2-confirmacao', 'entrada', 3.25, 3.71], ['s2-confirmacao-check', 'traco', 3.25, 3.71],
      ['s2-celular', 'saida', 4.40, 5.00], ['s2-titulo-linha-3', 'saida', 4.40, 5.00]],
  3: [['s3-titulo-linha-1', 'entrada', 0, 0.50], ['s3-painel', 'entrada', 0.35, 0.95], ['s3-alerta-1', 'entrada', 0.95, 1.50],
      ['s3-alerta-2', 'entrada', 1.50, 2.05], ['s3-alerta-3', 'entrada', 2.05, 2.60], ['s3-alerta-4', 'entrada', 2.60, 3.15],
      ['s3-alerta-4-prioridade', 'entrada', 2.60, 3.15], ['s3-alerta-1-prioridade', 'pulso', 3.12, 3.75],
      ['s3-alerta-4', 'saida', 3.75, 4.50], ['s3-alerta-1', 'saida', 3.75, 4.50], ['s3-painel', 'saida', 3.75, 4.50], ['s3-titulo-linha-1', 'saida', 3.75, 4.50]],
  4: [['s4-titulo-linha-1', 'entrada', 0, 0.40], ['s4-diagrama', 'entrada', 0.30, 0.85], ['s4-destaque-2E', 'entrada', 0.85, 1.25],
      ['s4-movimento-linha', 'traco', 1.25, 1.95], ['s4-destaque-3D', 'entrada', 1.95, 2.40], ['s4-confirmacao', 'entrada', 1.95, 2.40],
      ['s4-historico', 'entrada', 2.40, 2.75], ['s4-diagrama', 'saida', 3.20, 3.50], ['s4-historico', 'saida', 3.20, 3.50]],
  5: [['s5-titulo-linha-1', 'entrada', 0, 0.50], ['card-cpk', 'entrada', 0.40, 1.00], ['card-sucateamento', 'entrada', 0.40, 1.00],
      ['linha-grafico', 'traco', 1.00, 2.10], ['s5-ponto-final-anel', 'entrada', 2.10, 2.48], ['rect@barra-recapabilidade', 'barra', 2.45, 3.05],
      ['rect@barra-sucateamento', 'barra', 3.05, 3.50], ['painel-cpk', 'saida', 4.00, 4.50], ['s5-titulo-linha-1', 'saida', 4.00, 4.50]],
  6: [['s6-titulo-linha-1', 'entrada', 0, 0.45], ['card-sagi', 'entrada', 0.40, 0.85], ['card-isat', 'entrada', 0.75, 1.20],
      ['card-sygtire', 'entrada', 1.10, 1.60], ['conexao-sagi', 'traco', 1.60, 2.20], ['conexao-isat', 'traco', 1.60, 2.20],
      ['fluxo-sagi', 'percurso', 2.20, 3.05], ['fluxo-isat', 'percurso', 2.20, 3.05], ['s6-sincronizacao', 'entrada', 3.05, 3.55],
      ['card-sygtire', 'pulso', 3.05, 3.55], ['card-sygtire', 'saida', 3.55, 4.00], ['s6-titulo-linha-1', 'saida', 3.55, 4.00]],
  7: [['s7-mascara-01-cortina', 'mascara', 0, 0.60], ['s7-mascara-02-cortina', 'mascara', 0.50, 1.10],
      ['s7-assinatura-linha-1', 'entrada', 1.05, 1.55], ['s7-assinatura-linha-3', 'entrada', 1.05, 1.55],
      ['selo-final', 'entrada', 1.50, 1.85], ['s7-detalhe-linha', 'entrada', 1.85, 2.15]]
};

const IDS_PEDIDOS = {
  5: ['titulo-cpk', 'painel-cpk', 'card-cpk', 'texto-cpk', 'linha-grafico', 'ponto-final', 'card-recapabilidade',
      'barra-recapabilidade', 'card-sucateamento', 'barra-sucateamento'],
  6: ['titulo-integracao', 'card-sagi', 'card-isat', 'card-sygtire', 'conexao-sagi', 'conexao-isat', 'fluxo-sagi', 'fluxo-isat'],
  7: ['titulo-final-01', 'titulo-final-02', 'assinatura-final', 'selo-final', 'detalhes-final']
};

const r2 = (v) => Math.round(v * 100) / 100;
const hash = (buf) => createHash('md5').update(buf).digest('hex');
const nomeTempo = (t) => `tempo-${t.toFixed(2).padStart(5, '0')}s.png`;

async function main() {
  await mkdir(SAIDA, { recursive: true });
  const original = PNG.sync.read(await readFile(join(RAIZ, 'assets', 'fundo-original.png')));
  const W = original.width, H = original.height, O = original.data;
  const resultado = { data: new Date().toISOString(), dimensoes: [W, H] };

  const { servidor, url } = await iniciarServidor();
  const navegador = await abrirNavegador();
  const contexto = await navegador.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  try {
    const erros = [];
    const abrir = async () => {
      const p = await contexto.newPage();
      p.on('pageerror', (e) => erros.push(e.message));
      p.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') erros.push(m.text()); });
      await p.goto(`${url}/index.html?render`);
      await p.evaluate(() => SygTire.ready);
      return p;
    };

    // Página A: vídeo como é renderizado. Página B: somente as camadas de cena, sem a fotografia.
    const A = await abrir();
    const B = await abrir();
    await B.evaluate(() => {
      document.getElementById('background-fixed').remove();
      document.documentElement.style.background = 'transparent';
      document.body.style.background = 'transparent';
    });

    // 1. Auditoria dos SVGs ------------------------------------------------------------------
    resultado.svg = await A.evaluate(async (ids) => {
      const tipos = ['g', 'text', 'tspan', 'path', 'rect', 'circle', 'ellipse', 'line', 'polyline', 'polygon', 'mask', 'clipPath', 'linearGradient', 'filter'];
      const out = [];
      for (const s of SygTire.SCENES) {
        const fonte = await (await fetch(s.art, { cache: 'no-store' })).text();
        const doc = new DOMParser().parseFromString(fonte, 'image/svg+xml');
        const grupo = doc.getElementById(s.id);
        const contagem = Object.fromEntries(tipos.map((t) => [t, grupo.getElementsByTagName(t).length]));
        const textos = [...grupo.getElementsByTagName('text')];
        const raster = [];
        if (/<image\b/i.test(fonte)) raster.push('<image>');
        if (/<foreignObject\b/i.test(fonte)) raster.push('<foreignObject>');
        if (/data:image\//i.test(fonte)) raster.push('data:image');
        if (/href\s*=\s*"[^"]+\.(png|jpe?g|webp|gif|bmp)"/i.test(fonte)) raster.push('referência a raster');
        const faltando = (ids[s.number] || []).filter((id) => !doc.getElementById(id));
        out.push({
          cena: s.number, titulo: s.title, arquivo: s.art, contagem, raster, faltando,
          textosVazios: textos.filter((t) => !t.textContent.trim()).length,
          amostraTextos: textos.slice(0, 4).map((t) => t.textContent.trim().replace(/\s+/g, ' ')),
          naRaiz: [...doc.documentElement.children].map((e) => e.tagName + (e.id ? '#' + e.id : ''))
        });
      }
      return out;
    }, IDS_PEDIDOS);

    // 2. Estrutura em execução ----------------------------------------------------------------
    resultado.estrutura = await A.evaluate(() => {
      const svg = document.getElementById('sygtire-master');
      const bg = document.getElementById('background-fixed');
      return {
        imagensNoSvg: svg.querySelectorAll('image').length,
        imagensNaPagina: document.querySelectorAll('image, img').length,
        fundoPrimeiraCamada: svg.firstElementChild === bg,
        fundoAtributos: Object.fromEntries([...bg.attributes].map((a) => [a.name, a.value])),
        tweensNoFundo: gsap.getTweensOf(bg).length + gsap.getTweensOf(svg).length,
        problemasGuardiao: SygTire.assertBackgroundIntact(false),
        gruposDeCena: SygTire.SCENES.map((s) => ({ id: s.id, recorte: document.getElementById(s.id).getAttribute('clip-path'), elementos: document.getElementById(s.id).querySelectorAll('*').length })),
        duracao: SygTire.timeline.duration(),
        rotulos: SygTire.timeline.labels
      };
    });

    // 3. Tempos ------------------------------------------------------------------------------
    resultado.tempos = await A.evaluate((roteiro) => {
      const filhos = SygTire.timeline.getChildren(false, false, true);
      return SygTire.SCENES.map((cena, i) => {
        const tl = filhos[i];
        // O master reserva o intervalo de cada cena com um set() vazio em {}: não é animação.
        const tweens = tl.getChildren(true, true, false).filter((tw) => tw.targets().some((t) => t instanceof Element)).map((tw) => {
          const v = tw.vars;
          const ids = tw.targets().map((t) => t.id || (t.parentNode && t.parentNode.id ? 'rect@' + t.parentNode.id : '?'));
          let tipo = 'outro';
          if (v.motionPath) tipo = 'percurso';
          else if ('strokeDashoffset' in v) tipo = 'traco';
          else if (v.attr && 'width' in v.attr) tipo = 'barra';
          else if (v.repeat > 0) tipo = 'pulso';
          else if (v.autoAlpha === 0 || v.opacity === 0) tipo = 'saida';
          else if (ids.some((id) => /mascara/.test(id))) tipo = 'mascara';
          else if (v.startAt) tipo = 'entrada';
          const inicio = tw.startTime() + (tw.parent !== tl ? tw.parent.startTime() : 0);
          return { ids, tipo, inicio: +inicio.toFixed(4), fim: +(inicio + tw.totalDuration()).toFixed(4) };
        });
        const intervalo = +(cena.end - cena.start).toFixed(4);
        const conferencias = (roteiro[cena.number] || []).map(([id, tipo, a, z]) => {
          const c = tweens.filter((t) => t.tipo === tipo && t.ids.includes(id));
          const tw = tipo === 'saida' ? c[c.length - 1] : c[0];
          if (!tw) return { id, tipo, janela: [a, z], ok: false, real: null };
          return { id, tipo, janela: [a, z], real: [tw.inicio, tw.fim], ok: tw.inicio >= a - 1e-3 && tw.fim <= z + 1e-3 };
        });
        const ultimo = Math.max(...tweens.map((t) => t.fim));
        const fimEntradas = Math.max(...tweens.filter((t) => ['entrada', 'traco', 'barra', 'percurso', 'mascara'].includes(t.tipo)).map((t) => t.fim));
        // Saídas de destaques transitórios (anel do botão, halo, pontos de fluxo) acontecem antes da
        // composição completa; a permanência vai do fim das entradas até a primeira saída depois dele.
        const inicioSaidas = Math.min(intervalo, ...tweens.filter((t) => t.tipo === 'saida' && t.inicio >= fimEntradas - 1e-6).map((t) => t.inicio));
        return {
          composicaoCompleta: [+fimEntradas.toFixed(3), +inicioSaidas.toFixed(3)], permanencia: +(inicioSaidas - fimEntradas).toFixed(3),
          cena: cena.number, titulo: cena.title, inicio: cena.start, fim: cena.end, intervalo,
          duracaoTimeline: +tl.duration().toFixed(4), posicaoNoMaster: +tl.startTime().toFixed(4),
          ultimaAnimacao: +ultimo.toFixed(4), cabeNoIntervalo: ultimo <= intervalo + 1e-6,
          animacoes: tweens.length, saidas: tweens.filter((t) => t.tipo === 'saida').length, conferencias
        };
      });
    }, ROTEIRO);

    // 4. Todos os frames ----------------------------------------------------------------------
    const total = await A.evaluate(() => SygTire.render.totalFrames);
    const inicioCena = await A.evaluate(() => SygTire.SCENES.map((s) => Math.round(s.start * SygTire.FPS)));
    const guardar = new Map(TEMPOS.map((t) => [Math.round(t * 60), nomeTempo(t)]));
    COMPOSICOES.forEach(([n, t]) => guardar.set(Math.round(t * 60), guardar.get(Math.round(t * 60)) || `cena-0${n}-composicao.png`));
    const nomesComposicao = Object.fromEntries(COMPOSICOES.map(([n, t]) => [n, guardar.get(Math.round(t * 60))]));
    // Pixel com alfa 0 na camada de cena isolada e diferente do original. A camada isolada tem 8 bits
    // de alfa: bordas antialiasadas e caudas de sombras/desfoques com opacidade abaixo de 1/255 somem
    // nela, mas ainda arredondam 1 nível ao compor sobre a foto. Esses casos (no máximo 1 nível e a até
    // RAIO_BORDA px de um pixel pintado) são registrados à parte; qualquer outro conta como alteração.
    const RAIO_BORDA = 8;
    const frames = { total, descobertoDiferente: 0, descobertoMaxDif: 0, framesComDiferenca: 0, bordaArredondamento: 0, bordaDistanciaMax: 0,
      raioBorda: RAIO_BORDA, alteracoesFotografia: 0, logosCobertos: 0, logosDiferentes: 0, cobertura: [], hashes: {} };
    const distanciaAtePintado = (b, x, y) => {
      for (let r = 1; r <= RAIO_BORDA; r++) {
        for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
          const xx = x + dx, yy = y + dy;
          if (xx >= 0 && yy >= 0 && xx < W && yy < H && b[(yy * W + xx) * 4 + 3]) return r;
        }
      }
      return Infinity;
    };
    const t0 = Date.now();
    for (let n = 0; n < total; n++) {
      await A.evaluate((f) => SygTire.render.frame(f), n);
      await B.evaluate((f) => { SygTire.seekFrame(f); SygTire.render.relayout(); }, n);
      const bufA = await A.screenshot({ type: 'png' });
      const bufB = await B.screenshot({ type: 'png', omitBackground: true });
      const a = PNG.sync.read(bufA).data, b = PNG.sync.read(bufB).data;
      let difs = 0, cobertos = 0;
      for (let i = 0; i < a.length; i += 4) {
        if (b[i + 3] === 0) {
          const d = Math.max(Math.abs(a[i] - O[i]), Math.abs(a[i + 1] - O[i + 1]), Math.abs(a[i + 2] - O[i + 2]));
          if (d) {
            difs++; if (d > frames.descobertoMaxDif) frames.descobertoMaxDif = d;
            const p = i / 4;
            const dist = d <= 1 ? distanciaAtePintado(b, p % W, (p / W) | 0) : Infinity;
            if (dist <= RAIO_BORDA) { frames.bordaArredondamento++; frames.bordaDistanciaMax = Math.max(frames.bordaDistanciaMax, dist); }
            else frames.alteracoesFotografia++;
          }
        } else cobertos++;
      }
      for (const z of LOGOS) for (let y = z.y; y < z.y + z.h; y++) for (let x = z.x; x < z.x + z.w; x++) {
        const i = (y * W + x) * 4;
        if (b[i + 3]) frames.logosCobertos++;
        if (a[i] !== O[i] || a[i + 1] !== O[i + 1] || a[i + 2] !== O[i + 2]) frames.logosDiferentes++;
      }
      frames.descobertoDiferente += difs;
      if (difs) frames.framesComDiferenca++;
      frames.cobertura.push(cobertos);
      frames.hashes[n] = hash(bufA);
      if (guardar.has(n)) await writeFile(join(SAIDA, guardar.get(n)), bufA);
      if ((n + 1) % 120 === 0) console.log(`  frames ${n + 1}/${total} · ${((Date.now() - t0) / 1000).toFixed(0)} s`);
    }
    frames.cortesDeCena = inicioCena.map((f) => ({ frame: f, tempo: r2(f / 60), pixelsDeCena: frames.cobertura[f] }));
    const ultimaCena = resultado.tempos[resultado.tempos.length - 1];
    const fimEstatico = Math.ceil((ultimaCena.inicio + ultimaCena.ultimaAnimacao) * 60 - 1e-6);
    frames.encerramentoParado = { de: fimEstatico, ate: total - 1, segundos: r2((total - fimEstatico) / 60),
      imagensDistintas: new Set(Object.entries(frames.hashes).filter(([k]) => +k >= fimEstatico).map(([, h]) => h)).size };
    // Frames sem nenhum pixel de cena: só são aceitos no início de cada cena, por até CORTE_MAXIMO
    // frames (0,1 s), o tempo de um corte; fora disso seria um intervalo vazio.
    const CORTE_MAXIMO = 6;
    const vazios = frames.cobertura.map((c, i) => (c === 0 ? i : -1)).filter((i) => i >= 0);
    frames.framesVazios = {
      total: vazios.length, corteMaximo: CORTE_MAXIMO,
      porCena: inicioCena.map((f0) => vazios.filter((i) => i >= f0 && i < f0 + CORTE_MAXIMO).length),
      foraDosCortes: vazios.filter((i) => !inicioCena.some((f0) => i >= f0 && i < f0 + CORTE_MAXIMO))
    };

    // 5. Seek determinístico: todos os frames de novo, em ordem inversa, numa página nova -------------
    const C = await abrir();
    const divergentes = [];
    for (let n = total - 1; n >= 0; n--) {
      await C.evaluate((f) => SygTire.render.frame(f), n);
      if (hash(await C.screenshot({ type: 'png' })) !== frames.hashes[n]) divergentes.push(n);
    }
    frames.determinismo = { ordem: 'inversa', frames: total, todosIguais: !divergentes.length, divergentes };

    // 6. Fundo isolado nos tempos de teste --------------------------------------------------------
    frames.fundoIsolado = [];
    for (const t of TEMPOS) {
      const n = Math.round(t * 60);
      await A.evaluate((f) => SygTire.render.frame(f), n);
      await A.evaluate(() => SygTire.SCENES.forEach((s) => { document.getElementById(s.id).style.visibility = 'hidden'; }));
      const img = PNG.sync.read(await A.screenshot({ type: 'png' })).data;
      let d = 0; for (let i = 0; i < img.length; i += 4) if (img[i] !== O[i] || img[i + 1] !== O[i + 1] || img[i + 2] !== O[i + 2]) d++;
      frames.fundoIsolado.push({ tempo: t, frame: n, pixelsDiferentes: d });
    }
    await A.evaluate(() => SygTire.render.frame(0));
    delete frames.hashes;
    resultado.frames = frames;
    resultado.errosNoNavegador = erros;

    // 7. Vídeos -----------------------------------------------------------------------------------
    resultado.videos = [];
    const arquivos = (await readdir(join(RAIZ, 'renders'))).filter((f) => f.endsWith('.mp4')).sort();
    for (const nome of arquivos) {
      const caminho = join(RAIZ, 'renders', nome);
      const sonda = JSON.parse(spawnSync('ffprobe', ['-v', 'error', '-count_frames', '-show_entries',
        'stream=codec_name,profile,width,height,pix_fmt,r_frame_rate,nb_read_frames,color_space:format=duration,size,bit_rate',
        '-of', 'json', caminho], { encoding: 'utf8' }).stdout);
      const st = sonda.streams[0];
      const indices = TEMPOS.map((t) => Math.round(t * 60));
      const dec = spawnSync('ffmpeg', ['-v', 'error', '-i', caminho, '-vf',
        `select='${indices.map((i) => `eq(n\\,${i})`).join('+')}',scale=in_color_matrix=bt709:in_range=tv:flags=accurate_rnd+full_chroma_int,format=rgb24`,
        '-fps_mode', 'passthrough', '-f', 'rawvideo', '-'], { maxBuffer: 1 << 30 });
      const tam = st.width * st.height * 3;
      const qualidade = [];
      for (let k = 0; k < indices.length; k++) {
        const ref = PNG.sync.read(await readFile(join(SAIDA, nomeTempo(TEMPOS[k])))).data;
        const v = dec.stdout.subarray(k * tam, (k + 1) * tam);
        let se = 0, seFoto = 0, nFoto = 0, max = 0;
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
          const i = (y * W + x) * 4, j = (y * st.width + x) * 3;
          for (let c = 0; c < 3; c++) {
            const d = v[j + c] - ref[i + c]; se += d * d; if (x >= 640) { seFoto += d * d; nFoto++; }
            if (Math.abs(d) > max) max = Math.abs(d);
          }
        }
        const psnr = (s, n) => r2(10 * Math.log10((255 * 255) / (s / n)));
        qualidade.push({ tempo: TEMPOS[k], psnr: psnr(se, W * H * 3), psnrFotografia: psnr(seFoto, nFoto), erroMaximo: max });
      }
      resultado.videos.push({
        arquivo: nome, codec: st.codec_name, perfil: st.profile, largura: st.width, altura: st.height, pixfmt: st.pix_fmt,
        fps: st.r_frame_rate, frames: +st.nb_read_frames, duracao: +sonda.format.duration, megabytes: r2(+sonda.format.size / 1048576),
        qualidade, psnrMedio: r2(qualidade.reduce((s, q) => s + q.psnr, 0) / qualidade.length)
      });
    }

    resultado.composicoes = nomesComposicao;
    resultado.identidade = [];
    for (const [n] of COMPOSICOES) {
      const anterior = join(REFERENCIA_ANTERIOR, `cena-0${n}.png`);
      let ref; try { ref = PNG.sync.read(await readFile(anterior)).data; } catch { continue; }
      const atual = PNG.sync.read(await readFile(join(SAIDA, nomesComposicao[n]))).data;
      let dif = 0, max = 0;
      for (let i = 0; i < atual.length; i += 4) {
        const d = Math.max(Math.abs(atual[i] - ref[i]), Math.abs(atual[i + 1] - ref[i + 1]), Math.abs(atual[i + 2] - ref[i + 2]));
        if (d) { dif++; if (d > max) max = d; }
      }
      resultado.identidade.push({ cena: n, pixelsDiferentes: dif, diferencaMaxima: max });
    }
    resultado.duracaoEsperada = await A.evaluate(() => SygTire.DURATION);
    resultado.aprovado = avaliar(resultado);
    await writeFile(join(SAIDA, 'relatorio.json'), JSON.stringify(resultado, null, 2));
    await writeFile(join(SAIDA, 'index.html'), relatorio(resultado));
    console.log(resultado.aprovado.every((a) => a.ok) ? 'VALIDAÇÃO APROVADA' : 'VALIDAÇÃO COM FALHAS');
    resultado.aprovado.forEach((a) => console.log(`  ${a.ok ? '✓' : '✗'} ${a.item}`));
  } finally {
    await navegador.close();
    servidor.close();
  }
}

function avaliar(r) {
  const f = r.frames;
  const lista = [
    ['SVGs sem nenhum raster (image, foreignObject, data:image)', r.svg.every((s) => !s.raster.length)],
    ['Todos os textos são <text> editáveis e não vazios', r.svg.every((s) => s.contagem.text > 0 && !s.textosVazios)],
    ['Ids pedidos no roteiro presentes (cenas 05–07)', r.svg.every((s) => !s.faltando.length)],
    ['Uma única <image> na página: a fotografia, na camada inferior', r.estrutura.imagensNaPagina === 1 && r.estrutura.fundoPrimeiraCamada],
    ['Nenhum tween GSAP no fundo ou no SVG principal; guardião sem problemas', r.estrutura.tweensNoFundo === 0 && !r.estrutura.problemasGuardiao.length],
    [`Timeline com ${r.duracaoEsperada.toFixed(2).replace('.', ',')} s e cada cena no seu intervalo`, Math.abs(r.estrutura.duracao - r.duracaoEsperada) < 1e-6 && r.tempos.every((t) => t.cabeNoIntervalo && Math.abs(t.duracaoTimeline - t.intervalo) < 1e-6)],
    ['Animações dentro das janelas do roteiro', r.tempos.every((t) => t.conferencias.every((c) => c.ok))],
    ['Encerramento sem saída e parado até o último frame', r.tempos[6].saidas === 0 && f.encerramentoParado.imagensDistintas === 1],
    [`Mensagem final completa e visível por pelo menos ${ENCERRAMENTO_MINIMO.toString().replace('.', ',')} s (${f.encerramentoParado.segundos.toFixed(2).replace('.', ',')} s)`, f.encerramentoParado.segundos >= ENCERRAMENTO_MINIMO - 1e-6],
    ['Elementos idênticos à versão anterior (composição completa das sete cenas)', r.identidade.length === 7 && r.identidade.every((x) => x.pixelsDiferentes === 0)],
    [`Sem intervalos vazios (no máximo ${f.framesVazios.corteMaximo} frames sem elementos no início de cada cena)`, f.framesVazios.foraDosCortes.length === 0],
    [`Fotografia intacta em todos os ${f.total} frames onde nenhuma cena pinta`, f.alteracoesFotografia === 0],
    ['Logotipos nunca cobertos nem alterados', f.logosCobertos === 0 && f.logosDiferentes === 0],
    ['Cortes de cena limpos (nenhum pixel de cena no primeiro frame de cada cena)', f.cortesDeCena.every((c) => c.pixelsDeCena === 0)],
    [`Seek determinístico (os ${f.total} frames idênticos também em ordem inversa)`, f.determinismo.todosIguais],
    ['Fundo isolado idêntico ao fundo-original.png nos tempos de teste', f.fundoIsolado.every((x) => x.pixelsDiferentes === 0)],
    ['Sem erros no navegador', !r.errosNoNavegador.length]
  ];
  for (const v of r.videos) {
    lista.push([`${v.arquivo}: H.264, 60 fps, ${f.total} frames, ${r.duracaoEsperada.toFixed(2).replace('.', ',')} s`, v.codec === 'h264' && v.fps === '60/1' && v.frames === f.total && Math.abs(v.duracao - r.duracaoEsperada) < 0.02]);
  }
  return lista.map(([item, ok]) => ({ item, ok: !!ok }));
}

function relatorio(r) {
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const fmt = (v) => (v === null || v === undefined ? '…' : Number(v).toFixed(2).replace('.', ','));
  const cenaEm = (t) => (r.tempos.find((x) => t < x.fim) || r.tempos[r.tempos.length - 1]).cena;
  const titulos = Object.fromEntries(r.tempos.map((t) => [t.cena, t.titulo]));
  const ok = (b) => `<span class="${b ? 'ok' : 'falha'}">${b ? '✓' : '✗'}</span>`;
  const comparar = (cena, img, legenda) => `
      <figure class="trio">
        <div><img loading="lazy" src="../../assets/referencias/cena-0${cena}-referencia.webp" alt="Referência da cena ${cena}"><figcaption>Referência · cena 0${cena}</figcaption></div>
        <div><img loading="lazy" src="${img}" alt="${esc(legenda)}"><figcaption>${esc(legenda)}</figcaption></div>
        <div class="sobreposto"><img loading="lazy" src="../../assets/referencias/cena-0${cena}-referencia.webp" alt=""><img loading="lazy" src="${img}" alt=""><figcaption>Sobreposição 50%</figcaption></div>
      </figure>`;
  return `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Validação SygTire</title>
<style>
  :root { --bg: #f6f7f9; --card: #fff; --line: #e3e7ed; --text: #18202e; --muted: #5d6676; --ok: #1f8a3b; --falha: #c62828; --accent: #0b5ed7; }
  * { box-sizing: border-box; }
  body { margin: 0; background: var(--bg); color: var(--text); font: 15px/1.5 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
  main { max-width: 1280px; margin: 0 auto; padding: 24px 16px 64px; }
  h1 { font-size: 24px; margin: 0 0 4px; } h2 { font-size: 18px; margin: 36px 0 12px; } h3 { font-size: 15px; margin: 20px 0 8px; }
  p.sub { color: var(--muted); margin: 0 0 20px; }
  .card { background: var(--card); border: 1px solid var(--line); border-radius: 10px; padding: 16px; overflow-x: auto; }
  table { border-collapse: collapse; width: 100%; font-size: 13.5px; font-variant-numeric: tabular-nums; }
  th, td { text-align: left; padding: 6px 10px; border-bottom: 1px solid var(--line); vertical-align: top; }
  th { color: var(--muted); font-weight: 600; }
  .ok { color: var(--ok); font-weight: 700; } .falha { color: var(--falha); font-weight: 700; }
  ul.checks { list-style: none; padding: 0; margin: 0; columns: 2 420px; } ul.checks li { padding: 3px 0; break-inside: avoid; }
  figure.trio { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin: 0 0 18px; }
  figure.trio img { width: 100%; display: block; border-radius: 6px; border: 1px solid var(--line); }
  figure.trio figcaption { font-size: 12.5px; color: var(--muted); margin-top: 4px; }
  .sobreposto { display: grid; } .sobreposto img { grid-area: 1 / 1; } .sobreposto img + img { opacity: .5; }
  .sobreposto figcaption { grid-area: 2 / 1; }
  code { font-size: 12.5px; }
  @media (max-width: 760px) { figure.trio { grid-template-columns: 1fr; } }
</style></head><body><main>
<h1>Validação final · SygTire</h1>
<p class="sub">${r.dimensoes.join(' × ')} · ${fmt(r.duracaoEsperada)} s · 60 fps · gerado em ${esc(r.data)} por <code>scripts/validar.mjs</code></p>

<div class="card"><ul class="checks">${r.aprovado.map((a) => `<li>${ok(a.ok)} ${esc(a.item)}</li>`).join('')}</ul></div>

<h2>Screenshots nos tempos de teste</h2>
<p class="sub">Cada quadro ao lado da referência da cena ativa. Em tempos de transição, parte dos elementos ainda está entrando, como manda o roteiro.</p>
${TEMPOS.map((t) => comparar(cenaEm(t), nomeTempo(t), `${fmt(t)} s · cena 0${cenaEm(t)} · ${titulos[cenaEm(t)]}`)).join('')}

<h2>Composição completa de cada cena</h2>
${COMPOSICOES.map(([n, t]) => comparar(n, r.composicoes[n], `${fmt(t)} s · cena 0${n} · ${titulos[n]}`)).join('')}

<h2>Fotografia e logotipos</h2>
<div class="card"><table>
<tr><th>Teste</th><th>Resultado</th></tr>
<tr><td>Pixels onde nenhuma cena pinta e que diferem do original (todos os ${r.frames.total} frames)</td><td>${r.frames.alteracoesFotografia} ${ok(!r.frames.alteracoesFotografia)}
  <br><span style="color:var(--muted)">Registrados à parte: ${r.frames.bordaArredondamento} pixels com 1 nível (1/255) de diferença, todos a até ${r.frames.bordaDistanciaMax} px de um elemento (limite ${r.frames.raioBorda} px): bordas antialiasadas e caudas de sombras com opacidade abaixo de 1/255, que pertencem à camada de cena.</span></td></tr>
<tr><td>Pixels dos logotipos cobertos por cenas / diferentes do original (todos os frames)</td><td>${r.frames.logosCobertos} / ${r.frames.logosDiferentes} ${ok(!r.frames.logosCobertos && !r.frames.logosDiferentes)}</td></tr>
<tr><td>Fundo isolado (cenas ocultas) vs fundo-original.png</td><td>${r.frames.fundoIsolado.map((x) => `${fmt(x.tempo)} s: ${x.pixelsDiferentes}`).join(' · ')}</td></tr>
<tr><td>Imagens no documento</td><td>${r.estrutura.imagensNaPagina} (a fotografia, primeira camada: ${r.estrutura.fundoPrimeiraCamada ? 'sim' : 'não'})</td></tr>
<tr><td>Atributos do fundo</td><td><code>${esc(JSON.stringify(r.estrutura.fundoAtributos))}</code></td></tr>
<tr><td>Cortes de cena (pixels de cena no 1º frame)</td><td>${r.frames.cortesDeCena.map((c) => `${fmt(c.tempo)} s: ${c.pixelsDeCena}`).join(' · ')}</td></tr>
<tr><td>Encerramento parado (frames ${r.frames.encerramentoParado.de}–${r.frames.encerramentoParado.ate})</td><td>${r.frames.encerramentoParado.imagensDistintas} imagem distinta · ${fmt(r.frames.encerramentoParado.segundos)} s</td></tr>
<tr><td>Frames sem nenhum elemento de cena, no início de cada cena</td><td>${r.frames.framesVazios.porCena.map((n, i) => `0${i + 1}: ${n}`).join(' · ')} (fora dos cortes: ${r.frames.framesVazios.foraDosCortes.length})</td></tr>
<tr><td>Composição completa vs versão anterior (pixels diferentes por cena)</td><td>${r.identidade.map((x) => `0${x.cena}: ${x.pixelsDiferentes}`).join(' · ')}</td></tr>
<tr><td>Seek determinístico (os ${r.frames.determinismo.frames} frames recapturados em ordem inversa, em página nova)</td><td>${r.frames.determinismo.todosIguais ? 'todos idênticos' : 'divergências em ' + r.frames.determinismo.divergentes.length + ' frames'} ${ok(r.frames.determinismo.todosIguais)}</td></tr>
</table></div>

<h2>Timeline</h2>
<div class="card"><table>
<tr><th>Cena</th><th>Intervalo</th><th>Timeline</th><th>Última animação</th><th>Composição completa (leitura)</th><th>Conferências do roteiro</th></tr>
${r.tempos.map((t) => `<tr><td>0${t.cena} · ${esc(t.titulo)}</td><td>${fmt(t.inicio)}–${fmt(t.fim)} s</td><td>${fmt(t.duracaoTimeline)} s em ${fmt(t.posicaoNoMaster)} s</td><td>${t.ultimaAnimacao.toFixed(3)} s ${ok(t.cabeNoIntervalo)}</td><td>${fmt(t.composicaoCompleta[0])}–${fmt(t.composicaoCompleta[1])} s · ${fmt(t.permanencia)} s</td>
<td>${t.conferencias.map((c) => `${ok(c.ok)} <code>${esc(c.id)}</code> ${c.tipo} ${c.real ? `${c.real[0].toFixed(2)}→${c.real[1].toFixed(2)}` : '—'} <span style="color:var(--muted)">(janela ${fmt(c.janela[0])}–${fmt(c.janela[1])})</span>`).join('<br>')}</td></tr>`).join('')}
</table></div>

<h2>Elementos SVG por cena</h2>
<div class="card"><table>
<tr><th>Cena</th><th>&lt;text&gt;</th><th>&lt;path&gt;</th><th>&lt;rect&gt;</th><th>círculos/elipses</th><th>&lt;g&gt;</th><th>máscaras/recortes</th><th>Raster</th><th>Ids pedidos</th><th>Exemplos de texto</th></tr>
${r.svg.map((s) => `<tr><td>0${s.cena} · ${esc(s.titulo)}</td><td>${s.contagem.text}</td><td>${s.contagem.path}</td><td>${s.contagem.rect}</td><td>${s.contagem.circle + s.contagem.ellipse}</td><td>${s.contagem.g}</td><td>${s.contagem.mask + s.contagem.clipPath}</td>
<td>${s.raster.length ? esc(s.raster.join(', ')) : 'nenhum'} ${ok(!s.raster.length)}</td><td>${s.faltando.length ? 'faltam ' + esc(s.faltando.join(', ')) : 'ok'}</td><td>${s.amostraTextos.map(esc).join(' · ')}</td></tr>`).join('')}
</table></div>

<h2>Vídeos</h2>
<div class="card"><table>
<tr><th>Arquivo</th><th>Codec</th><th>Dimensões</th><th>FPS · frames · duração</th><th>Tamanho</th><th>PSNR médio vs frames renderizados</th></tr>
${r.videos.map((v) => `<tr><td><a href="../${esc(v.arquivo)}">${esc(v.arquivo)}</a></td><td>${esc(v.codec)} · ${esc(v.perfil)} · ${esc(v.pixfmt)}</td><td>${v.largura} × ${v.altura}</td><td>${esc(v.fps)} · ${v.frames} · ${v.duracao.toFixed(3)} s</td><td>${fmt(v.megabytes)} MB</td><td>${fmt(v.psnrMedio)} dB (fotografia: ${v.qualidade.map((q) => fmt(q.psnrFotografia)).join(' / ')} dB)</td></tr>`).join('')}
</table></div>
</main></body></html>`;
}

await main();
