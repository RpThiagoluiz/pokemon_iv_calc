import { describe, expect, it } from 'vitest'
import { autoWeights, gradeFromRanges, gradeLabel, gradeRank, gradeScore } from '../src/domain/grade'
import { STAT_KEYS, type GrowthRange, type Stats } from '../src/domain/types'
import { ALAKAZAM, VULPIX, fillStats, statsOf } from './helpers'

function exactRanges(growths: Stats): Stats<GrowthRange> {
  const out = {} as Stats<GrowthRange>
  for (const key of STAT_KEYS) {
    out[key] = { min: growths[key], max: growths[key], values: [growths[key]] }
  }
  return out
}

describe('autoWeights', () => {
  it('o maior base stat sempre pesa 1', () => {
    const w = autoWeights(ALAKAZAM)
    expect(w.spa).toBe(1)
  })

  it('γ=3 esmaga os stats irrelevantes do Alakazam', () => {
    const w = autoWeights(ALAKAZAM)
    expect(w.spe).toBeGreaterThan(0.6) // 120/135
    expect(w.atk).toBeLessThan(0.06) // 50/135
    expect(w.def).toBeLessThan(0.04) // 45/135
  })

  it('espécie com base stats uniformes gera pesos uniformes', () => {
    const w = autoWeights(fillStats(80))
    for (const key of STAT_KEYS) expect(w[key]).toBeCloseTo(1, 12)
  })

  it('base stats zerados não quebram (sem divisão por zero)', () => {
    const w = autoWeights(fillStats(0))
    for (const key of STAT_KEYS) expect(w[key]).toBe(0)
  })
})

describe('gradeScore', () => {
  it('growth 32 em tudo é score 1; growth 1 em tudo é score 0', () => {
    const w = autoWeights(VULPIX)
    expect(gradeScore(fillStats(32), w)).toBeCloseTo(1, 12)
    expect(gradeScore(fillStats(1), w)).toBeCloseTo(0, 12)
  })

  it('pesos todos zerados devolvem 0 em vez de NaN', () => {
    expect(gradeScore(fillStats(32), fillStats(0))).toBe(0)
  })

  it('IV concentrado nos stats certos vale mais que IV total alto', () => {
    const w = autoWeights(ALAKAZAM)
    // 32 em SpA/Vel, 1 no resto → IV total 70
    const focado = statsOf([1, 1, 1, 32, 1, 32])
    // 32 em Atk/Def/HP/SpD, 1 em SpA/Vel → IV total 130
    const desperdicado = statsOf([32, 32, 32, 1, 32, 1])
    expect(gradeScore(focado, w)).toBeGreaterThan(gradeScore(desperdicado, w))
  })
})

describe('gradeLabel — âncoras de caracterização', () => {
  it('perfeito é SS e mínimo é D', () => {
    const w = autoWeights(ALAKAZAM)
    expect(gradeLabel(gradeScore(fillStats(32), w))).toBe('SS')
    expect(gradeLabel(gradeScore(fillStats(1), w))).toBe('D')
  })

  it('o caso do usuário: 32 nos stats irrelevantes e fraco em SpA/Vel cai para C ou D', () => {
    const w = autoWeights(ALAKAZAM)
    const grade = gradeLabel(gradeScore(statsOf([32, 32, 32, 4, 32, 4]), w))
    expect(['C', 'D']).toContain(grade)
  })

  it('as bandas cobrem toda a faixa e são monotônicas', () => {
    let last = -1
    for (let s = 0; s <= 1.0001; s += 0.01) {
      const rank = gradeRank(gradeLabel(Math.min(s, 1)))
      expect(rank).toBeGreaterThanOrEqual(last)
      last = rank
    }
  })
})

describe('gradeFromRanges', () => {
  it('faixa exata devolve um grade único, sem intervalo', () => {
    const result = gradeFromRanges(exactRanges(fillStats(32)), autoWeights(ALAKAZAM))
    expect(result.isRange).toBe(false)
    expect(result.label).toBe('SS')
  })

  it('faixa ampla devolve um intervalo de grade', () => {
    const w = autoWeights(ALAKAZAM)
    const ranges = {} as Stats<GrowthRange>
    for (const key of STAT_KEYS) ranges[key] = { min: 1, max: 32, values: [1, 32] }
    const result = gradeFromRanges(ranges, w)
    expect(result.isRange).toBe(true)
    expect(result.label).toBe('D–SS')
    expect(result.minScore).toBeLessThan(result.maxScore)
  })
})
