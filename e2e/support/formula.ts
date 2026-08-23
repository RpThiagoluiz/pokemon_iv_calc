/**
 * Reimplementação deliberada da fórmula do jogo.
 *
 * Os testes e2e geram os stats a partir de growths conhecidos e depois cobram
 * do app que ele recupere exatamente esses growths. Se importássemos
 * `src/domain/formula.ts` aqui, um erro na fórmula se cancelaria na ida e na
 * volta e o teste passaria feliz. Duplicar estas quatro linhas é o preço de um
 * round-trip que realmente prova algo.
 *
 * A matemática em si já é coberta por `tests/formula.test.ts` no Vitest.
 */

export type StatKey = 'hp' | 'atk' | 'def' | 'spa' | 'spd' | 'spe'
export type Stats = Record<StatKey, number>

export const STAT_KEYS: StatKey[] = ['hp', 'atk', 'def', 'spa', 'spd', 'spe']

export const STAT_LABELS: Record<StatKey, string> = {
  hp: 'HP',
  atk: 'Atk',
  def: 'Def',
  spa: 'SpA',
  spd: 'SpD',
  spe: 'Vel',
}

export const EXPONENTS: Record<'official' | 'discord', Stats> = {
  official: { hp: 1, atk: 1, def: 1, spa: 1, spd: 1, spe: 1 },
  discord: { hp: 0.95, atk: 0.8, def: 0.8, spa: 0.8, spd: 0.8, spe: 0.95 },
}

export type FormulaMode = keyof typeof EXPONENTS

/** stat = round( (base + 2·growth) × (level/100) × quality^exp ) */
export function statOf(
  key: StatKey,
  base: number,
  growth: number,
  level: number,
  quality: number,
  mode: FormulaMode = 'discord',
): number {
  return Math.round((base + 2 * growth) * (level / 100) * Math.pow(quality, EXPONENTS[mode][key]))
}

export function statsOf(
  baseStats: Stats,
  growths: Stats,
  level: number,
  quality: number,
  mode: FormulaMode = 'discord',
): Stats {
  return Object.fromEntries(
    STAT_KEYS.map((key) => [key, statOf(key, baseStats[key], growths[key], level, quality, mode)]),
  ) as Stats
}

export function ivTotalOf(growths: Stats): number {
  return STAT_KEYS.reduce((acc, key) => acc + growths[key], 0)
}

export function fill(value: number): Stats {
  return Object.fromEntries(STAT_KEYS.map((key) => [key, value])) as Stats
}

export function growths(values: [number, number, number, number, number, number]): Stats {
  return Object.fromEntries(STAT_KEYS.map((key, i) => [key, values[i]])) as Stats
}
