/*
 * Cena 02 — Aferição
 * Intervalo reservado no master: 2.55 s → 5.90 s (frames 153 → 354 a 60 fps)
 * Arte: svg/cena-02.svg → <g id="scene-02-afericao">
 *
 * Tempos locais (0 = 2.55 s no master):
 * 0.00–0.35  título
 * 0.25–0.70  celular surge pela direita, com leve escala e opacidade
 * 0.70–1.00  cabeçalho e identificação
 * 1.00–1.90  campos em sequência: sulco, pressão, hodômetro
 * 1.90–2.20  botão "Salvar aferição" aparece e recebe destaque (toque)
 * 2.20–2.55  confirmação verde "Aferição salva" (nunca antes do salvamento)
 * 2.55–2.95  composição estável
 * 2.95–3.35  celular e título saem
 *
 * Anime somente elementos dentro de `group`; nunca referencie #background-fixed.
 */
SygTire.registerScene('scene-02-afericao', function buildScene02(tl, group, scene) {
  var $ = function (id) { return group.querySelector('#' + id); };

  var titulo = [$('s2-titulo-linha-1'), $('s2-titulo-linha-2'), $('s2-titulo-linha-3')];
  var celular = $('s2-celular');
  var topo = [$('s2-cabecalho'), $('s2-identificacao')];
  var campos = [$('s2-campo-sulco'), $('s2-campo-pressao'), $('s2-campo-hodometro')];
  var botao = $('s2-botao-salvar');
  var destaque = $('s2-botao-destaque');
  var confirmacao = $('s2-confirmacao');
  var circulo = $('s2-confirmacao-circulo');
  var check = $('s2-confirmacao-check');
  var textoConfirmacao = $('s2-confirmacao-texto');
  var checkLen = check.getTotalLength();

  // 0.00–0.35 título
  tl.fromTo(titulo, { autoAlpha: 0, y: 16 },
    { autoAlpha: 1, y: 0, duration: 0.29, stagger: 0.03, ease: 'power2.out' }, 0);

  // 0.25–0.70 interface
  tl.fromTo(celular, { autoAlpha: 0, x: 70, scale: 0.94, transformOrigin: '50% 50%' },
    { autoAlpha: 1, x: 0, scale: 1, duration: 0.45, ease: 'power3.out', transformOrigin: '50% 50%' }, 0.25);

  // 0.70–1.00 cabeçalho e identificação
  tl.fromTo(topo, { autoAlpha: 0, y: 8 },
    { autoAlpha: 1, y: 0, duration: 0.22, stagger: 0.08, ease: 'power2.out' }, 0.70);

  // 1.00–1.90 campos, 0.30 s cada
  campos.forEach(function (campo, i) {
    tl.fromTo(campo, { autoAlpha: 0, y: 10 },
      { autoAlpha: 1, y: 0, duration: 0.30, ease: 'power2.out' }, 1.00 + i * 0.30);
  });

  // 1.90–2.20 botão: aparece e recebe um toque com anel de destaque
  tl.fromTo(botao, { autoAlpha: 0, y: 8, transformOrigin: '50% 50%' },
    { autoAlpha: 1, y: 0, duration: 0.14, ease: 'power2.out' }, 1.90);
  tl.to(botao, { scale: 0.955, duration: 0.08, yoyo: true, repeat: 1, ease: 'sine.inOut', transformOrigin: '50% 50%' }, 2.04);
  tl.fromTo(destaque, { autoAlpha: 0, scale: 0.97, transformOrigin: '50% 50%' },
    { autoAlpha: 0.9, scale: 1.02, duration: 0.10, ease: 'power1.out', transformOrigin: '50% 50%' }, 2.00);
  tl.to(destaque, { autoAlpha: 0, scale: 1.05, duration: 0.10, ease: 'power1.in' }, 2.10);

  // 2.20–2.55 estado de sucesso
  tl.fromTo(confirmacao, { autoAlpha: 0, y: -6 },
    { autoAlpha: 1, y: 0, duration: 0.18, ease: 'power2.out' }, 2.20);
  tl.fromTo(circulo, { scale: 0, transformOrigin: '50% 50%' },
    { scale: 1, duration: 0.18, ease: 'back.out(2)', transformOrigin: '50% 50%' }, 2.24);
  tl.fromTo(check, { strokeDasharray: checkLen + ' ' + (checkLen + 2), strokeDashoffset: checkLen + 1 },
    { strokeDashoffset: 0, duration: 0.15, ease: 'power1.out' }, 2.36);
  tl.fromTo(textoConfirmacao, { autoAlpha: 0, x: -6 },
    { autoAlpha: 1, x: 0, duration: 0.20, ease: 'power2.out' }, 2.30);

  // 2.95–3.35 saída
  tl.to(celular, { autoAlpha: 0, x: 50, scale: 0.97, duration: 0.30, ease: 'power2.in', transformOrigin: '50% 50%' }, 2.95);
  tl.to(titulo, { autoAlpha: 0, y: -10, duration: 0.22, stagger: 0.03, ease: 'sine.inOut' }, 3.07);
});
