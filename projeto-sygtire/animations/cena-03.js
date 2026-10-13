/*
 * Cena 03 — Alertas
 * Intervalo reservado no master: 5.90 s → 8.90 s (frames 354 → 534 a 60 fps)
 * Arte: svg/cena-03.svg → <g id="scene-03-alertas">
 *
 * Tempos locais (0 = 5.90 s no master):
 * 0.00–0.35  título
 * 0.25–0.65  painel surge com leve escala
 * 0.65–2.05  quatro alertas, 0.35 s cada
 * 2.05–2.50  painel completo; o indicador CRÍTICA pulsa discretamente
 * 2.50–2.83  alertas saem de baixo para cima
 * 2.78–3.00  painel e título saem
 *
 * Anime somente elementos dentro de `group`; nunca referencie #background-fixed.
 */
SygTire.registerScene('scene-03-alertas', function buildScene03(tl, group, scene) {
  var $ = function (id) { return group.querySelector('#' + id); };

  var titulo = [$('s3-titulo-linha-1'), $('s3-titulo-linha-2'), $('s3-titulo-linha-3')];
  var painel = $('s3-painel');
  var alertas = [1, 2, 3, 4].map(function (n) { return $('s3-alerta-' + n); });
  var prioridades = [1, 2, 3, 4].map(function (n) { return $('s3-alerta-' + n + '-prioridade'); });

  // 0.00–0.35 título
  tl.fromTo(titulo, { autoAlpha: 0, y: 16 },
    { autoAlpha: 1, y: 0, duration: 0.29, stagger: 0.03, ease: 'power2.out' }, 0);

  // 0.25–0.65 painel
  tl.fromTo(painel, { autoAlpha: 0, scale: 0.94, transformOrigin: '50% 0%' },
    { autoAlpha: 1, scale: 1, duration: 0.40, ease: 'power3.out', transformOrigin: '50% 0%' }, 0.25);

  // 0.65–2.05 alertas; o indicador de prioridade completa a entrada de cada linha
  alertas.forEach(function (alerta, i) {
    var t = 0.65 + i * 0.35;
    tl.fromTo(alerta, { autoAlpha: 0, y: 14 },
      { autoAlpha: 1, y: 0, duration: 0.30, ease: 'power3.out' }, t);
    tl.fromTo(prioridades[i], { autoAlpha: 0, scale: 0.6, transformOrigin: '50% 50%' },
      { autoAlpha: 1, scale: 1, duration: 0.20, ease: 'back.out(2)', transformOrigin: '50% 50%' }, t + 0.15);
  });

  // 2.05–2.50 pulso discreto do CRÍTICA (dois ciclos)
  tl.to(prioridades[0], { scale: 1.07, duration: 0.1125, yoyo: true, repeat: 3, ease: 'sine.inOut', transformOrigin: '50% 50%' }, 2.05);

  // 2.50–3.00 saída: alertas de baixo para cima, depois painel e título
  tl.to(alertas.slice().reverse(), { autoAlpha: 0, y: -12, duration: 0.18, stagger: 0.05, ease: 'power2.in' }, 2.50);
  tl.to(painel, { autoAlpha: 0, scale: 0.97, duration: 0.17, ease: 'power2.in', transformOrigin: '50% 0%' }, 2.78);
  tl.to(titulo, { autoAlpha: 0, y: -10, duration: 0.17, stagger: 0.015, ease: 'sine.inOut' }, 2.80);
});
