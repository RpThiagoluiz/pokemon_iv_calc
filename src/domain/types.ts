/** Chaves internas dos stats. A ordem é fixa e usada por todo o domínio. */
export const STAT_KEYS = ['hp', 'atk', 'def', 'spa', 'spd', 'spe'] as const

export type StatKey = (typeof STAT_KEYS)[number]

/** Um registro com um valor por stat. */
export type Stats<T = number> = Record<StatKey, T>

/** Labels no padrão exibido pelo jogo (pt-BR). */
export const STAT_LABELS: Stats<string> = {
  hp: 'HP',
  atk: 'Atk',
  def: 'Def',
  spa: 'SpA',
  spd: 'SpD',
  spe: 'Vel',
}

/** Limites do growth (IV individual) definidos na captura. */
export const GROWTH_MIN = 1
export const GROWTH_MAX = 32

/** Soma mínima e máxima possíveis do IV total exibido como `xxx/192`. */
export const IV_TOTAL_MIN = GROWTH_MIN * STAT_KEYS.length
export const IV_TOTAL_MAX = GROWTH_MAX * STAT_KEYS.length

export interface Species {
  id: number
  /** Slug normalizado usado como chave de cache, ex.: `mr-mime`. */
  slug: string
  /** Nome para exibição. */
  name: string
  baseStats: Stats
  types: string[]
  spriteUrl: string | null
  artworkUrl: string | null
}

/** Entrada do inversor: tudo que o usuário lê na tela do jogo. */
export interface SpecimenInput {
  baseStats: Stats
  level: number
  quality: number
  /**
   * Casas decimais com que o jogo exibiu a quality.
   *
   * O jogo arredonda: "1.56" pode ser qualquer coisa em [1.555, 1.565). Como a
   * quality entra na fórmula elevada a um expoente, esse erro de 0,3% desloca
   * os stats em ±1 e faz a inversão não fechar. Informando as casas, o solver
   * procura dentro da janela em vez de cravar o valor exibido.
   *
   * `null` = tratar como valor exato.
   */
  qualityDecimals?: number | null
  /** Stats finais exibidos no jogo. */
  stats: Stats
  /** O `xxx` de `xxx/192`. `null` quando o usuário não quer restringir pela soma. */
  ivTotal: number | null
}

/** Faixa de growths viáveis para um stat. */
export interface GrowthRange {
  min: number
  max: number
  /** Todos os valores inteiros viáveis, em ordem crescente. */
  values: number[]
}

export type SolveStatus = 'exact' | 'ambiguous' | 'noSolution'

export interface SolveResult {
  status: SolveStatus
  /** Faixa viável por stat. Vazia quando `status === 'noSolution'`. */
  growths: Stats<GrowthRange> | null
  /**
   * Número de combinações completas compatíveis com todas as restrições.
   * Saturado em `SOLUTION_COUNT_CAP` para evitar overflow.
   */
  solutionCount: number
  /** Stats cujo valor exibido é incompatível com qualquer growth de 1 a 32. */
  impossibleStats: StatKey[]
  /** Mensagem legível quando algo não fecha. */
  reason: string | null
  /**
   * Faixa de quality que realmente explica os stats — mais precisa que a
   * exibida pelo jogo. `null` quando a quality foi tratada como exata.
   */
  qualityRange: { min: number; max: number } | null
  /**
   * Faixa de IV total das soluções.
   *
   * Vem do solver, e NÃO de somar as faixas por stat: a soma dos mínimos de
   * cada stat não é um total que exista de verdade. Informado o IV total, a
   * faixa colapsa nele — era o bug de exibir 142–155 mesmo com 149 digitado.
   */
  ivTotalRange: { min: number; max: number } | null
}
