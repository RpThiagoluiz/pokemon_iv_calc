import type { StatKey } from '../domain/types'

/**
 * Paleta categórica dos gráficos.
 *
 * São os seis primeiros slots da paleta de referência da skill `dataviz`, na
 * variante escura. Validados com `scripts/validate_palette.js` contra a
 * superfície deste app (`#121829`), não escolhidos a olho:
 *
 *   Faixa de luminosidade  ok — as 6 dentro de L 0,48–0,67
 *   Piso de croma          ok — as 6 >= 0,1
 *   Separação CVD          ok — pior par adjacente ΔE 8,4 (protanopia)
 *   Piso de visão normal   ok — pior par adjacente ΔE 19,3
 *   Contraste na superfície ok — as 6 >= 3:1
 *
 * A ORDEM É FIXA. Nunca recicle nem gere um sétimo tom: a cor segue o stat, e
 * um stat sempre tem a mesma cor em todo gráfico do app. Trocou alguma? Rode o
 * validador de novo antes.
 *
 * A cor nunca é o único sinal — a legenda escreve o nome do stat.
 */
export const SERIES_COLORS: Record<StatKey, string> = {
  hp: '#3987e5',
  atk: '#d95926',
  def: '#199e70',
  spa: '#c98500',
  spd: '#d55181',
  spe: '#008300',
}

/** Cor da curva de Power — série única, então usa o slot 1. */
export const POWER_COLOR = '#3987e5'

/** Geometria compartilhada pelos gráficos (px). */
export const CHART = {
  /** Altura da área de plotagem, sem contar o eixo x. */
  plotHeight: 180,
  /** Faixa reservada aos rótulos do eixo x — fora dela o rótulo é cortado. */
  axisHeight: 26,
  /** Espaço à esquerda para os rótulos do eixo y. */
  gutter: 46,
  paddingRight: 12,
  paddingTop: 10,
  /** Linhas de grade horizontais. */
  gridLines: 4,
  strokeWidth: 2,
} as const
