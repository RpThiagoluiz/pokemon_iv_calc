import { describe, expect, it } from 'vitest'
import { qualityWindow, solveGrowths } from '../src/domain/inverse'
import { STAT_KEYS, type SpecimenInput, type Stats } from '../src/domain/types'

/**
 * Espécimes REAIS do jogo (tests/fixtures/specimens.json).
 *
 * Eles quase mataram a hipótese de expoente: com a quality cravada no valor
 * exibido, quatro stats do Cloyster e dois do Vileplume ficavam impossíveis.
 * A causa era o jogo arredondar a quality — 0,3% de erro nela vira ±1 no stat.
 *
 * Este teste existe para essa regressão nunca voltar.
 */
const CLOYSTER: SpecimenInput = {
  baseStats: { hp: 50, atk: 95, def: 180, spa: 85, spd: 45, spe: 70 },
  level: 119,
  quality: 1.56,
  qualityDecimals: 2,
  stats: { hp: 193, atk: 243, def: 361, spa: 203, spd: 131, spe: 197 },
  ivTotal: null,
}

const VILEPLUME: SpecimenInput = {
  baseStats: { hp: 75, atk: 80, def: 85, spa: 110, spd: 90, spe: 50 },
  level: 70,
  quality: 1.51,
  qualityDecimals: 2,
  stats: { hp: 107, atk: 132, def: 93, spa: 129, spd: 105, spe: 104 },
  ivTotal: null,
}

const soma = (g: Stats) => STAT_KEYS.reduce((t, k) => t + g[k], 0)

describe('qualityWindow', () => {
  it('duas casas viram ±0,005', () => {
    const j = qualityWindow(1.56, 2)
    expect(j.min).toBeCloseTo(1.555, 10)
    expect(j.max).toBeCloseTo(1.565, 10)
  })

  it('sem casas informadas, trata como exato', () => {
    expect(qualityWindow(1.56, null)).toEqual({ min: 1.56, max: 1.56 })
    expect(qualityWindow(1.56, undefined)).toEqual({ min: 1.56, max: 1.56 })
  })

  it('nunca deixa a quality ficar negativa', () => {
    expect(qualityWindow(0.001, 1).min).toBe(0)
  })
})

describe('Cloyster real (lv 119, quality exibida 1.56)', () => {
  it('cravar a quality exibida torna quatro stats impossíveis', () => {
    const r = solveGrowths({ ...CLOYSTER, qualityDecimals: null })
    expect(r.status).toBe('noSolution')
    expect(r.impossibleStats).toEqual(['hp', 'def', 'spa', 'spe'])
  })

  it('considerando o arredondamento da quality, resolve', () => {
    const r = solveGrowths(CLOYSTER)
    expect(r.status).not.toBe('noSolution')
    expect(soma(pick(r))).toBe(120)
    expect(pick(r)).toEqual({ hp: 28, atk: 24, def: 16, spa: 17, spd: 16, spe: 19 })
  })

  it('estreita a quality bem além do que o jogo mostra', () => {
    const { min, max } = solveGrowths(CLOYSTER).qualityRange!
    // O jogo diz "1.56" (janela de 0,01); a inversão fecha em menos de um décimo disso.
    expect(min).toBeGreaterThan(1.5637)
    expect(max).toBeLessThanOrEqual(1.565)
    expect(max - min).toBeLessThan(0.002)
  })
})

describe('Vileplume real (lv 70, quality exibida 1.51)', () => {
  it('cravar a quality exibida torna Def e SpA impossíveis', () => {
    const r = solveGrowths({ ...VILEPLUME, qualityDecimals: null })
    expect(r.status).toBe('noSolution')
    expect(r.impossibleStats).toEqual(['def', 'spa'])
  })

  it('considerando o arredondamento, resolve', () => {
    const r = solveGrowths(VILEPLUME)
    expect(r.status).not.toBe('noSolution')
    expect(pick(r)).toEqual({ hp: 14, atk: 28, def: 5, spa: 11, spd: 9, spe: 25 })
    expect(soma(pick(r))).toBe(92)
  })

  it('o IV total verdadeiro é aceito e o falso é rejeitado', () => {
    expect(solveGrowths({ ...VILEPLUME, ivTotal: 92 }).status).not.toBe('noSolution')
    expect(solveGrowths({ ...VILEPLUME, ivTotal: 90 }).status).toBe('noSolution')
  })
})

/** Growths resolvidos, assumindo faixa de um valor só. */
function pick(r: ReturnType<typeof solveGrowths>): Stats {
  const out = {} as Stats
  for (const key of STAT_KEYS) out[key] = r.growths![key].min
  return out
}
