/*
 * Cena 04 — Ação
 * Intervalo reservado no master: 13.50 s → 17.00 s (frames 810 → 1020 a 60 fps)
 * Arte: svg/cena-04.svg → <g id="scene-04-acao">
 *
 * Tempos locais (0 = 13.50 s no master):
 * 0.00–0.40  título
 * 0.30–0.85  diagrama do veículo
 * 0.85–1.25  posição 2E recebe destaque azul
 * 1.25–1.95  linha verde desenhada de 2E até 3D (stroke-dashoffset)
 * 1.95–2.40  posição 3D recebe destaque; aviso de conclusão aparece
 * 2.40–2.75  histórico atualizado
 * 2.75–3.20  composição completa (leitura)
 * 3.20–3.50  tudo desaparece suavemente
 *
 * Anime somente elementos dentro de `group`; nunca referencie #background-fixed.
 */
SygTire.registerScene('scene-04-acao', function buildScene04(tl, group, scene) {
  var $ = function (id) { return group.querySelector('#' + id); };

  var titulo = [$('s4-titulo-linha-1'), $('s4-titulo-linha-2')];
  var diagrama = $('s4-diagrama');
  var rotulo2E = $('s4-rotulo-2E');
  var destaque2E = $('s4-destaque-2E');
  var destaque3D = $('s4-destaque-3D');
  var linha = $('s4-movimento-linha');
  var ponta2E = $('s4-movimento-ponta-2E');
  var ponta3D = $('s4-movimento-ponta-3D');
  var confirmacao = $('s4-confirmacao');
  var circulo = $('s4-confirmacao-circulo');
  var check = $('s4-confirmacao-check');
  var historico = $('s4-historico');
  var linhaLen = linha.getTotalLength();
  var checkLen = check.getTotalLength();

  // 0.00–0.40 título
  tl.fromTo(titulo, { autoAlpha: 0, y: 14 },
    { autoAlpha: 1, y: 0, duration: 0.32, stagger: 0.08, ease: 'power2.out' }, 0);

  // 0.30–0.85 diagrama
  tl.fromTo(diagrama, { autoAlpha: 0, y: 14, scale: 0.97, transformOrigin: '50% 50%' },
    { autoAlpha: 1, y: 0, scale: 1, duration: 0.55, ease: 'power3.out', transformOrigin: '50% 50%' }, 0.30);

  // 0.85–1.25 destaque azul em 2E (o rótulo passa de neutro para azul)
  tl.fromTo(destaque2E, { autoAlpha: 0, scale: 0.92, transformOrigin: '50% 50%' },
    { autoAlpha: 1, scale: 1, duration: 0.40, ease: 'power2.out', transformOrigin: '50% 50%' }, 0.85);
  tl.fromTo(rotulo2E, { fill: '#1f2a44', scale: 0.78, transformOrigin: '100% 70%' },
    { fill: '#1a7fe0', scale: 1, duration: 0.40, ease: 'power2.out', transformOrigin: '100% 70%' }, 0.85);

  // 1.25–1.95 linha de movimento 2E → 3D
  // A linha fica oculta até começar: com stroke-linecap round, um traço de comprimento
  // zero ainda desenharia um ponto.
  tl.fromTo(linha, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.01, ease: 'none' }, 1.25);
  tl.fromTo(linha, { strokeDasharray: linhaLen + ' ' + (linhaLen + 2), strokeDashoffset: linhaLen + 1 },
    { strokeDashoffset: 0, duration: 0.70, ease: 'power1.inOut' }, 1.25);
  tl.fromTo(ponta2E, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.12, ease: 'none' }, 1.25);
  tl.fromTo(ponta3D, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.12, ease: 'none' }, 1.83);

  // 1.95–2.40 destaque verde em 3D e aviso de conclusão
  tl.fromTo(destaque3D, { autoAlpha: 0, scale: 0.92, transformOrigin: '50% 50%' },
    { autoAlpha: 1, scale: 1, duration: 0.35, ease: 'power2.out', transformOrigin: '50% 50%' }, 1.95);
  tl.fromTo(confirmacao, { autoAlpha: 0, y: 16 },
    { autoAlpha: 1, y: 0, duration: 0.45, ease: 'power3.out' }, 1.95);
  tl.fromTo(circulo, { scale: 0, transformOrigin: '50% 50%' },
    { scale: 1, duration: 0.24, ease: 'back.out(2)', transformOrigin: '50% 50%' }, 2.04);
  tl.fromTo(check, { strokeDasharray: checkLen + ' ' + (checkLen + 2), strokeDashoffset: checkLen + 1 },
    { strokeDashoffset: 0, duration: 0.21, ease: 'power1.out' }, 2.16);

  // 2.40–2.75 histórico
  tl.fromTo(historico, { autoAlpha: 0, y: 6 },
    { autoAlpha: 1, y: 0, duration: 0.35, ease: 'power2.out' }, 2.40);

  // 3.20–3.50 saída suave
  tl.to(titulo.concat([diagrama, destaque2E, destaque3D, $('s4-movimento'), confirmacao, historico]),
    { autoAlpha: 0, y: -6, duration: 0.30, ease: 'sine.inOut' }, 3.20);
});
