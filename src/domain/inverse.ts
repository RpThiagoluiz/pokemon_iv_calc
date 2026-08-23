import { SOLUTION_COUNT_CAP } from '../config/formula.config'
import { calcStat, statFactor } from './formula'
import {
  GROWTH_MAX,
  GROWTH_MIN,
  IV_TOTAL_MAX,
  IV_TOTAL_MIN,
  STAT_KEYS,
  STAT_LABELS,
  type GrowthRange,
  type SolveResult,
  type SpecimenInput,
  type StatKey,
  type Stats,
} from './types'

/**
 * Growths de 1 a 32 que reproduzem exatamente o stat exibido.
 *
 * De `round(x) = S` vem `x ∈ [S − 0.5, S + 0.5)`, logo
 * `growth ∈ [ ((S−0.5)/k − base)/2 , ((S+0.5)/k − base)/2 )`.
 *
 * O intervalo analítico só delimita a busca: cada candidato é confirmado
 * rodando a fórmula direta, o que elimina qualquer erro de borda de ponto
 * flutuante sem depender de epsilon.
 */
export function candidateGrowths(
  stat: StatKey,
  base: number,
  displayedStat: number,
  level: number,
  quality: number,
  mode: SpecimenInput['mode'],
): number[] {
  const k = statFactor(stat, level, quality, mode)
  if (!Number.isFinite(k) || k <= 0) return []

  const lo = ((displayedStat - 0.5) / k - base) / 2
  const hi = ((displayedStat + 0.5) / k - base) / 2

  // Margem de 1 em cada lado apenas para varrer; o filtro real é a reconstrução.
  const from = Math.max(GROWTH_MIN, Math.floor(lo) - 1)
  const to = Math.min(GROWTH_MAX, Math.ceil(hi) + 1)

  const values: number[] = []
  for (let g = from; g <= to; g++) {
    if (calcStat(stat, base, g, level, quality, mode) === displayedStat) values.push(g)
  }
  return values
}

function toRange(values: number[]): GrowthRange {
  return { min: values[0], max: values[values.length - 1], values }
}

/** Soma os `n` primeiros/últimos limites para podar a DP. */
function boundsOf(sets: number[][]): { min: number; max: number } {
  return sets.reduce(
    (acc, set) => ({
      min: acc.min + set[0],
      max: acc.max + set[set.length - 1],
    }),
    { min: 0, max: 0 },
  )
}

/**
 * Mantém, em cada conjunto candidato, apenas os valores que participam de ao
 * menos uma combinação somando `ivTotal`, e conta as combinações totais.
 *
 * DP de soma em vez de produto cartesiano: 6 stats × 32 valores × 193 somas,
 * contra até 32^6 combinações na força bruta.
 */
function constrainBySum(
  sets: number[][],
  ivTotal: number,
): { sets: number[][]; count: number } {
  const n = sets.length

  // forward[i][s] = nº de formas dos stats 0..i-1 somarem s.
  const forward: number[][] = Array.from({ length: n + 1 }, () =>
    new Array<number>(ivTotal + 1).fill(0),
  )
  forward[0][0] = 1
  for (let i = 0; i < n; i++) {
    for (let s = 0; s <= ivTotal; s++) {
      const ways = forward[i][s]
      if (ways === 0) continue
      for (const g of sets[i]) {
        const next = s + g
        if (next > ivTotal) break // conjuntos vêm ordenados
        forward[i + 1][next] = Math.min(SOLUTION_COUNT_CAP, forward[i + 1][next] + ways)
      }
    }
  }

  // backward[i][s] = nº de formas dos stats i..n-1 somarem s.
  const backward: number[][] = Array.from({ length: n + 1 }, () =>
    new Array<number>(ivTotal + 1).fill(0),
  )
  backward[n][0] = 1
  for (let i = n - 1; i >= 0; i--) {
    for (let s = 0; s <= ivTotal; s++) {
      const ways = backward[i + 1][s]
      if (ways === 0) continue
      for (const g of sets[i]) {
        const next = s + g
        if (next > ivTotal) break
        backward[i][next] = Math.min(SOLUTION_COUNT_CAP, backward[i][next] + ways)
      }
    }
  }

  const count = backward[0][ivTotal]
  if (count === 0) return { sets: sets.map(() => []), count: 0 }

  const filtered = sets.map((set, i) =>
    set.filter((g) => {
      // Existe prefixo somando s e sufixo somando ivTotal − s − g?
      for (let s = 0; s + g <= ivTotal; s++) {
        if (forward[i][s] > 0 && backward[i + 1][ivTotal - s - g] > 0) return true
      }
      return false
    }),
  )

  return { sets: filtered, count }
}

/**
 * Descobre os growths (IVs individuais) a partir dos stats exibidos no jogo.
 *
 * Quando `ivTotal` é informado, a restrição de soma normalmente colapsa o
 * resultado para uma única combinação. Sem ela, ou em levels baixos (onde o
 * fator `k` é pequeno e os intervalos ficam largos), o resultado é uma faixa
 * por stat — ambiguidade matemática, não falha.
 */
export function solveGrowths(input: SpecimenInput): SolveResult {
  const { baseStats, level, quality, stats, ivTotal, mode } = input

  if (!Number.isFinite(level) || level <= 0) {
    return failure('Informe um level maior que zero.')
  }
  if (!Number.isFinite(quality) || quality <= 0) {
    return failure('Informe uma quality maior que zero.')
  }
  if (ivTotal !== null && (ivTotal < IV_TOTAL_MIN || ivTotal > IV_TOTAL_MAX)) {
    return failure(`O IV total precisa estar entre ${IV_TOTAL_MIN} e ${IV_TOTAL_MAX}.`)
  }

  let sets = STAT_KEYS.map((key) =>
    candidateGrowths(key, baseStats[key], stats[key], level, quality, mode),
  )

  const impossibleStats = STAT_KEYS.filter((_, i) => sets[i].length === 0)
  if (impossibleStats.length > 0) {
    const labels = impossibleStats.map((key) => STAT_LABELS[key]).join(', ')
    return failure(
      `Nenhum growth de ${GROWTH_MIN} a ${GROWTH_MAX} reproduz o valor de ${labels}. ` +
        'Confira o stat digitado, a quality, o level e o modo de fórmula.',
      impossibleStats,
    )
  }

  let count = sets.reduce((acc, set) => Math.min(SOLUTION_COUNT_CAP, acc * set.length), 1)

  if (ivTotal !== null) {
    const { min, max } = boundsOf(sets)
    if (ivTotal < min || ivTotal > max) {
      return failure(
        `Com esses stats o IV total só pode ficar entre ${min} e ${max}, mas você informou ${ivTotal}.`,
      )
    }
    const constrained = constrainBySum(sets, ivTotal)
    if (constrained.count === 0) {
      return failure(
        `Nenhuma combinação de growths compatível com os stats soma exatamente ${ivTotal}.`,
      )
    }
    sets = constrained.sets
    count = constrained.count
  }

  const growths = {} as Stats<GrowthRange>
  STAT_KEYS.forEach((key, i) => {
    growths[key] = toRange(sets[i])
  })

  return {
    status: count === 1 ? 'exact' : 'ambiguous',
    growths,
    solutionCount: count,
    impossibleStats: [],
    reason: null,
  }
}

function failure(reason: string, impossibleStats: StatKey[] = []): SolveResult {
  return {
    status: 'noSolution',
    growths: null,
    solutionCount: 0,
    impossibleStats,
    reason,
  }
}

/** Soma dos mínimos e dos máximos das faixas — o IV total possível. */
export function ivTotalRange(growths: Stats<GrowthRange>): { min: number; max: number } {
  return STAT_KEYS.reduce(
    (acc, key) => ({ min: acc.min + growths[key].min, max: acc.max + growths[key].max }),
    { min: 0, max: 0 },
  )
}
