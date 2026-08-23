import { describe, expect, it } from 'vitest'
import { calcAllStats } from '../src/domain/formula'
import { candidateGrowths, ivTotalRange, solveGrowths } from '../src/domain/inverse'
import { STAT_KEYS, type FormulaMode, type Stats } from '../src/domain/types'
import { ALAKAZAM, VULPIX, fillStats, makeRng, randomGrowths, statsOf } from './helpers'

function solveFor(
  baseStats: Stats,
  growths: Stats,
  level: number,
  quality: number,
  mode: FormulaMode,
  withTotal = true,
) {
  const stats = calcAllStats(baseStats, growths, level, quality, mode)
  const ivTotal = STAT_KEYS.reduce((acc, key) => acc + growths[key], 0)
  return solveGrowths({
    baseStats,
    level,
    quality,
    stats,
    ivTotal: withTotal ? ivTotal : null,
    mode,
  })
}

describe('candidateGrowths', () => {
  it('recupera o growth exato em level 100 / quality 1', () => {
    expect(candidateGrowths('spa', 50, 50 + 2 * 17, 100, 1, 'official')).toEqual([17])
  })

  it('devolve vazio quando nenhum growth de 1 a 32 reproduz o stat', () => {
    expect(candidateGrowths('hp', 38, 9999, 100, 1, 'official')).toEqual([])
    expect(candidateGrowths('hp', 38, 1, 100, 1, 'official')).toEqual([])
  })

  it('respeita o intervalo semi-aberto do round', () => {
    // Todo candidato devolvido tem que reconstruir exatamente o stat informado.
    const stat = calcAllStats(VULPIX, fillStats(20), 37, 1.42, 'discord').def
    const values = candidateGrowths('def', VULPIX.def, stat, 37, 1.42, 'discord')
    expect(values).toContain(20)
    expect(values.length).toBeGreaterThan(0)
  })

  it('level baixo produz mais candidatos que level alto', () => {
    const low = candidateGrowths('atk', 41, calcAllStats(VULPIX, fillStats(16), 10, 1, 'official').atk, 10, 1, 'official')
    const high = candidateGrowths('atk', 41, calcAllStats(VULPIX, fillStats(16), 100, 1, 'official').atk, 100, 1, 'official')
    expect(low.length).toBeGreaterThan(high.length)
    expect(high).toEqual([16])
  })
})

describe('solveGrowths — casos exatos', () => {
  it('level 100 devolve solução única sem precisar do IV total', () => {
    const growths = statsOf([31, 4, 18, 32, 7, 25])
    const result = solveFor(VULPIX, growths, 100, 1.35, 'discord', false)
    expect(result.status).toBe('exact')
    expect(result.solutionCount).toBe(1)
    for (const key of STAT_KEYS) {
      expect(result.growths![key].values).toEqual([growths[key]])
    }
  })

  it('o IV total colapsa a ambiguidade em level médio', () => {
    const growths = statsOf([12, 30, 3, 28, 19, 9])
    const semTotal = solveFor(ALAKAZAM, growths, 42, 1.6, 'discord', false)
    const comTotal = solveFor(ALAKAZAM, growths, 42, 1.6, 'discord', true)
    expect(comTotal.solutionCount).toBeLessThanOrEqual(semTotal.solutionCount)
    for (const key of STAT_KEYS) {
      expect(comTotal.growths![key].values).toContain(growths[key])
    }
  })
})

describe('solveGrowths — ambiguidade', () => {
  it('level baixo devolve faixas em vez de valores exatos', () => {
    const growths = fillStats(16)
    const result = solveFor(VULPIX, growths, 5, 1, 'official', false)
    expect(result.status).toBe('ambiguous')
    expect(result.solutionCount).toBeGreaterThan(1)
    for (const key of STAT_KEYS) {
      const range = result.growths![key]
      expect(range.min).toBeLessThanOrEqual(16)
      expect(range.max).toBeGreaterThanOrEqual(16)
    }
  })

  it('a faixa de IV total sempre contém o total verdadeiro', () => {
    const growths = statsOf([5, 22, 14, 31, 2, 18])
    const result = solveFor(VULPIX, growths, 12, 1.2, 'discord', false)
    const total = STAT_KEYS.reduce((acc, key) => acc + growths[key], 0)
    const range = ivTotalRange(result.growths!)
    expect(range.min).toBeLessThanOrEqual(total)
    expect(range.max).toBeGreaterThanOrEqual(total)
  })
})

describe('solveGrowths — entradas inconsistentes', () => {
  const base = { baseStats: VULPIX, level: 100, quality: 1, mode: 'official' as const }

  it('stat impossível é reportado com o nome do stat', () => {
    const stats = calcAllStats(VULPIX, fillStats(16), 100, 1, 'official')
    const result = solveGrowths({ ...base, stats: { ...stats, spa: 4 }, ivTotal: null })
    expect(result.status).toBe('noSolution')
    expect(result.impossibleStats).toEqual(['spa'])
    expect(result.reason).toContain('SpA')
  })

  it('IV total fora de 6..192 é rejeitado', () => {
    const stats = calcAllStats(VULPIX, fillStats(16), 100, 1, 'official')
    expect(solveGrowths({ ...base, stats, ivTotal: 200 }).status).toBe('noSolution')
    expect(solveGrowths({ ...base, stats, ivTotal: 5 }).status).toBe('noSolution')
  })

  it('IV total incompatível com os stats é rejeitado', () => {
    const stats = calcAllStats(VULPIX, fillStats(16), 100, 1, 'official')
    const result = solveGrowths({ ...base, stats, ivTotal: 192 })
    expect(result.status).toBe('noSolution')
    expect(result.reason).toContain('IV total')
  })

  it('level e quality inválidos são rejeitados', () => {
    const stats = calcAllStats(VULPIX, fillStats(16), 100, 1, 'official')
    expect(solveGrowths({ ...base, stats, level: 0, ivTotal: null }).status).toBe('noSolution')
    expect(solveGrowths({ ...base, stats, quality: 0, ivTotal: null }).status).toBe('noSolution')
  })

  it('o modo de fórmula errado é detectável', () => {
    const stats = calcAllStats(VULPIX, fillStats(30), 100, 1.7, 'discord')
    const result = solveGrowths({
      baseStats: VULPIX,
      level: 100,
      quality: 1.7,
      stats,
      ivTotal: 180,
      mode: 'official',
    })
    expect(result.status).toBe('noSolution')
  })
})

describe('round-trip forward ↔ inverse (property test)', () => {
  it('1000 espécimes aleatórios: o growth original está sempre entre os candidatos', () => {
    const rng = makeRng(20260823)
    for (let i = 0; i < 1000; i++) {
      const growths = randomGrowths(rng)
      const level = 30 + Math.floor(rng() * 71)
      const quality = 1 + Math.floor(rng() * 81) / 100
      const mode: FormulaMode = rng() < 0.5 ? 'official' : 'discord'
      const baseStats = rng() < 0.5 ? VULPIX : ALAKAZAM

      const result = solveFor(baseStats, growths, level, quality, mode, true)

      expect(result.status).not.toBe('noSolution')
      for (const key of STAT_KEYS) {
        expect(result.growths![key].values).toContain(growths[key])
      }
    }
  })

  it('todo candidato devolvido reconstrói exatamente os stats de entrada', () => {
    const rng = makeRng(777)
    for (let i = 0; i < 200; i++) {
      const growths = randomGrowths(rng)
      const level = 5 + Math.floor(rng() * 96)
      const quality = 1 + Math.floor(rng() * 81) / 100
      const stats = calcAllStats(VULPIX, growths, level, quality, 'discord')
      const result = solveGrowths({
        baseStats: VULPIX,
        level,
        quality,
        stats,
        ivTotal: null,
        mode: 'discord',
      })
      expect(result.growths).not.toBeNull()
      for (const key of STAT_KEYS) {
        for (const g of result.growths![key].values) {
          const rebuilt = calcAllStats(VULPIX, { ...growths, [key]: g }, level, quality, 'discord')
          expect(rebuilt[key]).toBe(stats[key])
        }
      }
    }
  })
})
