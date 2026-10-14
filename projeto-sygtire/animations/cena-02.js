/*
 * Cena 02 — Aferição
 * Intervalo reservado no master: 4.00 s → 9.00 s (frames 240 → 540 a 60 fps)
 * Arte: svg/cena-02.svg → <g id="scene-02-afericao">
 *
 * Tempos locais (0 = 4.00 s no master):
 * 0.00–0.50  título
 * 0.35–1.00  celular surge pela direita, com leve escala e opacidade
 * 1.00–1.45  cabeçalho e identificação
 * 1.45–2.75  campos em sequência: sulco, pressão, hodômetro
 * 2.75–3.20  botão "Salvar aferição" aparece e recebe destaque (toque)
 * 3.25–3.71  confirmação verde "Aferição salva" (nunca antes do salvamento)
 * 3.71–4.40  composição estável (leitura)
 * 4.40–5.00  celular e título saem
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

  // 0.00–0.50 título
  tl.fromTo(titulo, { autoAlpha: 0, y: 16 },
    { autoAlpha: 1, y: 0, duration: 0.40, stagger: 0.05, ease: 'power2.out' }, 0);

  // 0.35–1.00 interface
  tl.fromTo(celular, { autoAlpha: 0, x: 70, scale: 0.94, transformOrigin: '50% 50%' },
    { autoAlpha: 1, x: 0, scale: 1, duration: 0.65, ease: 'power3.out', transformOrigin: '50% 50%' }, 0.35);

  // 1.00–1.45 cabeçalho e identificação
  tl.fromTo(topo, { autoAlpha: 0, y: 8 },
    { autoAlpha: 1, y: 0, duration: 0.33, stagger: 0.12, ease: 'power2.out' }, 1.00);

  // 1.45–2.75 campos, 0.40 s cada, um a cada 0.45 s
  campos.forEach(function (campo, i) {
    tl.fromTo(campo, { autoAlpha: 0, y: 10 },
      { autoAlpha: 1, y: 0, duration: 0.40, ease: 'power2.out' }, 1.45 + i * 0.45);
  });

  // 2.75–3.20 botão: aparece e recebe um toque com anel de destaque
  tl.fromTo(botao, { autoAlpha: 0, y: 8, transformOrigin: '50% 50%' },
    { autoAlpha: 1, y: 0, duration: 0.21, ease: 'power2.out' }, 2.75);
  tl.to(botao, { scale: 0.955, duration: 0.12, yoyo: true, repeat: 1, ease: 'sine.inOut', transformOrigin: '50% 50%' }, 2.96);
  tl.fromTo(destaque, { autoAlpha: 0, scale: 0.97, transformOrigin: '50% 50%' },
    { autoAlpha: 0.9, scale: 1.02, duration: 0.15, ease: 'power1.out', transformOrigin: '50% 50%' }, 2.90);
  tl.to(destaque, { autoAlpha: 0, scale: 1.05, duration: 0.15, ease: 'power1.in' }, 3.05);

  // 3.25–3.71 estado de sucesso
  tl.fromTo(confirmacao, { autoAlpha: 0, y: -6 },
    { autoAlpha: 1, y: 0, duration: 0.27, ease: 'power2.out' }, 3.25);
  tl.fromTo(circulo, { scale: 0, transformOrigin: '50% 50%' },
    { scale: 1, duration: 0.27, ease: 'back.out(2)', transformOrigin: '50% 50%' }, 3.31);
  tl.fromTo(check, { strokeDasharray: checkLen + ' ' + (checkLen + 2), strokeDashoffset: checkLen + 1 },
    { strokeDashoffset: 0, duration: 0.22, ease: 'power1.out' }, 3.49);
  tl.fromTo(textoConfirmacao, { autoAlpha: 0, x: -6 },
    { autoAlpha: 1, x: 0, duration: 0.30, ease: 'power2.out' }, 3.40);

  // 4.40–5.00 saída
  tl.to(celular, { autoAlpha: 0, x: 50, scale: 0.97, duration: 0.40, ease: 'power2.in', transformOrigin: '50% 50%' }, 4.40);
  tl.to(titulo, { autoAlpha: 0, y: -10, duration: 0.35, stagger: 0.05, ease: 'sine.inOut' }, 4.55);
});
