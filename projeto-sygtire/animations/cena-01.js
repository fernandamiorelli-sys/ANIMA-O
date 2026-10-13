/*
 * Cena 01 — Abertura
 * Intervalo reservado no master: 0.00 s → 2.55 s (frames 0 → 153 a 60 fps)
 * Arte: svg/cena-01.svg → <g id="scene-01-abertura">
 *
 * 0.00–0.30  título (tag, quatro linhas, sublinhado) surge com fade e leve subida
 * 0.30–0.65  card 1 entra deslizando da esquerda
 * 0.65–1.00  card 2
 * 1.00–1.35  card 3
 * 1.35–2.10  composição completa
 * 2.10–2.40  cards saem em sequência
 * 2.37–2.55  título sai por último
 *
 * Os tempos são locais à cena (0 = início da cena no master).
 * Anime somente elementos dentro de `group`; nunca referencie #background-fixed.
 */
SygTire.registerScene('scene-01-abertura', function buildScene01(tl, group, scene) {
  var $ = function (id) { return group.querySelector('#' + id); };

  var titulo = [
    's1-tag-lancamento',
    's1-titulo-linha-1', 's1-titulo-linha-2', 's1-titulo-linha-3', 's1-titulo-linha-4',
    's1-titulo-sublinhado'
  ].map($);
  var linhas = $('s1-linhas-decorativas');
  var cards = [$('s1-card-1'), $('s1-card-2'), $('s1-card-3')];

  // Entrada do título: 6 elementos, 0.22 s cada, 0.016 s de defasagem → termina em 0.30 s.
  tl.fromTo(titulo, { autoAlpha: 0, y: 16 },
    { autoAlpha: 1, y: 0, duration: 0.22, stagger: 0.016, ease: 'power2.out' }, 0);
  tl.fromTo(linhas, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.30, ease: 'none' }, 0);

  // Cards: 0.35 s cada, a partir de 0.30 s.
  cards.forEach(function (card, i) {
    tl.fromTo(card, { autoAlpha: 0, x: -36 },
      { autoAlpha: 1, x: 0, duration: 0.35, ease: 'power3.out' }, 0.30 + i * 0.35);
  });

  // Saída: cards de cima para baixo (2.10 → 2.40), título por último (2.37 → 2.55).
  tl.to(cards, { autoAlpha: 0, x: -24, duration: 0.18, stagger: 0.06, ease: 'power2.in' }, 2.10);
  tl.to(titulo, { autoAlpha: 0, y: -8, duration: 0.18, ease: 'sine.inOut' }, 2.37);
  tl.to(linhas, { autoAlpha: 0, duration: 0.18, ease: 'none' }, 2.37);
});
