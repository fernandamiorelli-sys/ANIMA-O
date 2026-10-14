/*
 * Cena 03 — Alertas
 * Intervalo reservado no master: 9.00 s → 13.50 s (frames 540 → 810 a 60 fps)
 * Arte: svg/cena-03.svg → <g id="scene-03-alertas">
 *
 * Tempos locais (0 = 9.00 s no master):
 * 0.00–0.50  título
 * 0.35–0.95  painel surge com leve escala
 * 0.95–3.12  quatro alertas, um a cada 0.55 s
 * 3.12–3.75  painel completo; o indicador CRÍTICA pulsa discretamente
 * 3.75–4.20  alertas saem de baixo para cima
 * 4.12–4.50  painel e título saem
 *
 * Anime somente elementos dentro de `group`; nunca referencie #background-fixed.
 */
SygTire.registerScene('scene-03-alertas', function buildScene03(tl, group, scene) {
  var $ = function (id) { return group.querySelector('#' + id); };

  var titulo = [$('s3-titulo-linha-1'), $('s3-titulo-linha-2'), $('s3-titulo-linha-3')];
  var painel = $('s3-painel');
  var alertas = [1, 2, 3, 4].map(function (n) { return $('s3-alerta-' + n); });
  var prioridades = [1, 2, 3, 4].map(function (n) { return $('s3-alerta-' + n + '-prioridade'); });

  // 0.00–0.50 título
  tl.fromTo(titulo, { autoAlpha: 0, y: 16 },
    { autoAlpha: 1, y: 0, duration: 0.40, stagger: 0.05, ease: 'power2.out' }, 0);

  // 0.35–0.95 painel
  tl.fromTo(painel, { autoAlpha: 0, scale: 0.94, transformOrigin: '50% 0%' },
    { autoAlpha: 1, scale: 1, duration: 0.60, ease: 'power3.out', transformOrigin: '50% 0%' }, 0.35);

  // 0.95–3.12 alertas; o indicador de prioridade completa a entrada de cada linha
  alertas.forEach(function (alerta, i) {
    var t = 0.95 + i * 0.55;
    tl.fromTo(alerta, { autoAlpha: 0, y: 14 },
      { autoAlpha: 1, y: 0, duration: 0.45, ease: 'power3.out' }, t);
    tl.fromTo(prioridades[i], { autoAlpha: 0, scale: 0.6, transformOrigin: '50% 50%' },
      { autoAlpha: 1, scale: 1, duration: 0.30, ease: 'back.out(2)', transformOrigin: '50% 50%' }, t + 0.22);
  });

  // 3.12–3.72 pulso discreto do CRÍTICA (dois ciclos)
  tl.to(prioridades[0], { scale: 1.07, duration: 0.15, yoyo: true, repeat: 3, ease: 'sine.inOut', transformOrigin: '50% 50%' }, 3.12);

  // 3.75–4.50 saída: alertas de baixo para cima, depois painel e título
  tl.to(alertas.slice().reverse(), { autoAlpha: 0, y: -12, duration: 0.24, stagger: 0.07, ease: 'power2.in' }, 3.75);
  tl.to(painel, { autoAlpha: 0, scale: 0.97, duration: 0.24, ease: 'power2.in', transformOrigin: '50% 0%' }, 4.12);
  tl.to(titulo, { autoAlpha: 0, y: -10, duration: 0.26, stagger: 0.02, ease: 'sine.inOut' }, 4.20);
});
