/*
 * Cena 05 — Custo por quilômetro
 * Intervalo reservado no master: 17.00 s → 21.50 s (frames 1020 → 1290 a 60 fps)
 * Arte: svg/cena-05.svg → <g id="scene-05-cpk">
 *
 * Tempos locais (0 = 17.00 s no master):
 * 0.00–0.50  título
 * 0.40–1.00  painel (três cards em sequência)
 * 1.00–2.10  linha do gráfico desenhada; a área e os pontos acompanham a linha
 * 2.10–2.48  destaque do ponto verde final e variação -32%
 * 2.45–3.05  barra de recapabilidade preenche; 78% e +18% aparecem
 * 3.05–3.50  barra de sucateamento preenche; 12% e -45% aparecem
 * 3.50–4.00  painel completo (leitura)
 * 4.00–4.50  saída suave do painel e do título
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

  // 0.00–0.50 título
  tl.fromTo(titulo, { autoAlpha: 0, y: 16 },
    { autoAlpha: 1, y: 0, duration: 0.38, stagger: 0.04, ease: 'power2.out' }, 0);

  // 0.40–1.00 painel
  tl.fromTo(cards, { autoAlpha: 0, y: 18 },
    { autoAlpha: 1, y: 0, duration: 0.40, stagger: 0.10, ease: 'power3.out' }, 0.40);

  // 1.00–2.10 linha (oculta até começar, para a ponta arredondada não marcar um ponto)
  var inicioLinha = 1.00, duracaoLinha = 1.10;
  tl.fromTo(linha, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.01, ease: 'none' }, inicioLinha);
  tl.fromTo(linha, { strokeDasharray: comprimento + ' ' + (comprimento + 2), strokeDashoffset: comprimento + 1 },
    { strokeDashoffset: 0, duration: duracaoLinha, ease: 'none' }, inicioLinha);
  tl.fromTo(recorteArea, { attr: { width: 0 } },
    { attr: { width: larguraArea }, duration: duracaoLinha, ease: 'none' }, inicioLinha);

  // Cada ponto surge quando a linha passa por ele (posição proporcional ao comprimento).
  var percorrido = 0;
  pontos.forEach(function (ponto, i) {
    if (i > 0) {
      var a = pontos[i - 1], b = ponto;
      percorrido += Math.hypot(b.cx.baseVal.value - a.cx.baseVal.value, b.cy.baseVal.value - a.cy.baseVal.value);
    }
    tl.fromTo(ponto, { scale: 0, transformOrigin: '50% 50%' },
      { scale: 1, duration: 0.18, ease: 'back.out(2)' }, inicioLinha + duracaoLinha * percorrido / comprimento);
  });

  // 2.10–2.48 ponto final: anel verde surge e um halo se expande uma vez
  tl.fromTo(anelFinal, { scale: 0, transformOrigin: '50% 50%' },
    { scale: 1, duration: 0.22, ease: 'back.out(2.2)' }, 2.10);
  tl.fromTo(haloFinal, { opacity: 0 }, { opacity: 0.45, duration: 0.04, ease: 'none' }, 2.10);
  tl.to(haloFinal, { opacity: 0, attr: { r: 17 }, duration: 0.31, ease: 'power1.out' }, 2.14);
  tl.fromTo(variacoes[0], { autoAlpha: 0, x: 8 },
    { autoAlpha: 1, x: 0, duration: 0.30, ease: 'power2.out' }, 2.18);

  // 2.45–3.05 recapabilidade
  tl.fromTo(barraRecap, { attr: { width: 0 } },
    { attr: { width: +barraRecap.getAttribute('width') }, duration: 0.60, ease: 'power2.out' }, 2.45);
  tl.fromTo([valorRecap, variacoes[1]], { autoAlpha: 0 },
    { autoAlpha: 1, duration: 0.35, ease: 'none' }, 2.60);

  // 3.05–3.50 sucateamento
  tl.fromTo(barraSuc, { attr: { width: 0 } },
    { attr: { width: +barraSuc.getAttribute('width') }, duration: 0.45, ease: 'power2.out' }, 3.05);
  tl.fromTo([valorSuc, variacoes[2]], { autoAlpha: 0 },
    { autoAlpha: 1, duration: 0.32, ease: 'none' }, 3.15);

  // 4.00–4.50 saída
  tl.to(painel, { autoAlpha: 0, y: -10, duration: 0.35, ease: 'sine.in' }, 4.00);
  tl.to(titulo, { autoAlpha: 0, y: -10, duration: 0.30, stagger: 0.04, ease: 'sine.inOut' }, 4.08);
});
