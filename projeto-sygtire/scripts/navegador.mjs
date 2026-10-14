// Chromium configurado para captura determinística.
//
// --disable-partial-raster: sem ela o Chromium reaproveita tiles já rasterizados e, em elementos
// com sombra ou desfoque, deixa resíduos de quadros anteriores (até ~100 níveis); o mesmo frame
// saía diferente conforme a ordem de captura. Com ela, cada frame é idêntico em qualquer ordem.
// --force-color-profile=srgb: saída em sRGB, igual ao perfil da fotografia, em qualquer máquina.
import { chromium } from 'playwright';

export const ARGUMENTOS_CHROMIUM = ['--disable-partial-raster', '--force-color-profile=srgb'];

export function abrirNavegador() {
  return chromium.launch({ args: ARGUMENTOS_CHROMIUM });
}
