/*
 * Cena 01 — Abertura
 * Intervalo reservado no master: 0.00 s → 4.00 s (frames 0 → 240 a 60 fps)
 * Arte: svg/cena-01.svg → <g id="scene-01-abertura">
 *
 * 0.00–0.55  título (tag, quatro linhas, sublinhado) surge com fade e leve subida
 * 0.55–1.05  card 1 entra deslizando da esquerda
 * 1.05–1.55  card 2
 * 1.55–2.05  card 3
 * 2.05–3.35  composição completa (leitura)
 * 3.35–3.75  cards saem em sequência
 * 3.72–4.00  título sai por último
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

  // Entrada do título: 6 elementos, 0.40 s cada, 0.03 s de defasagem → termina em 0.55 s.
  tl.fromTo(titulo, { autoAlpha: 0, y: 16 },
    { autoAlpha: 1, y: 0, duration: 0.40, stagger: 0.03, ease: 'power2.out' }, 0);
  tl.fromTo(linhas, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.55, ease: 'none' }, 0);

  // Cards: 0.50 s cada, um a cada 0.50 s a partir de 0.55 s.
  cards.forEach(function (card, i) {
    tl.fromTo(card, { autoAlpha: 0, x: -36 },
      { autoAlpha: 1, x: 0, duration: 0.50, ease: 'power3.out' }, 0.55 + i * 0.50);
  });

  // Saída: cards de cima para baixo (3.35 → 3.75), título por último (3.72 → 4.00).
  tl.to(cards, { autoAlpha: 0, x: -24, duration: 0.24, stagger: 0.08, ease: 'power2.in' }, 3.35);
  tl.to(titulo, { autoAlpha: 0, y: -8, duration: 0.28, ease: 'sine.inOut' }, 3.72);
  tl.to(linhas, { autoAlpha: 0, duration: 0.28, ease: 'none' }, 3.72);
});
