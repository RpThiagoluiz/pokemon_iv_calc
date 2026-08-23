import { describe, expect, it } from 'vitest'
import { EXPONENTS } from '../src/config/formula.config'
import { calcAllStats, calcPower, calcStat, statFactor, sumStats } from '../src/domain/formula'
import { STAT_KEYS } from '../src/domain/types'
import { VULPIX, fillStats } from './helpers'

describe('statFactor', () => {
  it('quality 1 anula o expoente em qualquer stat', () => {
    for (const key of STAT_KEYS) {
      expect(statFactor(key, 100, 1)).toBeCloseTo(1, 12)
    }
  })

  it('usa 0,95 em HP/Vel e 0,80 nos demais', () => {
    expect(EXPONENTS.hp).toBe(0.95)
    expect(EXPONENTS.spe).toBe(0.95)
    for (const key of ['atk', 'def', 'spa', 'spd'] as const) {
      expect(EXPONENTS[key]).toBe(0.8)
    }
    expect(statFactor('atk', 100, 1.5)).toBeCloseTo(Math.pow(1.5, 0.8), 12)
    expect(statFactor('hp', 100, 1.5)).toBeCloseTo(Math.pow(1.5, 0.95), 12)
  })

  it('escala linearmente com o level', () => {
    expect(statFactor('hp', 50, 1)).toBeCloseTo(0.5, 12)
  })
})

describe('calcStat', () => {
  it('level 100 e quality 1 devolvem base + 2·growth', () => {
    expect(calcStat('hp', 38, 16, 100, 1)).toBe(38 + 32)
    expect(calcStat('spa', 50, 32, 100, 1)).toBe(50 + 64)
  })

  it('escala linearmente com o level', () => {
    expect(calcStat('atk', 41, 10, 50, 1)).toBe(Math.round((41 + 20) * 0.5))
  })

  it('arredonda o resultado (não trunca)', () => {
    // (13 + 2·1) × 0.25 = 3.75 → 4
    expect(calcStat('def', 13, 1, 25, 1)).toBe(4)
  })
})

describe('calcAllStats', () => {
  it('Vulpix nível 100, quality 1, growth 32 em tudo', () => {
    const stats = calcAllStats(VULPIX, fillStats(32), 100, 1)
    expect(stats).toEqual({ hp: 102, atk: 105, def: 104, spa: 114, spd: 129, spe: 129 })
  })

  it('quality maior nunca reduz um stat', () => {
    const low = calcAllStats(VULPIX, fillStats(16), 80, 1.0)
    const high = calcAllStats(VULPIX, fillStats(16), 80, 1.6)
    for (const key of STAT_KEYS) {
      expect(high[key]).toBeGreaterThanOrEqual(low[key])
    }
  })
})

describe('calcPower', () => {
  it('Power = soma dos stats × quality', () => {
    const stats = calcAllStats(VULPIX, fillStats(32), 100, 1)
    expect(calcPower(stats, 1)).toBe(sumStats(stats))
    expect(calcPower(stats, 1.5)).toBeCloseTo(sumStats(stats) * 1.5, 10)
  })

  it('quality pesa duas vezes: dentro do stat e no Power final', () => {
    const growths = fillStats(16)
    const q1 = calcPower(calcAllStats(VULPIX, growths, 100, 1.0), 1.0)
    const q2 = calcPower(calcAllStats(VULPIX, growths, 100, 1.5), 1.5)
    // Efeito quase quadrático, bem acima do 1.5× de uma multiplicação só.
    expect(q2 / q1).toBeGreaterThan(1.9)
  })
})
