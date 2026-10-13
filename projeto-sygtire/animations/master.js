/*!
 * SygTire — animação institucional
 * master.js — timeline principal GSAP (20 s · 60 fps · 1672 × 941)
 *
 * Regras fixas do projeto:
 *  - #background-fixed é a fotografia original. Nunca recebe tween, transformação,
 *    opacidade, filtro, recorte ou reposicionamento. assertBackgroundIntact() verifica.
 *  - Cada cena anima apenas o conteúdo do próprio grupo <g id="scene-XX-...">.
 *  - Nenhuma camada de cena pinta sobre os logotipos da fotografia: os grupos de cena
 *    recebem o recorte #protecao-logos, que exclui as áreas de LOGO_ZONES.
 *  - Cada grupo de cena só fica visível dentro do próprio intervalo, então uma cena
 *    nunca invade o quadro da seguinte.
 *  - SCENES é a única fonte de verdade dos intervalos das cenas.
 *
 * Ordem de carregamento: vendor/gsap.min.js → master.js → cena-01.js … cena-07.js → SygTire.init()
 */
(function (global) {
  'use strict';

  var DURATION = 20;
  var FPS = 60;
  var TOTAL_FRAMES = Math.round(DURATION * FPS); // 1200
  var BACKGROUND_ID = 'background-fixed';
  var MASTER_SVG_ID = 'sygtire-master';
  var LOGO_CLIP_ID = 'protecao-logos';

  // Logotipos da fotografia original (medidos em fundo-original.png, com 2–4 px de folga).
  var LOGO_ZONES = [
    { name: 'iSat',    x: 60,   y: 799, width: 115, height: 68 },
    { name: 'SygTire', x: 1436, y: 36,  width: 186, height: 90 }
  ];

  // Intervalos reservados, em segundos. Todos caem em frames inteiros a 60 fps.
  var SCENES = [
    { number: 1, id: 'scene-01-abertura',     title: 'Abertura',     start: 0.00,  end: 2.55,  art: 'svg/cena-01.svg' },
    { number: 2, id: 'scene-02-afericao',     title: 'Aferição',     start: 2.55,  end: 5.90,  art: 'svg/cena-02.svg' },
    { number: 3, id: 'scene-03-alertas',      title: 'Alertas',      start: 5.90,  end: 8.90,  art: 'svg/cena-03.svg' },
    { number: 4, id: 'scene-04-acao',         title: 'Ação',         start: 8.90,  end: 11.05, art: 'svg/cena-04.svg' },
    { number: 5, id: 'scene-05-cpk',          title: 'CPK',          start: 11.05, end: 14.10, art: 'svg/cena-05.svg' },
    { number: 6, id: 'scene-06-integracao',   title: 'Integração',   start: 14.10, end: 16.95, art: 'svg/cena-06.svg' },
    { number: 7, id: 'scene-07-encerramento', title: 'Encerramento', start: 16.95, end: 20.00, art: 'svg/cena-07.svg' }
  ];

  var registry = {};
  var listeners = [];
  var svg = null;
  var background = null;
  var master = null;
  var loopEnd = null;

  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function labelOf(scene) { return 'cena-' + pad2(scene.number); }
  function clamp(v, min, max) { return Math.min(max, Math.max(min, v)); }
  // GSAP arredonda o tempo em 1e-7 s; a tolerância evita ler o frame n como n - 1.
  function frameOf(time) { return Math.floor(time * FPS + 1e-3); }

  function findScene(id) {
    for (var i = 0; i < SCENES.length; i++) if (SCENES[i].id === id) return SCENES[i];
    return null;
  }

  function sceneAt(time) {
    for (var i = 0; i < SCENES.length; i++) {
      if (time < SCENES[i].end) return SCENES[i];
    }
    return SCENES[SCENES.length - 1];
  }

  /* ------------------------------------------------------------------ cenas */

  // Chamado por cada animations/cena-XX.js.
  // build(tl, group, scene): tl é a timeline da cena (posição 0 = scene.start no master).
  function registerScene(id, build) {
    if (!findScene(id)) throw new Error('[SygTire] Cena desconhecida: ' + id);
    if (typeof build !== 'function') throw new Error('[SygTire] build inválido para ' + id);
    registry[id] = build;
  }

  // Importa o conteúdo de <g id="scene-XX-..."> de cada svg/cena-XX.svg para o grupo
  // de mesmo id no SVG principal. fetch() não funciona em file://, então nesse caso
  // as artes são ignoradas (hoje os arquivos são placeholders vazios).
  function loadSceneArt() {
    if (global.location.protocol === 'file:') {
      console.info('[SygTire] Aberto via file:// — as artes de svg/cena-XX.svg só são carregadas por HTTP (ex.: npx serve projeto-sygtire).');
      return Promise.resolve();
    }
    return Promise.all(SCENES.map(function (scene) {
      return fetch(scene.art, { cache: 'no-cache' })
        .then(function (res) {
          if (!res.ok) throw new Error(scene.art + ' → HTTP ' + res.status);
          return res.text();
        })
        .then(function (text) {
          var doc = new DOMParser().parseFromString(text, 'image/svg+xml');
          var source = doc.getElementById(scene.id);
          if (!source) throw new Error(scene.art + ' não contém <g id="' + scene.id + '">');
          if (source.querySelector('[id="' + BACKGROUND_ID + '"]')) {
            throw new Error(scene.art + ' não pode conter #' + BACKGROUND_ID);
          }
          var target = document.getElementById(scene.id);
          while (source.firstChild) target.appendChild(document.adoptNode(source.firstChild));
        });
    }));
  }

  // Recorte compartilhado: o quadro inteiro menos as áreas dos logotipos (regra evenodd).
  function protectLogos() {
    var NS = 'http://www.w3.org/2000/svg';
    var vb = svg.viewBox.baseVal;
    var d = 'M0 0H' + vb.width + 'V' + vb.height + 'H0Z';
    LOGO_ZONES.forEach(function (z) {
      d += ' M' + z.x + ' ' + z.y + 'h' + z.width + 'v' + z.height + 'h' + (-z.width) + 'Z';
    });
    var defs = document.createElementNS(NS, 'defs');
    var clip = document.createElementNS(NS, 'clipPath');
    var path = document.createElementNS(NS, 'path');
    clip.setAttribute('id', LOGO_CLIP_ID);
    clip.setAttribute('clipPathUnits', 'userSpaceOnUse');
    path.setAttribute('d', d);
    path.setAttribute('clip-rule', 'evenodd');
    clip.appendChild(path);
    defs.appendChild(clip);
    svg.appendChild(defs);
    SCENES.forEach(function (scene) {
      document.getElementById(scene.id).setAttribute('clip-path', 'url(#' + LOGO_CLIP_ID + ')');
    });
  }

  // Carrega todas as faces declaradas em assets/fonts/fonts.css antes de montar a timeline,
  // para que nenhum frame seja renderizado com fonte substituta.
  function waitForFonts() {
    if (!document.fonts) return Promise.resolve();
    var loads = [];
    document.fonts.forEach(function (face) {
      loads.push(face.load().catch(function () {
        console.warn('[SygTire] Fonte não carregada: ' + face.family + ' ' + face.weight);
      }));
    });
    return Promise.all(loads).then(function () { return document.fonts.ready; });
  }

  /* --------------------------------------------------------------- timeline */

  function buildTimeline() {
    var tl = gsap.timeline({ paused: true, defaults: { ease: 'none' }, onUpdate: emit, onComplete: emit });

    SCENES.forEach(function (scene) {
      var slot = scene.end - scene.start;
      var sceneTl = gsap.timeline();
      var build = registry[scene.id];
      var group = document.getElementById(scene.id);

      // Sem arte importada (ex.: página aberta via file://) a cena fica vazia e não é montada.
      if (build && group.firstElementChild) build(sceneTl, group, scene);
      if (sceneTl.duration() > slot + 1e-6) {
        console.warn('[SygTire] ' + labelOf(scene) + ' dura ' + sceneTl.duration().toFixed(3) +
          ' s e ultrapassa o intervalo reservado de ' + slot.toFixed(2) + ' s.');
      }
      // Reserva o intervalo completo da cena, mesmo enquanto ela estiver vazia.
      sceneTl.set({}, {}, slot);

      tl.addLabel(labelOf(scene), scene.start);
      tl.add(sceneTl, scene.start);
    });
    tl.addLabel('fim', DURATION);

    if (Math.abs(tl.duration() - DURATION) > 1e-6) {
      console.warn('[SygTire] Timeline com ' + tl.duration().toFixed(3) + ' s (esperado ' + DURATION + ' s).');
    }
    return tl;
  }

  /* ------------------------------------------------------- proteção do fundo */

  // Confere que a fotografia continua exatamente como foi inserida.
  // strict = true lança erro (usado na inicialização e na renderização).
  function assertBackgroundIntact(strict) {
    var problems = [];
    var matches = document.querySelectorAll('[id="' + BACKGROUND_ID + '"]');
    var bg = matches[0];

    if (matches.length !== 1) problems.push('esperado 1 #' + BACKGROUND_ID + ', encontrado ' + matches.length);
    if (svg && svg.querySelectorAll('image').length !== 1) {
      problems.push('o SVG principal deve ter apenas uma <image> (a fotografia); encontradas ' + svg.querySelectorAll('image').length);
    }

    if (bg && svg) {
      var vb = svg.viewBox.baseVal;
      if (svg.firstElementChild !== bg) problems.push('o fundo deve ser o primeiro filho do SVG principal (camada inferior)');
      if (bg.getAttribute('x') !== '0' || bg.getAttribute('y') !== '0') problems.push('o fundo deve estar em x=0, y=0');
      if (+bg.getAttribute('width') !== vb.width || +bg.getAttribute('height') !== vb.height) {
        problems.push('o fundo deve ocupar exatamente o viewBox (' + vb.width + ' × ' + vb.height + ')');
      }
      ['transform', 'style', 'class', 'opacity', 'filter', 'mask', 'clip-path', 'visibility', 'display'].forEach(function (attr) {
        if (bg.hasAttribute(attr)) problems.push('atributo proibido no fundo: ' + attr);
      });

      [bg, svg].forEach(function (el) {
        var cs = global.getComputedStyle(el);
        var name = el === bg ? 'fundo' : 'SVG principal';
        if (cs.opacity !== '1') problems.push(name + ' com opacity ' + cs.opacity);
        if (cs.filter !== 'none') problems.push(name + ' com filter ' + cs.filter);
        if (cs.transform !== 'none') problems.push(name + ' com transform ' + cs.transform);
        if (cs.mixBlendMode !== 'normal') problems.push(name + ' com mix-blend-mode ' + cs.mixBlendMode);
        if (cs.clipPath !== 'none') problems.push(name + ' com clip-path ' + cs.clipPath);
        if (cs.visibility !== 'visible' || cs.display === 'none') problems.push(name + ' oculto');
      });

      if (global.gsap && (gsap.getTweensOf(bg).length || gsap.getTweensOf(svg).length)) {
        problems.push('existe tween GSAP aplicado ao fundo ou ao SVG principal');
      }

      SCENES.forEach(function (scene) {
        var group = document.getElementById(scene.id);
        if (!group || group.getAttribute('clip-path') !== 'url(#' + LOGO_CLIP_ID + ')') {
          problems.push(scene.id + ' sem o recorte de proteção dos logotipos');
        }
      });
    }

    if (problems.length) {
      var message = '[SygTire] Fundo original violado:\n - ' + problems.join('\n - ');
      console.error(message);
      if (strict) throw new Error(message);
    }
    return problems;
  }

  function waitForBackground() {
    var img = new Image();
    img.src = background.getAttribute('href');
    return img.decode().then(function () {
      var vb = svg.viewBox.baseVal;
      if (img.naturalWidth !== vb.width || img.naturalHeight !== vb.height) {
        throw new Error('[SygTire] fundo-original.png tem ' + img.naturalWidth + ' × ' + img.naturalHeight +
          ', mas o viewBox é ' + vb.width + ' × ' + vb.height + '.');
      }
    });
  }

  /* --------------------------------------------------------------- controle */

  function getState() {
    var time = master ? master.time() : 0;
    return {
      time: time,
      frame: frameOf(time),
      playing: master ? master.isActive() : false,
      scene: sceneAt(time)
    };
  }

  // Cada grupo de cena só aparece dentro do próprio intervalo [start, end).
  function updateSceneVisibility(time) {
    SCENES.forEach(function (scene) {
      var visible = time >= scene.start - 1e-6 && time < scene.end - 1e-6;
      document.getElementById(scene.id).style.visibility = visible ? 'visible' : 'hidden';
    });
  }

  function emit() {
    if (loopEnd !== null && master && master.isActive() && master.time() >= loopEnd - 1e-6) {
      master.seek(0, false);
    }
    var state = getState();
    updateSceneVisibility(state.time);
    listeners.forEach(function (fn) { fn(state); });
  }

  // Prévia parcial: durante a reprodução, volta a 0 ao atingir `seconds` (null desliga).
  // Não afeta a renderização quadro a quadro.
  function setPreviewLoop(seconds) {
    loopEnd = seconds === null ? null : clamp(seconds, 1 / FPS, DURATION);
  }

  function onUpdate(fn) { listeners.push(fn); }

  function play() {
    if (master.progress() >= 1) master.seek(0);
    master.play();
    emit();
  }

  function pause() {
    master.pause();
    emit();
  }

  function togglePlay() {
    if (master.isActive()) pause(); else play();
  }

  function restart() {
    master.restart();
    emit();
  }

  function seek(seconds) {
    master.seek(clamp(seconds, 0, DURATION), false);
    emit();
  }

  function seekFrame(frame) {
    seek(clamp(Math.round(frame), 0, TOTAL_FRAMES) / FPS);
  }

  function seekScene(number) {
    var scene = SCENES[number - 1];
    if (scene) seek(scene.start);
  }

  /* ----------------------------------------------------------- renderização */

  // Captura quadro a quadro: para n de 0 a TOTAL_FRAMES - 1, await SygTire.render.frame(n)
  // e grave a tela em 1672 × 941 (index.html?render). A timeline fica pausada e é
  // posicionada em n / 60 s, então o resultado não depende do desempenho da máquina.
  var render = {
    fps: FPS,
    totalFrames: TOTAL_FRAMES,
    width: 0,
    height: 0,
    frame: function (n) {
      master.pause();
      master.seek(clamp(n, 0, TOTAL_FRAMES) / FPS, false);
      emit();
      assertBackgroundIntact(true);
      return new Promise(function (resolve) {
        global.requestAnimationFrame(function () { global.requestAnimationFrame(resolve); });
      });
    }
  };

  /* --------------------------------------------------------- inicialização */

  function init() {
    svg = document.getElementById(MASTER_SVG_ID);
    background = document.getElementById(BACKGROUND_ID);
    if (!svg || !background) return Promise.reject(new Error('[SygTire] SVG principal ou #' + BACKGROUND_ID + ' não encontrado.'));

    render.width = svg.viewBox.baseVal.width;
    render.height = svg.viewBox.baseVal.height;
    gsap.ticker.fps(FPS);

    protectLogos();
    api.ready = waitForBackground()
      .then(loadSceneArt)
      .then(waitForFonts)
      .then(function () {
        master = buildTimeline();
        api.timeline = master;
        assertBackgroundIntact(true);
        emit();
        return api;
      });
    return api.ready;
  }

  var api = {
    DURATION: DURATION,
    FPS: FPS,
    TOTAL_FRAMES: TOTAL_FRAMES,
    SCENES: SCENES,
    timeline: null,
    ready: null,
    init: init,
    registerScene: registerScene,
    play: play,
    pause: pause,
    togglePlay: togglePlay,
    restart: restart,
    seek: seek,
    seekFrame: seekFrame,
    seekScene: seekScene,
    getState: getState,
    onUpdate: onUpdate,
    setPreviewLoop: setPreviewLoop,
    LOGO_ZONES: LOGO_ZONES,
    assertBackgroundIntact: assertBackgroundIntact,
    render: render
  };

  global.SygTire = api;
})(window);
