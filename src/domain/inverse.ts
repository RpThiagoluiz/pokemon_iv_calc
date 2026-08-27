import { EXPONENTS, SOLUTION_COUNT_CAP } from '../config/formula.config'
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
): number[] {
  const k = statFactor(stat, level, quality)
  if (!Number.isFinite(k) || k <= 0) return []

  const lo = ((displayedStat - 0.5) / k - base) / 2
  const hi = ((displayedStat + 0.5) / k - base) / 2

  // Margem de 1 em cada lado apenas para varrer; o filtro real é a reconstrução.
  const from = Math.max(GROWTH_MIN, Math.floor(lo) - 1)
  const to = Math.min(GROWTH_MAX, Math.ceil(hi) + 1)

  const values: number[] = []
  for (let g = from; g <= to; g++) {
    if (calcStat(stat, base, g, level, quality) === displayedStat) values.push(g)
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
/** Resolve para UM valor exato de quality. É o núcleo; a janela chama isto. */
function solveAtQuality(input: SpecimenInput, quality: number): SolveResult {
  const { baseStats, level, stats, ivTotal } = input

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
    candidateGrowths(key, baseStats[key], stats[key], level, quality),
  )

  const impossibleStats = STAT_KEYS.filter((_, i) => sets[i].length === 0)
  if (impossibleStats.length > 0) {
    const labels = impossibleStats.map((key) => STAT_LABELS[key]).join(', ')
    return failure(
      `Nenhum growth de ${GROWTH_MIN} a ${GROWTH_MAX} reproduz o valor de ${labels}. ` +
        'Confira o que digitou. Se estiver tudo certo, o mais provável é que os base ' +
        'stats desta espécie no jogo sejam diferentes dos da PokeAPI — dá para ' +
        'corrigi-los no painel Pokémon, acima.',
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

  /*
   * Com a quality fixa e sem restrição de soma, os stats são independentes,
   * então somar mínimos e máximos dá a faixa real. Com o IV total informado,
   * toda solução soma exatamente ele.
   */
  const totalRange =
    ivTotal !== null ? { min: ivTotal, max: ivTotal } : ivTotalRange(growths)

  return {
    status: count === 1 ? 'exact' : 'ambiguous',
    growths,
    solutionCount: count,
    impossibleStats: [],
    reason: null,
    qualityRange: { min: quality, max: quality },
    ivTotalRange: totalRange,
  }
}

function failure(reason: string, impossibleStats: StatKey[] = []): SolveResult {
  return {
    status: 'noSolution',
    growths: null,
    solutionCount: 0,
    impossibleStats,
    reason,
    qualityRange: null,
    ivTotalRange: null,
  }
}

/** Soma dos mínimos e dos máximos das faixas — o IV total possível. */
export function ivTotalRange(growths: Stats<GrowthRange>): { min: number; max: number } {
  return STAT_KEYS.reduce(
    (acc, key) => ({ min: acc.min + growths[key].min, max: acc.max + growths[key].max }),
    { min: 0, max: 0 },
  )
}

/**
 * Janela de quality implícita no número que o jogo mostrou.
 *
 * "1.56" com 2 casas significa qualquer valor em [1.555, 1.565).
 */
export function qualityWindow(
  quality: number,
  decimals: number | null | undefined,
): { min: number; max: number } {
  if (decimals == null || !Number.isFinite(decimals) || decimals < 0) {
    return { min: quality, max: quality }
  }
  const meia = 0.5 * Math.pow(10, -decimals)
  return { min: Math.max(0, quality - meia), max: quality + meia }
}

/**
 * Fronteiras onde algum stat muda de growth viável dentro da janela.
 *
 * Entre duas fronteiras consecutivas o conjunto de candidatos é constante, então
 * basta resolver uma vez por sub-intervalo. Isso é exato — amostrar a janela num
 * passo fixo perderia faixas estreitas, e elas são justamente o caso comum.
 */
function qualityBreakpoints(input: SpecimenInput, janela: { min: number; max: number }): number[] {
  const { baseStats, level, stats } = input
  const pontos = new Set<number>([janela.min, janela.max])

  for (const key of STAT_KEYS) {
    const e = EXPONENTS[key]
    const L = level / 100
    for (let g = GROWTH_MIN; g <= GROWTH_MAX; g++) {
      const corpo = (baseStats[key] + 2 * g) * L
      if (corpo <= 0) continue
      // round(corpo · q^e) = S  =>  q = ((S ± 0.5)/corpo)^(1/e)
      for (const alvo of [stats[key] - 0.5, stats[key] + 0.5]) {
        const razao = alvo / corpo
        if (razao <= 0) continue
        const q = Math.pow(razao, 1 / e)
        if (q > janela.min && q < janela.max) pontos.add(q)
      }
    }
  }
  return [...pontos].sort((a, b) => a - b)
}

/**
 * Descobre os growths a partir dos stats exibidos.
 *
 * Quando `qualityDecimals` é informado, varre a janela de arredondamento da
 * quality: o jogo mostra "1.56" para qualquer valor em [1.555, 1.565), e como a
 * quality é elevada a um expoente esse erro desloca os stats em ±1. Cravar o
 * valor exibido faz espécimes perfeitamente válidos parecerem impossíveis.
 *
 * O resultado une os growths viáveis de toda a janela e devolve, em
 * `qualityRange`, a faixa de quality que de fato explica os stats — quase sempre
 * mais precisa do que a que o jogo mostrou.
 */
export function solveGrowths(input: SpecimenInput): SolveResult {
  const janela = qualityWindow(input.quality, input.qualityDecimals)
  if (janela.min === janela.max) return solveAtQuality(input, input.quality)

  const fronteiras = qualityBreakpoints(input, janela)
  const uniao = {} as Stats<Set<number>>
  for (const key of STAT_KEYS) uniao[key] = new Set<number>()

  let total = 0
  let qMin = Infinity
  let qMax = -Infinity
  let ivMin = Infinity
  let ivMax = -Infinity
  let ultimaFalha: SolveResult | null = null

  for (let i = 0; i < fronteiras.length - 1; i++) {
    const meio = (fronteiras[i] + fronteiras[i + 1]) / 2
    const r = solveAtQuality(input, meio)
    if (r.status === 'noSolution' || !r.growths) {
      ultimaFalha ??= r
      continue
    }
    total = Math.min(SOLUTION_COUNT_CAP, total + r.solutionCount)
    qMin = Math.min(qMin, fronteiras[i])
    qMax = Math.max(qMax, fronteiras[i + 1])
    // A faixa de total vem de cada sub-intervalo, onde ela é exata. Recalcular
    // no fim a partir da união por stat misturaria growths de qualitys
    // diferentes e produziria totais que nenhuma solução atinge.
    if (r.ivTotalRange) {
      ivMin = Math.min(ivMin, r.ivTotalRange.min)
      ivMax = Math.max(ivMax, r.ivTotalRange.max)
    }
    for (const key of STAT_KEYS) for (const g of r.growths[key].values) uniao[key].add(g)
  }

  if (total === 0) {
    return ultimaFalha ?? failure('Nenhuma quality dentro da precisão exibida explica esses stats.')
  }

  const growths = {} as Stats<GrowthRange>
  for (const key of STAT_KEYS) {
    const values = [...uniao[key]].sort((a, b) => a - b)
    growths[key] = { min: values[0], max: values[values.length - 1], values }
  }

  return {
    status: total === 1 ? 'exact' : 'ambiguous',
    growths,
    solutionCount: total,
    impossibleStats: [],
    reason: null,
    qualityRange: { min: qMin, max: qMax },
    ivTotalRange: { min: ivMin, max: ivMax },
  }
}
