import { STAT_KEYS, type Stats } from '../src/domain/types'

/** Base stats reais do Vulpix (PokeAPI): 38/41/40/50/65/65. */
export const VULPIX: Stats = { hp: 38, atk: 41, def: 40, spa: 50, spd: 65, spe: 65 }

/** Alakazam: sweeper especial clássico — SpA e Vel dominam. */
export const ALAKAZAM: Stats = { hp: 55, atk: 50, def: 45, spa: 135, spd: 95, spe: 120 }

export function statsOf(values: number[]): Stats {
  const out = {} as Stats
  STAT_KEYS.forEach((key, i) => {
    out[key] = values[i]
  })
  return out
}

export function fillStats(value: number): Stats {
  return statsOf(new Array(STAT_KEYS.length).fill(value))
}

/** PRNG determinístico (mulberry32) — property tests precisam ser reprodutíveis. */
export function makeRng(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function randomGrowths(rng: () => number): Stats {
  return statsOf(STAT_KEYS.map(() => 1 + Math.floor(rng() * 32)))
}
