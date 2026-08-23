import {
  GRADE_BANDS,
  GRADE_ORDER,
  KEY_STAT_WEIGHT_THRESHOLD,
  PERFECT_ROLL_MIN_COUNT,
  WEIGHT_GAMMA,
  type Grade,
} from '../config/grade.config'
import {
  GROWTH_MAX,
  GROWTH_MIN,
  STAT_KEYS,
  type GrowthRange,
  type StatKey,
  type Stats,
} from './types'

/**
 * Pesos derivados do formato dos base stats: a espécie declara seu papel pela
 * própria distribuição. `w_i = (base_i / max(base))^γ`.
 *
 * γ alto concentra o peso nos stats dominantes — com γ=3, um stat com metade
 * do base do maior pesa 1/8, que é a intenção (o Atk do Alakazam vira ruído).
 */
export function autoWeights(baseStats: Stats, gamma: number = WEIGHT_GAMMA): Stats {
  const max = Math.max(...STAT_KEYS.map((key) => baseStats[key]))
  const out = {} as Stats
  for (const key of STAT_KEYS) {
    out[key] = max > 0 ? Math.pow(baseStats[key] / max, gamma) : 0
  }
  return out
}

/**
 * Score de 0 a 1: quão bem os IVs caíram nos stats que importam.
 * A normalização é `(g − 1) / 31` porque o piso real do growth é 1, não 0.
 */
export function gradeScore(growths: Stats, weights: Stats): number {
  const span = GROWTH_MAX - GROWTH_MIN
  let weighted = 0
  let totalWeight = 0
  for (const key of STAT_KEYS) {
    const w = weights[key]
    totalWeight += w
    weighted += w * ((growths[key] - GROWTH_MIN) / span)
  }
  if (totalWeight <= 0) return 0
  return weighted / totalWeight
}

export function gradeLabel(score: number): Grade {
  for (const band of GRADE_BANDS) {
    if (score >= band.min) return band.grade
  }
  return 'D'
}

/** Stats "principais" da espécie: os que o peso marca como decisivos. */
export function keyStats(weights: Stats): StatKey[] {
  return STAT_KEYS.filter((key) => weights[key] >= KEY_STAT_WEIGHT_THRESHOLD)
}

export interface PerfectRolls {
  /** Stats principais com growth confirmadamente em 32. */
  stats: StatKey[]
  /** Stats principais que ainda PODEM ser 32, mas estão ambíguos. */
  possible: StatKey[]
  /** Acende a tag: 2+ IVs perfeitos no lugar certo, num Pokémon que não é SS. */
  qualifies: boolean
}

/**
 * Detecta IVs perfeitos caídos nos stats que importam.
 *
 * Existe porque o score é uma média ponderada e, por isso, não distingue um
 * "B espalhado" de um "B com dois 32 no lugar certo" — que na prática é um
 * Pokémon bem melhor. A tag recupera essa informação que a média apaga.
 *
 * Só conta 32 confirmado (`min === 32`); um stat ainda ambíguo entra em
 * `possible`, para não prometer um roll perfeito que pode não existir.
 */
export function perfectKeyRolls(
  growths: Stats<GrowthRange>,
  weights: Stats,
  grade: Grade,
): PerfectRolls {
  const keys = keyStats(weights)
  const stats = keys.filter((key) => growths[key].min === GROWTH_MAX)
  const possible = keys.filter(
    (key) => growths[key].min < GROWTH_MAX && growths[key].max === GROWTH_MAX,
  )
  return {
    stats,
    possible,
    // Em SS a tag seria ruído: o grade já diz tudo.
    qualifies: stats.length >= PERFECT_ROLL_MIN_COUNT && gradeRank(grade) < gradeRank('SS'),
  }
}

export interface GradeResult {
  /** Score do cenário mais pessimista compatível com a solução. */
  minScore: number
  /** Score do cenário mais otimista compatível com a solução. */
  maxScore: number
  minGrade: Grade
  maxGrade: Grade
  /** `true` quando a inversão foi ambígua e o grade é um intervalo. */
  isRange: boolean
  /** Ex.: `"A"` ou `"B–A"`. */
  label: string
  /** IVs perfeitos caídos nos stats principais — o que a média ponderada apaga. */
  perfectRolls: PerfectRolls
}

/**
 * Grade a partir das faixas devolvidas pelo solver.
 *
 * Quando há ambiguidade, avalia o score no piso e no teto de cada faixa. Os
 * dois extremos podem não ser conjuntamente atingíveis sob a restrição de
 * soma, então o intervalo é um limite (nunca estreito demais) — e é exibido
 * como intervalo em vez de fingir precisão que não existe.
 */
export function gradeFromRanges(
  growths: Stats<GrowthRange>,
  weights: Stats,
): GradeResult {
  const mins = {} as Stats
  const maxes = {} as Stats
  for (const key of STAT_KEYS) {
    mins[key] = growths[key].min
    maxes[key] = growths[key].max
  }

  const minScore = gradeScore(mins, weights)
  const maxScore = gradeScore(maxes, weights)
  const minGrade = gradeLabel(minScore)
  const maxGrade = gradeLabel(maxScore)
  const isRange = minGrade !== maxGrade

  return {
    minScore,
    maxScore,
    minGrade,
    maxGrade,
    isRange,
    label: isRange ? `${minGrade}–${maxGrade}` : minGrade,
    // Usa o grade otimista: se o teto já é SS, a tag não acrescenta nada.
    perfectRolls: perfectKeyRolls(growths, weights, maxGrade),
  }
}

/** Índice na escala D→SS, para ordenar e comparar espécimes. */
export function gradeRank(grade: Grade): number {
  return GRADE_ORDER.indexOf(grade)
}
