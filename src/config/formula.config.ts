import type { Stats } from '../domain/types'

/**
 * Expoente aplicado a `quality` em cada stat.
 *
 * A fórmula publicada em pokepedia/systems/power não divulga o expoente; estes
 * valores vêm de simulações da comunidade (0,95 para HP e Vel; 0,80 para os
 * demais) e reproduzem os stats observados no jogo.
 *
 * Continuam sendo uma hipótese: só altere estes números com validação contra
 * espécimes reais (ver .claude/skills/poke-formula).
 */
export const EXPONENTS: Stats = {
  hp: 0.95,
  atk: 0.8,
  def: 0.8,
  spa: 0.8,
  spd: 0.8,
  spe: 0.95,
}

/** Teto de contagem de soluções no solver, para não estourar em casos degenerados. */
export const SOLUTION_COUNT_CAP = 1_000_000
