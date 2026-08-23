import { EXPONENTS } from '../config/formula.config'
import { STAT_KEYS, type StatKey, type Stats } from './types'

/**
 * Fator comum da fórmula para um stat: `(level / 100) × quality^exp`.
 * Isolado porque a inversão precisa dividir por ele.
 */
export function statFactor(stat: StatKey, level: number, quality: number): number {
  return (level / 100) * Math.pow(quality, EXPONENTS[stat])
}

/**
 * stat = round( (base + 2·growth) × (level / 100) × quality^exp )
 */
export function calcStat(
  stat: StatKey,
  base: number,
  growth: number,
  level: number,
  quality: number,
): number {
  return Math.round((base + 2 * growth) * statFactor(stat, level, quality))
}

export function calcAllStats(
  baseStats: Stats,
  growths: Stats,
  level: number,
  quality: number,
): Stats {
  const out = {} as Stats
  for (const key of STAT_KEYS) {
    out[key] = calcStat(key, baseStats[key], growths[key], level, quality)
  }
  return out
}

export function sumStats(stats: Stats): number {
  return STAT_KEYS.reduce((acc, key) => acc + stats[key], 0)
}

/**
 * Power = (HP + Atk + Def + SpA + SpD + Vel) × quality
 */
export function calcPower(stats: Stats, quality: number): number {
  return sumStats(stats) * quality
}
