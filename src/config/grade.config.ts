export type Grade = 'D' | 'C' | 'B' | 'A' | 'A+' | 'S' | 'SS'

/**
 * Expoente que concentra os pesos nos stats dominantes da espécie.
 * w_i = (base_i / max(base))^GAMMA
 */
export const WEIGHT_GAMMA = 3

/** Bandas do grade, do maior para o menor. A última é o piso e sempre casa. */
export const GRADE_BANDS: ReadonlyArray<{ min: number; grade: Grade }> = [
  { min: 0.95, grade: 'SS' },
  { min: 0.88, grade: 'S' },
  { min: 0.8, grade: 'A+' },
  { min: 0.7, grade: 'A' },
  { min: 0.55, grade: 'B' },
  { min: 0.35, grade: 'C' },
  { min: 0, grade: 'D' },
]

/** Ordem crescente, usada para comparar e montar intervalos de grade. */
export const GRADE_ORDER: readonly Grade[] = ['D', 'C', 'B', 'A', 'A+', 'S', 'SS']

/**
 * Peso mínimo para um stat contar como "principal" da espécie.
 *
 * Com γ=3, peso 0,5 equivale a um base stat de ~79% do maior — o suficiente
 * para pegar SpA e Vel de um sweeper especial e deixar SpD (0,35) de fora.
 */
export const KEY_STAT_WEIGHT_THRESHOLD = 0.5

/** Quantos IVs perfeitos em stats principais acendem a tag de destaque. */
export const PERFECT_ROLL_MIN_COUNT = 2

/** Cor por grade, aplicada nos cards da UI. */
export const GRADE_COLORS: Record<Grade, string> = {
  D: '#6b7280',
  C: '#94a3b8',
  B: '#38bdf8',
  A: '#34d399',
  'A+': '#a3e635',
  S: '#fbbf24',
  SS: '#f472b6',
}
