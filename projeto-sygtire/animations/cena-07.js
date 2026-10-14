/*
 * Cena 07 — Encerramento institucional
 * Intervalo reservado no master: 25.50 s → 30.00 s (frames 1530 → 1800 a 60 fps)
 * Arte: svg/cena-07.svg → <g id="scene-07-encerramento">
 *
 * Tempos locais (0 = 25.50 s no master):
 * 0.00–0.60  "CADA PERDA IDENTIFICADA." revelada por máscara horizontal
 * 0.50–1.10  "CADA RESULTADO COMPROVADO." com a mesma revelação
 * 1.05–1.55  assinatura: fade-in com leve subida
 * 1.50–1.85  selo institucional aparece discretamente
 * 1.85–2.15  detalhe gráfico (linha verde) se estende
 * 2.15–4.50  mensagem completa, parada até o último frame (2,35 s): sem saída, sem fade-out
 *
 * Anime somente elementos dentro de `group`; nunca referencie #background-fixed.
 */
SygTire.registerScene('scene-07-encerramento', function buildScene07(tl, group, scene) {
  var $ = function (id) { return group.querySelector('#' + id); };

  var cortina1 = $('s7-mascara-01-cortina');
  var cortina2 = $('s7-mascara-02-cortina');
  var assinatura = [$('s7-assinatura-linha-1'), $('s7-assinatura-linha-2'), $('s7-assinatura-linha-3')];
  var selo = $('selo-final');
  var detalhe = $('s7-detalhe-linha');

  // A cortina (600 px sólidos + 60 px de borda suave) parte de -600 px: a borda suave termina
  // exatamente onde o texto começa (x ≈ 60), então tudo está oculto e a revelação começa já no
  // primeiro frame, sem trecho de percurso sem texto.
  tl.fromTo(cortina1, { x: -600 }, { x: 0, duration: 0.60, ease: 'power2.inOut' }, 0);
  tl.fromTo(cortina2, { x: -600 }, { x: 0, duration: 0.60, ease: 'power2.inOut' }, 0.50);

  // 1.05–1.55 assinatura
  tl.fromTo(assinatura, { autoAlpha: 0, y: 12 },
    { autoAlpha: 1, y: 0, duration: 0.42, stagger: 0.04, ease: 'power2.out' }, 1.05);

  // 1.50–1.85 selo
  tl.fromTo(selo, { autoAlpha: 0, y: 10, scale: 0.97, transformOrigin: '50% 50%' },
    { autoAlpha: 1, y: 0, scale: 1, duration: 0.35, ease: 'power2.out' }, 1.50);

  // 1.85–2.15 detalhe
  tl.fromTo(detalhe, { autoAlpha: 0, scaleX: 0, transformOrigin: '0% 50%' },
    { autoAlpha: 1, scaleX: 1, duration: 0.30, ease: 'power2.out' }, 1.85);
});
