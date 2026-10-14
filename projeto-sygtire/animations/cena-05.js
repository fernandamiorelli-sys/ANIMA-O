/*
 * Cena 05 — Custo por quilômetro
 * Intervalo reservado no master: 11.05 s → 14.10 s (frames 663 → 846 a 60 fps)
 * Arte: svg/cena-05.svg → <g id="scene-05-cpk">
 *
 * Tempos locais (0 = 11.05 s no master):
 * 0.00–0.35  título
 * 0.30–0.70  painel (três cards em sequência)
 * 0.70–1.40  linha do gráfico desenhada; a área e os pontos acompanham a linha
 * 1.40–1.65  destaque do ponto verde final e variação -32%
 * 1.65–2.05  barra de recapabilidade preenche; 78% e +18% aparecem
 * 2.05–2.35  barra de sucateamento preenche; 12% e -45% aparecem
 * 2.35–2.70  painel completo
 * 2.70–3.05  saída suave do painel e do título
 *
 * Os valores exibidos são sempre os da referência: nada é contado nem interpolado.
 * Anime somente elementos dentro de `group`; nunca referencie #background-fixed.
 */
SygTire.registerScene('scene-05-cpk', function buildScene05(tl, group, scene) {
  var $ = function (id) { return group.querySelector('#' + id); };

  var titulo = [$('s5-titulo-linha-1'), $('s5-titulo-linha-2'), $('s5-titulo-linha-3'), $('s5-titulo-ponto')];
  var painel = $('painel-cpk');
  var cards = [$('card-cpk'), $('card-recapabilidade'), $('card-sucateamento')];
  var linha = $('linha-grafico');
  var recorteArea = $('s5-recorte-area-rect');
  var pontos = ['jan', 'fev', 'mar', 'abr', 'mai'].map(function (m) { return $('s5-ponto-' + m); });
  var anelFinal = $('s5-ponto-final-anel');
  var haloFinal = $('s5-ponto-final-halo');
  var variacoes = [$('s5-variacao-cpk'), $('s5-variacao-recapabilidade'), $('s5-variacao-sucateamento')];
  var barraRecap = $('barra-recapabilidade').querySelector('rect');
  var barraSuc = $('barra-sucateamento').querySelector('rect');
  var valorRecap = $('s5-recapabilidade-valor');
  var valorSuc = $('s5-sucateamento-valor');

  var comprimento = linha.getTotalLength();
  var larguraArea = +recorteArea.getAttribute('width');

  // 0.00–0.35 título
  tl.fromTo(titulo, { autoAlpha: 0, y: 16 },
    { autoAlpha: 1, y: 0, duration: 0.26, stagger: 0.03, ease: 'power2.out' }, 0);

  // 0.30–0.70 painel
  tl.fromTo(cards, { autoAlpha: 0, y: 18 },
    { autoAlpha: 1, y: 0, duration: 0.28, stagger: 0.06, ease: 'power3.out' }, 0.30);

  // 0.70–1.40 linha (oculta até começar, para a ponta arredondada não marcar um ponto)
  tl.fromTo(linha, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.01, ease: 'none' }, 0.70);
  tl.fromTo(linha, { strokeDasharray: comprimento + ' ' + (comprimento + 2), strokeDashoffset: comprimento + 1 },
    { strokeDashoffset: 0, duration: 0.70, ease: 'none' }, 0.70);
  tl.fromTo(recorteArea, { attr: { width: 0 } },
    { attr: { width: larguraArea }, duration: 0.70, ease: 'none' }, 0.70);

  // Cada ponto surge quando a linha passa por ele (posição proporcional ao comprimento).
  var percorrido = 0;
  pontos.forEach(function (ponto, i) {
    if (i > 0) {
      var a = pontos[i - 1], b = ponto;
      percorrido += Math.hypot(b.cx.baseVal.value - a.cx.baseVal.value, b.cy.baseVal.value - a.cy.baseVal.value);
    }
    tl.fromTo(ponto, { scale: 0, transformOrigin: '50% 50%' },
      { scale: 1, duration: 0.12, ease: 'back.out(2)' }, 0.70 + 0.70 * percorrido / comprimento);
  });

  // 1.40–1.65 ponto final: anel verde surge e um halo se expande uma vez
  tl.fromTo(anelFinal, { scale: 0, transformOrigin: '50% 50%' },
    { scale: 1, duration: 0.15, ease: 'back.out(2.2)' }, 1.40);
  tl.fromTo(haloFinal, { opacity: 0 }, { opacity: 0.45, duration: 0.03, ease: 'none' }, 1.40);
  tl.to(haloFinal, { opacity: 0, attr: { r: 17 }, duration: 0.22, ease: 'power1.out' }, 1.43);
  tl.fromTo(variacoes[0], { autoAlpha: 0, x: 8 },
    { autoAlpha: 1, x: 0, duration: 0.20, ease: 'power2.out' }, 1.45);

  // 1.65–2.05 recapabilidade
  tl.fromTo(barraRecap, { attr: { width: 0 } },
    { attr: { width: +barraRecap.getAttribute('width') }, duration: 0.40, ease: 'power2.out' }, 1.65);
  tl.fromTo([valorRecap, variacoes[1]], { autoAlpha: 0 },
    { autoAlpha: 1, duration: 0.25, ease: 'none' }, 1.75);

  // 2.05–2.35 sucateamento
  tl.fromTo(barraSuc, { attr: { width: 0 } },
    { attr: { width: +barraSuc.getAttribute('width') }, duration: 0.30, ease: 'power2.out' }, 2.05);
  tl.fromTo([valorSuc, variacoes[2]], { autoAlpha: 0 },
    { autoAlpha: 1, duration: 0.22, ease: 'none' }, 2.12);

  // 2.70–3.05 saída
  tl.to(painel, { autoAlpha: 0, y: -10, duration: 0.25, ease: 'sine.in' }, 2.70);
  tl.to(titulo, { autoAlpha: 0, y: -10, duration: 0.22, stagger: 0.03, ease: 'sine.inOut' }, 2.74);
});
