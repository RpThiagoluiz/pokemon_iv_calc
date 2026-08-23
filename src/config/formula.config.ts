import type { FormulaMode, Stats } from '../domain/types'

/**
 * Expoente aplicado a `quality` em cada stat.
 *
 * `official` reproduz a fórmula publicada em pokepedia/systems/power, onde a
 * quality multiplica o stat diretamente (expoente 1).
 *
 * `discord` reproduz a hipótese levantada por um dev na comunidade: expoentes
 * distintos por stat, obtidos por simulação. NÃO é oficial — só altere estes
 * números com validação contra espécimes reais (ver .claude/skills/poke-formula).
 */
export const EXPONENTS: Record<FormulaMode, Stats> = {
  official: { hp: 1, atk: 1, def: 1, spa: 1, spd: 1, spe: 1 },
  discord: { hp: 0.95, atk: 0.8, def: 0.8, spa: 0.8, spd: 0.8, spe: 0.95 },
}

export const FORMULA_MODE_LABELS: Record<FormulaMode, string> = {
  official: 'Oficial (× quality)',
  discord: 'Discord (quality^exp)',
}

export const FORMULA_MODE_HINTS: Record<FormulaMode, string> = {
  official: 'Fórmula publicada no pokepedia: a quality multiplica cada stat diretamente.',
  discord: 'Hipótese da comunidade: expoente 0,95 para HP e Vel; 0,80 para os demais.',
}

export const DEFAULT_FORMULA_MODE: FormulaMode = 'discord'

/** Teto de contagem de soluções no solver, para não estourar em casos degenerados. */
export const SOLUTION_COUNT_CAP = 1_000_000
