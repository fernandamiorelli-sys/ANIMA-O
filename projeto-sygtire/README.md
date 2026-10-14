# SygTire — animação institucional (20 s · 60 fps · 1672 × 941)

Sete cenas vetoriais (SVG + GSAP) sobre a fotografia original, que fica absolutamente estática.

## Entregas

| Item | Onde |
|---|---|
| Vídeo final MP4 (H.264 High 4:4:4, 1672 × 941, 60 fps, 20 s) | `renders/sygtire-20s-1672x941-h264-444.mp4` |
| Versão de compatibilidade (H.264 High 4:2:0, 1672 × 942) | `renders/sygtire-20s-1672x942-h264-420-compativel.mp4` |
| Projeto HTML executável | `index.html` (+ `npm run preview`) |
| SVGs das sete cenas | `svg/cena-01.svg` … `svg/cena-07.svg` (+ `svg/fundo.svg`, o SVG principal) |
| Animações das cenas | `animations/cena-01.js` … `animations/cena-07.js` |
| Timeline GSAP principal | `animations/master.js` |
| Screenshots e relatório de validação | `renders/validacao/` (abrir `index.html` pela pré-visualização) |

### Por que dois MP4

H.264 no modo de cor mais comum (4:2:0) só aceita largura e altura pares, e o fundo tem 941 px de
altura. O vídeo principal usa H.264 High 4:4:4, que aceita as dimensões nativas e ainda preserva a
cor da fotografia sem subamostragem. Ele abre em players baseados no FFmpeg (VLC, mpv), mas
QuickTime, navegadores, redes sociais e alguns editores podem não aceitar H.264 4:4:4. Para esses
casos, a versão compatível usa 4:2:0 com uma linha a mais no rodapé, cópia da última linha da imagem:
nenhum pixel da fotografia é alterado, só é acrescentado 1 px de altura.

## Comandos

```sh
cd projeto-sygtire
npm install                      # Playwright + pngjs (só para renderizar e validar)
npx playwright install chromium  # navegador usado na captura dos frames
npm run preview                  # http://127.0.0.1:8080/index.html
npm run render                   # gera os dois MP4 em renders/ (requer FFmpeg com libx264)
npm run validar                  # gera renders/validacao/ (relatório, screenshots, JSON)
```

`npm run render` captura os 1200 frames de `index.html?render` em PNG (sem perdas), com a timeline
pausada e posicionada em `n / 60` s, e os envia direto ao FFmpeg: a fotografia passa por uma única
compressão. Opções: `--frames renders/frames` (grava também os PNGs), `--crf 10`,
`--crf-compativel 12`, `--ate N` (teste com os N primeiros frames, saída em `renders/teste/`).

## Estrutura

```
projeto-sygtire/
├── index.html                    pré-visualização e palco de renderização (?render)
├── package.json
├── assets/
│   ├── fundo-original.png        fotografia (camada única, intocável)
│   ├── fonts/                    Poppins, Figtree, Barlow Condensed, Montserrat (OFL) + fonts.css
│   └── referencias/              arquivo original recebido + referências das sete cenas
├── svg/
│   ├── fundo.svg                 SVG principal (fotografia + sete grupos de cena)
│   └── cena-01.svg … cena-07.svg
├── animations/
│   ├── master.js                 timeline principal, proteção do fundo e dos logos, API de render
│   ├── cena-01.js … cena-07.js
│   └── vendor/                   GSAP 3.13.0 + MotionPathPlugin
├── scripts/
│   ├── servidor.mjs              servidor estático sem dependências
│   ├── navegador.mjs             Chromium configurado para captura determinística
│   ├── render.mjs                captura dos frames + FFmpeg
│   └── validar.mjs               testes e relatório
└── renders/
    ├── sygtire-20s-1672x941-h264-444.mp4
    ├── sygtire-20s-1672x942-h264-420-compativel.mp4
    └── validacao/
```

## Fundo original — intocável

- `assets/referencias/fundo-original-fonte.jpg`: arquivo recebido, byte a byte (SHA-256 `5fd6f82007450f9a1873a36aacf5734c2c61a096dc582bfadbe3a07620fbbc63`).
- `assets/fundo-original.png`: o mesmo JPEG decodificado uma única vez para PNG sem perdas, com o
  perfil ICC sRGB original. Pixels idênticos ao JPEG (diferença 0).
- No SVG ele é um único `<image id="background-fixed">` em `x=0 y=0 width=1672 height=941`,
  primeiro filho do SVG (camada inferior), sem `transform`, `opacity`, `filter`, `mask`,
  `clip-path` ou `style`. Nenhum tween GSAP pode mirar o fundo nem o `<svg>` raiz.
- `SygTire.assertBackgroundIntact()` confere tudo isso na inicialização e em cada frame renderizado.

## Logotipos da fotografia — nunca cobertos

O master aplica a todos os grupos de cena o recorte `#protecao-logos` (quadro inteiro menos as
áreas de `LOGO_ZONES` em `master.js`): iSat em x 62–172, y 801–864 e SygTire em x 1440–1618,
y 40–121, com folga. Nenhum elemento, sombra ou movimento de cena pinta sobre os logos.

Nas referências 1 e 3 o logo iSat foi desenhado mais abaixo do que está na fotografia, e na
referência 2 ele aparece por cima do celular. Como o logo não muda, as composições foram ajustadas:

- Cena 01: cards com 98 px de altura e 13 px de intervalo (103 px e 18 px na referência).
- Cena 02: celular em escala 0,96 com topo em y = 345, esmaecendo antes do logo (y ≈ 799).
- Cena 03: painel 3 px acima e linhas de alerta com 10 px de intervalo (14 px na referência).
- Cena 05: painel 4 px acima e cards com 10 px de intervalo (17 e 15 px na referência).

## Cenas

| Cena | Grupo | Início → fim | Frames (60 fps) |
|---|---|---|---|
| 01 | `scene-01-abertura` | 0.00 → 2.55 s | 0 → 153 |
| 02 | `scene-02-afericao` | 2.55 → 5.90 s | 153 → 354 |
| 03 | `scene-03-alertas` | 5.90 → 8.90 s | 354 → 534 |
| 04 | `scene-04-acao` | 8.90 → 11.05 s | 534 → 663 |
| 05 | `scene-05-cpk` | 11.05 → 14.10 s | 663 → 846 |
| 06 | `scene-06-integracao` | 14.10 → 16.95 s | 846 → 1017 |
| 07 | `scene-07-encerramento` | 16.95 → 20.00 s | 1017 → 1200 |

Os intervalos ficam só em `animations/master.js` (`SCENES`).

- Arte: `svg/cena-XX.svg`. Todo o conteúdo dentro de `<g id="scene-XX-...">`; o master importa os
  filhos desse grupo para o grupo de mesmo id no SVG principal.
- Movimento: `animations/cena-XX.js` → `SygTire.registerScene(id, function (tl, group, scene) { … })`.
  `tl` começa em 0 no início da cena; o master a posiciona no intervalo reservado.
- Cada `svg/cena-XX.svg` é desenhado no estado final da composição (abrir o arquivo mostra a cena
  montada); as entradas e saídas ficam no `.js`. Elementos animados não têm atributo `transform`
  (o posicionamento estático fica em um grupo interno). Ao usar `transformOrigin` num `fromTo`,
  declare-o também no estado inicial: sem isso o *smoothOrigin* do GSAP deixa uma translação residual.
- Cada grupo de cena só fica visível dentro do próprio intervalo; as saídas terminam no fim dele.
  Exceção: a cena 07 não tem saída e continua visível em t = 20,00 s (o vídeo termina composto).
- Ids pedidos no roteiro: cena 05 `#titulo-cpk`, `#painel-cpk`, `#card-cpk`, `#texto-cpk`,
  `#linha-grafico`, `#ponto-final`, `#card-recapabilidade`, `#barra-recapabilidade`,
  `#card-sucateamento`, `#barra-sucateamento`; cena 06 `#titulo-integracao`, `#card-sagi`,
  `#card-isat`, `#card-sygtire`, `#conexao-sagi`, `#conexao-isat`, `#fluxo-sagi`, `#fluxo-isat`;
  cena 07 `#titulo-final-01`, `#titulo-final-02`, `#assinatura-final`, `#selo-final`, `#detalhes-final`.
- As marcas SAGI, iSat e SygTire dentro dos cards da cena 06 são reconstruções vetoriais
  aproximadas; se houver SVGs oficiais das marcas, substitua os grupos `s6-card-*-icone`/`-marca`.
- Referências: `assets/referencias/cena-XX-referencia.webp`.
- `svg/fundo.svg` é o SVG principal; `index.html` tem uma cópia inline dele (necessária para o GSAP).
  Mudanças em um devem ir para o outro.

## Fontes

`assets/fonts/` (SIL Open Font License): **Poppins** 400–900 nos títulos e textos em caixa-alta,
**Figtree** 400–800 nos textos de interface, **Barlow Condensed** 700 no título do encerramento e
**Montserrat** 400–700 na assinatura e no selo. O master carrega todas antes de montar a timeline.

## Pré-visualização

`npm run preview` (ou qualquer servidor estático na pasta) e abrir `index.html`. Pelo `file://` a
página abre, mas as artes de `svg/cena-XX.svg` só são carregadas via HTTP (a página avisa).
"Repetir" volta ao início ao chegar a 20 s. O GSAP 3.13.0 e o MotionPathPlugin (pontos de fluxo da
cena 06) estão em `animations/vendor/` (sem dependência de CDN).

Atalhos: espaço (play/pause), ←/→ (1 frame), Shift + ←/→ (1 s), Home (início), 1–7 (início da cena).

## Renderização determinística

`index.html?render` mostra só o palco, em 1672 × 941 nativos. `await SygTire.render.frame(n)` pausa a
timeline em `n / 60` s, confere o fundo (`assertBackgroundIntact`) e espera a pintura; o resultado não
depende do desempenho da máquina.

Três cuidados garantem que o mesmo frame saia idêntico em qualquer ordem de captura (verificado
em `npm run validar`, que recaptura os 1200 frames em ordem inversa):

- o Chromium abre com `--disable-partial-raster` (`scripts/navegador.mjs`); sem isso ele reaproveita
  áreas já rasterizadas e, em elementos com sombra ou desfoque, deixa resíduos de quadros anteriores;
- `render.frame()` recria o layout das cenas visíveis antes da captura, porque o Blink não recalcula a
  fonte do texto SVG quando só a escala de um grupo-pai muda;
- os textos usam `text-rendering: geometricPrecision` (CSS de `index.html`): sem *hinting*, a forma das
  letras não depende do cache de glifos e não "treme" em movimento.

Qualquer outra ferramenta de captura deve usar `SygTire.render.frame(n)` e a mesma opção do Chromium.
