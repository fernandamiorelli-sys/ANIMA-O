import { chromium } from 'playwright';
import { PNG } from 'pngjs';
import { iniciarServidor } from './servidor.mjs';
const { servidor, url } = await iniciarServidor();
const flags = ['--disable-partial-raster', '--force-color-profile=srgb', ...process.argv.slice(2)];
const b = await chromium.launch({ args: flags });
const ctx = await b.newContext({ viewport: { width: 1672, height: 941 }, deviceScaleFactor: 1 });
const abrir = async () => { const p = await ctx.newPage(); await p.goto(url + '/index.html?render'); await p.evaluate(() => SygTire.ready); p.cdp = await ctx.newCDPSession(p); return p; };
const limpar = async (p) => {};
const relayout = (p) => p.evaluate(() => SygTire.SCENES.forEach((sc) => { const g = document.getElementById(sc.id); g.style.display = 'none'; g.getBoundingClientRect(); g.style.display = ''; }));
const cmp = (x, y) => { const X = PNG.sync.read(x).data, Y = PNG.sync.read(y).data; let n = 0, m = 0;
  for (let i = 0; i < X.length; i += 4) { const d = Math.max(Math.abs(X[i]-Y[i]), Math.abs(X[i+1]-Y[i+1]), Math.abs(X[i+2]-Y[i+2])); if (d) { n++; m = Math.max(m, d); } } return `${n}px/máx ${m}`; };
const out = [];
for (const alvo of [1110]) {
  const D = await abrir(); await D.evaluate(f => SygTire.render.frame(f), alvo); await relayout(D); await D.evaluate(f => SygTire.render.frame(f), alvo); const a = await D.screenshot({ type: 'png' }); await D.close();
  const S = await abrir(); for (let n = 0; n <= alvo; n += (n < alvo - 90 ? 30 : 1)) await S.evaluate(f => SygTire.render.frame(f), n);
  await relayout(S); await S.evaluate(f => SygTire.render.frame(f), alvo); const c = await S.screenshot({ type: 'png' }); await S.close();
  out.push(`f${alvo} ${cmp(a, c)}`); (await import('node:fs')).writeFileSync(process.env.SP + '/d1110.png', a); (await import('node:fs')).writeFileSync(process.env.SP + '/s1110.png', c);
}
console.log(JSON.stringify(process.argv.slice(2)), '→', out.join(' | '));
await b.close(); servidor.close();
