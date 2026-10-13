# SygTire — animação institucional (20 s · 60 fps · 1672 × 941)

Etapa 1: base técnica. Fundo fixo + sete camadas de cena vazias + timeline GSAP.

## Fundo original — intocável

- `assets/referencias/fundo-original-fonte.jpg`: arquivo recebido, byte a byte (SHA-256 `5fd6f82007450f9a1873a36aacf5734c2c61a096dc582bfadbe3a07620fbbc63`).
- `assets/fundo-original.png`: o mesmo JPEG decodificado uma única vez para PNG sem perdas, com o
  perfil ICC sRGB original. Pixels idênticos ao JPEG (diferença 0).
- No SVG ele é um único `<image id="background-fixed">` em `x=0 y=0 width=1672 height=941`,
  primeiro filho do SVG (camada inferior), sem `transform`, `opacity`, `filter`, `mask`,
  `clip-path` ou `style`. Nenhum tween GSAP pode mirar o fundo nem o `<svg>` raiz.
- `SygTire.assertBackgroundIntact()` confere tudo isso na inicialização e em cada frame renderizado.

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
- `svg/fundo.svg` é o SVG principal; `index.html` tem uma cópia inline dele (necessária para o GSAP).
  Mudanças em um devem ir para o outro.

## Pré-visualização

```sh
npx serve projeto-sygtire        # ou: cd projeto-sygtire && python3 -m http.server
```

Abrir `index.html`. Pelo `file://` a página funciona, mas as artes de `svg/cena-XX.svg` só são
carregadas via HTTP. O GSAP 3.13.0 está em `animations/vendor/` (sem dependência de CDN).

Atalhos: espaço (play/pause), ←/→ (1 frame), Shift + ←/→ (1 s), Home (início), 1–7 (início da cena).

## Renderização a 60 fps

`index.html?render` mostra só o palco, em 1672 × 941 nativos. Para cada frame `n` de 0 a 1199:
`await SygTire.render.frame(n)` e capturar a tela (ex.: Playwright com `deviceScaleFactor: 1`).
A timeline fica pausada e é posicionada em `n / 60` s, então a captura não depende do desempenho.

Atenção: 941 px de altura é ímpar. MP4 H.264 `yuv420p` (o formato comum para web e redes) exige
dimensões pares; sequência PNG, ProRes 4444 ou H.264 `yuv444p` aceitam 1672 × 941 sem alterar a imagem.
