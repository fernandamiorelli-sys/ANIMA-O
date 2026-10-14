import { PNG } from 'pngjs';
import { abrirNavegador } from './navegador.mjs';
import { iniciarServidor } from './servidor.mjs';
const { servidor, url } = await iniciarServidor();
const b = await abrirNavegador();
const ctx = await b.newContext({ viewport: { width: 1672, height: 941 }, deviceScaleFactor: 1 });
const css = process.argv[2] === 'gp';
const abrir = async () => { const p = await ctx.newPage(); await p.goto(url + '/index.html?render'); await p.evaluate(() => SygTire.ready);
  if (css) await p.addStyleTag({ content: '#sygtire-master text { text-rendering: geometricPrecision; }' }); return p; };
const relayout = (p) => p.evaluate(() => SygTire.SCENES.forEach((sc) => { const g = document.getElementById(sc.id); g.style.display = 'none'; g.getBoundingClientRect(); g.style.display = ''; }));
const shot = async (p, f) => { await p.evaluate(f => SygTire.render.frame(f), f); await relayout(p); await p.evaluate(f => SygTire.render.frame(f), f); return p.screenshot({ type: 'png' }); };
const cmp = (x, y) => { const X = PNG.sync.read(x).data, Y = PNG.sync.read(y).data; let n = 0, m = 0;
  for (let i = 0; i < X.length; i += 4) { const d = Math.max(Math.abs(X[i]-Y[i]), Math.abs(X[i+1]-Y[i+1]), Math.abs(X[i+2]-Y[i+2])); if (d) { n++; m = Math.max(m, d); } } return `${n}px/máx ${m}`; };
const out = [];
for (const alvo of [1110, 210, 318]) {
  const D = await abrir(); const a = await shot(D, alvo); await D.close();
  const S = await abrir(); for (let n = 0; n < alvo; n += (n < alvo - 90 ? 30 : 1)) await S.evaluate(f => SygTire.render.frame(f), n); const c = await shot(S, alvo); await S.close();
  out.push(`f${alvo} ${cmp(a, c)}`);
  if (alvo === 318) (await import('node:fs')).writeFileSync(`${process.env.SP}/f318-${css ? 'gp' : 'normal'}.png`, a);
}
console.log(css ? 'geometricPrecision' : 'padrão', '→', out.join(' | '));
await b.close(); servidor.close();
