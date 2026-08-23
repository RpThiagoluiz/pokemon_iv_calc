import { describe, expect, it } from 'vitest'
import {
  autoWeights,
  gradeFromRanges,
  gradeLabel,
  gradeRank,
  gradeScore,
  keyStats,
  perfectKeyRolls,
} from '../src/domain/grade'
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

describe('keyStats', () => {
  it('pega só os stats decisivos do Alakazam', () => {
    // pesos: spa 1,000 · spe 0,702 · spd 0,348 · hp 0,068 · atk 0,051 · def 0,037
    expect(keyStats(autoWeights(ALAKAZAM))).toEqual(['spa', 'spe'])
  })

  it('espécie uniforme tem todos os stats como principais', () => {
    expect(keyStats(autoWeights(fillStats(80)))).toEqual(STAT_KEYS)
  })
})

describe('perfectKeyRolls', () => {
  const w = autoWeights(ALAKAZAM)

  it('acende com 32 em SpA e Vel num Pokémon que não é SS', () => {
    // 32 em SpA/Vel e 1 no resto → A (77,2%), não SS
    const g = exactRanges(statsOf([1, 1, 1, 32, 1, 32]))
    const result = perfectKeyRolls(g, w, 'A')
    expect(result.stats).toEqual(['spa', 'spe'])
    expect(result.qualifies).toBe(true)
  })

  it('não acende em SS: ali a tag seria ruído', () => {
    const g = exactRanges(fillStats(32))
    expect(perfectKeyRolls(g, w, 'SS').qualifies).toBe(false)
  })

  it('não acende com apenas um 32 no lugar certo', () => {
    const g = exactRanges(statsOf([1, 1, 1, 32, 1, 1]))
    const result = perfectKeyRolls(g, w, 'C')
    expect(result.stats).toEqual(['spa'])
    expect(result.qualifies).toBe(false)
  })

  it('ignora 32 caído em stat irrelevante', () => {
    // 32 em HP/Atk/Def/SpD — nenhum é principal do Alakazam
    const g = exactRanges(statsOf([32, 32, 32, 4, 32, 4]))
    const result = perfectKeyRolls(g, w, 'D')
    expect(result.stats).toEqual([])
    expect(result.qualifies).toBe(false)
  })

  it('32 ainda ambíguo entra em `possible`, não em `stats`', () => {
    const g = exactRanges(statsOf([1, 1, 1, 32, 1, 1]))
    g.spe = { min: 28, max: 32, values: [28, 29, 30, 31, 32] }
    const result = perfectKeyRolls(g, w, 'B')
    expect(result.stats).toEqual(['spa'])
    expect(result.possible).toEqual(['spe'])
    // Não promete um roll perfeito que pode não existir.
    expect(result.qualifies).toBe(false)
  })

  it('pesos manuais redefinem o que é "lugar certo"', () => {
    // Usuário declara Atk/Def como o papel do bicho.
    const custom = statsOf([0, 1, 1, 0, 0, 0])
    const g = exactRanges(statsOf([1, 32, 32, 1, 1, 1]))
    const result = perfectKeyRolls(g, custom, 'B')
    expect(result.stats).toEqual(['atk', 'def'])
    expect(result.qualifies).toBe(true)
  })
})

describe('gradeFromRanges', () => {
  it('faixa exata devolve um grade único, sem intervalo', () => {
    const result = gradeFromRanges(exactRanges(fillStats(32)), autoWeights(ALAKAZAM))
    expect(result.isRange).toBe(false)
    expect(result.label).toBe('SS')
  })

  it('carrega a tag de IVs perfeitos junto com o grade', () => {
    const result = gradeFromRanges(
      exactRanges(statsOf([1, 1, 1, 32, 1, 32])),
      autoWeights(ALAKAZAM),
    )
    expect(result.label).toBe('A')
    expect(result.perfectRolls.qualifies).toBe(true)
    expect(result.perfectRolls.stats).toEqual(['spa', 'spe'])
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
