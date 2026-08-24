import { calcAllStats, calcPower } from './formula'
import { STAT_KEYS, type GrowthRange, type Stats } from './types'

/**
 * O jogo NÃO tem teto de level, então a projeção também não impõe um.
 *
 * Este número é só uma trava de sanidade contra entrada absurda (ou colada por
 * engano), que de outro modo geraria um laço gigantesco. Não é regra de
 * produto: ninguém joga perto disso.
 */
export const PROJECTION_SAFETY_LEVEL = 100_000

/** Distância entre os marcos exibidos. */
export const PROJECTION_STEP = 20

/**
 * Teto de pontos no gráfico.
 *
 * Sem isto, projetar do level 100 ao 50.000 desenharia 2.500 pontos — lento e
 * ilegível. Passando disso, o passo cresce em múltiplos de `PROJECTION_STEP`,
 * então os marcos continuam sendo "redondos".
 */
export const PROJECTION_MAX_POINTS = 60

/** Quantos marcos além do level atual entram nos cartões de leitura rápida. */
export const MILESTONE_COUNT = 2

export interface ProjectionInput {
  baseStats: Stats
  /** Growths resolvidos pelo solver — podem ser faixa quando houve ambiguidade. */
  growths: Stats<GrowthRange>
  /** Faixa de quality apurada. Piso = teto quando ela ficou cravada. */
  quality: { min: number; max: number }
}

export interface ProjectedPoint {
  level: number
  /** Estimativa central: o meio entre o piso e o teto. */
  stats: Stats
  statsMin: Stats
  statsMax: Stats
  power: number
  powerMin: number
  powerMax: number
}

function pick(growths: Stats<GrowthRange>, lado: 'min' | 'max'): Stats {
  const out = {} as Stats
  for (const key of STAT_KEYS) out[key] = growths[key][lado]
  return out
}

function meio(a: Stats, b: Stats): Stats {
  const out = {} as Stats
  for (const key of STAT_KEYS) out[key] = Math.round((a[key] + b[key]) / 2)
  return out
}

export function clampLevel(level: number): number {
  if (!Number.isFinite(level)) return 1
  return Math.min(PROJECTION_SAFETY_LEVEL, Math.max(1, Math.floor(level)))
}

/** Passo que mantém a série legível, arredondado para múltiplo de `base`. */
export function stepFor(span: number, base = PROJECTION_STEP): number {
  const fator = Math.ceil(span / (base * PROJECTION_MAX_POINTS))
  return base * Math.max(1, fator)
}

/**
 * Stats e Power em um level qualquer.
 *
 * O piso e o teto não são estimativa: o stat cresce de forma monótona tanto no
 * growth quanto na quality, então o mínimo real é `growth.min` com
 * `quality.min`, e o máximo é o outro extremo. Quando a inversão saiu exata e a
 * quality ficou cravada, os dois colapsam no mesmo valor e a faixa some.
 */
export function projectAt(input: ProjectionInput, level: number): ProjectedPoint {
  const lvl = clampLevel(level)
  const { baseStats, growths, quality } = input

  const statsMin = calcAllStats(baseStats, pick(growths, 'min'), lvl, quality.min)
  const statsMax = calcAllStats(baseStats, pick(growths, 'max'), lvl, quality.max)

  return {
    level: lvl,
    stats: meio(statsMin, statsMax),
    statsMin,
    statsMax,
    power: (calcPower(statsMin, quality.min) + calcPower(statsMax, quality.max)) / 2,
    powerMin: calcPower(statsMin, quality.min),
    powerMax: calcPower(statsMax, quality.max),
  }
}

/**
 * Série de pontos de `from` até `to`, de `step` em `step`.
 *
 * As duas pontas entram sempre, mesmo que `to` não caia num múltiplo do passo —
 * o level alvo que o usuário escolheu não pode ficar de fora do gráfico.
 */
export function projectSeries(
  input: ProjectionInput,
  from: number,
  to: number,
  step: number = PROJECTION_STEP,
): ProjectedPoint[] {
  const inicio = clampLevel(from)
  const fim = clampLevel(to)
  if (fim <= inicio) return [projectAt(input, inicio)]

  const passo = stepFor(fim - inicio, Math.max(1, Math.floor(step)))
  const niveis: number[] = []
  for (let lvl = inicio; lvl < fim; lvl += passo) niveis.push(lvl)

  /*
   * O alvo entra sempre, mas se o último marco caiu colado nele (999 e 1000,
   * por exemplo) o marco sai: dois pontos vizinhos desenham um trecho achatado
   * no fim do gráfico, que se lê como "parou de crescer".
   */
  const ultimo = niveis[niveis.length - 1]
  if (niveis.length > 1 && fim - ultimo < passo / 2) niveis.pop()
  niveis.push(fim)

  return niveis.map((lvl) => projectAt(input, lvl))
}

/** Level atual mais os próximos marcos. */
export function milestoneLevels(current: number, count = MILESTONE_COUNT): number[] {
  const atual = clampLevel(current)
  const out = [atual]
  for (let i = 1; i <= count; i++) {
    const lvl = atual + i * PROJECTION_STEP
    if (lvl <= PROJECTION_SAFETY_LEVEL) out.push(lvl)
  }
  return out
}

/** Variação percentual do Power em relação ao level atual. */
export function powerGain(atual: ProjectedPoint, futuro: ProjectedPoint): number {
  if (atual.power === 0) return 0
  return (futuro.power / atual.power - 1) * 100
}

/** `true` quando a projeção carrega incerteza — a UI precisa mostrar a faixa. */
export function hasSpread(point: ProjectedPoint): boolean {
  return point.powerMax - point.powerMin > 0.5
}
