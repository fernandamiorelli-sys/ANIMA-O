/*
 * Cena 06 — Integração
 * Intervalo reservado no master: 21.50 s → 25.50 s (frames 1290 → 1530 a 60 fps)
 * Arte: svg/cena-06.svg → <g id="scene-06-integracao">
 *
 * Tempos locais (0 = 21.50 s no master):
 * 0.00–0.45  título
 * 0.40–0.85  card SAGI
 * 0.75–1.20  card iSat
 * 1.10–1.60  card SygTire
 * 1.60–2.20  conexões desenhadas progressivamente (nós e seta acompanham)
 * 2.20–3.05  pontos verdes percorrem as conexões até o SygTire (MotionPathPlugin)
 * 3.05–3.55  brilho verde de sincronização no card SygTire
 * 3.55–4.00  saída suave de todos os elementos
 *
 * Os logotipos da fotografia de fundo não fazem parte desta cena.
 * Anime somente elementos dentro de `group`; nunca referencie #background-fixed.
 */
SygTire.registerScene('scene-06-integracao', function buildScene06(tl, group, scene) {
  var $ = function (id) { return group.querySelector('#' + id); };

  var titulo = [$('s6-titulo-linha-1'), $('s6-titulo-linha-2'), $('s6-titulo-linha-3'), $('s6-titulo-ponto')];
  var cardSagi = $('card-sagi');
  var cardIsat = $('card-isat');
  var cardSygtire = $('card-sygtire');
  var conexoes = [$('conexao-sagi'), $('conexao-isat')];
  var grupoConexoes = $('s6-conexoes');
  var seta = $('s6-conexao-seta');
  var nosOrigem = [$('s6-no-sagi'), $('s6-no-isat')];
  var noJuncao = $('s6-no-juncao');
  var fluxos = [$('fluxo-sagi'), $('fluxo-isat')];
  var sincronizacao = $('s6-sincronizacao');

  // 0.00–0.45 título
  tl.fromTo(titulo, { autoAlpha: 0, y: 16 },
    { autoAlpha: 1, y: 0, duration: 0.33, stagger: 0.04, ease: 'power2.out' }, 0);

  // Cards
  function entrada() { return { autoAlpha: 0, y: 14, scale: 0.96, transformOrigin: '50% 50%' }; }
  tl.fromTo(cardSagi, entrada(), { autoAlpha: 1, y: 0, scale: 1, duration: 0.45, ease: 'power3.out' }, 0.40);
  tl.fromTo(cardIsat, entrada(), { autoAlpha: 1, y: 0, scale: 1, duration: 0.45, ease: 'power3.out' }, 0.75);
  tl.fromTo(cardSygtire, entrada(), { autoAlpha: 1, y: 0, scale: 1, duration: 0.50, ease: 'power3.out' }, 1.10);

  // 1.60–2.20 conexões
  conexoes.forEach(function (conexao) {
    var comprimento = conexao.getTotalLength();
    tl.fromTo(conexao, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.01, ease: 'none' }, 1.60);
    tl.fromTo(conexao, { strokeDasharray: comprimento + ' ' + (comprimento + 2), strokeDashoffset: comprimento + 1 },
      { strokeDashoffset: 0, duration: 0.60, ease: 'power1.inOut' }, 1.60);
  });
  tl.fromTo(nosOrigem, { autoAlpha: 0, scale: 0, transformOrigin: '50% 50%' },
    { autoAlpha: 1, scale: 1, duration: 0.22, ease: 'back.out(2)' }, 1.60);
  tl.fromTo(noJuncao, { autoAlpha: 0, scale: 0, transformOrigin: '50% 50%' },
    { autoAlpha: 1, scale: 1, duration: 0.20, ease: 'back.out(2)' }, 1.95);
  tl.fromTo(seta, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.12, ease: 'none' }, 2.08);

  // 2.20–3.05 fluxo de dados ao longo dos paths
  fluxos.forEach(function (fluxo, i) {
    tl.fromTo(fluxo, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.08, ease: 'none' }, 2.20);
    tl.to(fluxo, {
      motionPath: { path: conexoes[i], align: conexoes[i], alignOrigin: [0.5, 0.5] },
      duration: 0.85, ease: 'power1.inOut', immediateRender: true
    }, 2.20);
    tl.to(fluxo, { autoAlpha: 0, duration: 0.09, ease: 'none' }, 2.96);
  });

  // 3.05–3.55 sincronização
  tl.fromTo(sincronizacao, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.35, ease: 'power1.out' }, 3.05);
  tl.to(cardSygtire, { scale: 1.025, duration: 0.25, yoyo: true, repeat: 1, ease: 'sine.inOut' }, 3.05);

  // 3.55–4.00 saída
  tl.to(titulo.concat([cardSagi, cardIsat, grupoConexoes, nosOrigem[0], nosOrigem[1], noJuncao, cardSygtire]),
    { autoAlpha: 0, y: -8, duration: 0.33, stagger: 0.012, ease: 'sine.inOut' }, 3.55);
});
