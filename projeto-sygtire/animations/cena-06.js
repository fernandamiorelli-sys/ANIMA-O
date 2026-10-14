/*
 * Cena 06 — Integração
 * Intervalo reservado no master: 14.10 s → 16.95 s (frames 846 → 1017 a 60 fps)
 * Arte: svg/cena-06.svg → <g id="scene-06-integracao">
 *
 * Tempos locais (0 = 14.10 s no master):
 * 0.00–0.30  título
 * 0.30–0.60  card SAGI
 * 0.55–0.85  card iSat
 * 0.80–1.15  card SygTire
 * 1.15–1.55  conexões desenhadas progressivamente (nós e seta acompanham)
 * 1.55–2.10  pontos verdes percorrem as conexões até o SygTire (MotionPathPlugin)
 * 2.10–2.45  brilho verde de sincronização no card SygTire
 * 2.45–2.85  saída suave de todos os elementos
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

  // 0.00–0.30 título
  tl.fromTo(titulo, { autoAlpha: 0, y: 16 },
    { autoAlpha: 1, y: 0, duration: 0.21, stagger: 0.03, ease: 'power2.out' }, 0);

  // Cards
  function entrada() { return { autoAlpha: 0, y: 14, scale: 0.96, transformOrigin: '50% 50%' }; }
  tl.fromTo(cardSagi, entrada(), { autoAlpha: 1, y: 0, scale: 1, duration: 0.30, ease: 'power3.out' }, 0.30);
  tl.fromTo(cardIsat, entrada(), { autoAlpha: 1, y: 0, scale: 1, duration: 0.30, ease: 'power3.out' }, 0.55);
  tl.fromTo(cardSygtire, entrada(), { autoAlpha: 1, y: 0, scale: 1, duration: 0.35, ease: 'power3.out' }, 0.80);

  // 1.15–1.55 conexões
  conexoes.forEach(function (conexao) {
    var comprimento = conexao.getTotalLength();
    tl.fromTo(conexao, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.01, ease: 'none' }, 1.15);
    tl.fromTo(conexao, { strokeDasharray: comprimento + ' ' + (comprimento + 2), strokeDashoffset: comprimento + 1 },
      { strokeDashoffset: 0, duration: 0.40, ease: 'power1.inOut' }, 1.15);
  });
  tl.fromTo(nosOrigem, { autoAlpha: 0, scale: 0, transformOrigin: '50% 50%' },
    { autoAlpha: 1, scale: 1, duration: 0.15, ease: 'back.out(2)' }, 1.15);
  tl.fromTo(noJuncao, { autoAlpha: 0, scale: 0, transformOrigin: '50% 50%' },
    { autoAlpha: 1, scale: 1, duration: 0.14, ease: 'back.out(2)' }, 1.38);
  tl.fromTo(seta, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.08, ease: 'none' }, 1.47);

  // 1.55–2.10 fluxo de dados ao longo dos paths
  fluxos.forEach(function (fluxo, i) {
    tl.fromTo(fluxo, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.06, ease: 'none' }, 1.55);
    tl.to(fluxo, {
      motionPath: { path: conexoes[i], align: conexoes[i], alignOrigin: [0.5, 0.5] },
      duration: 0.55, ease: 'power1.inOut', immediateRender: true
    }, 1.55);
    tl.to(fluxo, { autoAlpha: 0, duration: 0.06, ease: 'none' }, 2.04);
  });

  // 2.10–2.45 sincronização
  tl.fromTo(sincronizacao, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.25, ease: 'power1.out' }, 2.10);
  tl.to(cardSygtire, { scale: 1.025, duration: 0.175, yoyo: true, repeat: 1, ease: 'sine.inOut' }, 2.10);

  // 2.45–2.85 saída
  tl.to(titulo.concat([cardSagi, cardIsat, grupoConexoes, nosOrigem[0], nosOrigem[1], noJuncao, cardSygtire]),
    { autoAlpha: 0, y: -8, duration: 0.28, stagger: 0.012, ease: 'sine.inOut' }, 2.45);
});
