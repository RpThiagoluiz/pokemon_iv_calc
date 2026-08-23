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

/**
 * Modo de fórmula.
 * - `official`: expoente 1 em todos os stats (fórmula publicada no pokepedia).
 * - `discord`: 0.95 em HP/Vel e 0.80 nos demais (hipótese da comunidade, não confirmada).
 */
export type FormulaMode = 'official' | 'discord'

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
  /** Stats finais exibidos no jogo. */
  stats: Stats
  /** O `xxx` de `xxx/192`. `null` quando o usuário não quer restringir pela soma. */
  ivTotal: number | null
  mode: FormulaMode
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
}
