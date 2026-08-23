import { describe, expect, it } from 'vitest'
import { explainPerfectRolls, explainSolution, listStats } from '../src/domain/explain'
import { calcAllStats } from '../src/domain/formula'
import { autoWeights, gradeFromRanges } from '../src/domain/grade'
import { solveGrowths } from '../src/domain/inverse'
import {
  STAT_KEYS,
  type GrowthRange,
  type SpecimenInput,
  type Stats,
} from '../src/domain/types'
import { ALAKAZAM, VULPIX, fillStats, statsOf } from './helpers'

function inputFor(growths: Stats, level: number, quality: number, withTotal: boolean): SpecimenInput {
  return {
    baseStats: VULPIX,
    level,
    quality,
    stats: calcAllStats(VULPIX, growths, level, quality),
    ivTotal: withTotal ? STAT_KEYS.reduce((acc, key) => acc + growths[key], 0) : null,
  }
}

function explain(growths: Stats, level: number, quality: number, withTotal = true): string {
  const input = inputFor(growths, level, quality, withTotal)
  return explainSolution(solveGrowths(input), input)
}

describe('explainSolution — exato', () => {
  it('cita o level e a quality do espécime, não valores genéricos', () => {
    const texto = explain(statsOf([12, 30, 3, 28, 19, 9]), 78, 1.45)
    expect(texto).toContain('Solução única')
    expect(texto).toContain('level 78')
    expect(texto).toContain('quality 1.45')
  })

  it('credita o IV total quando ele foi informado', () => {
    const texto = explain(statsOf([12, 30, 3, 28, 19, 9]), 78, 1.45, true)
    expect(texto).toContain('101/192')
  })

  it('sem IV total, explica que foi o level que resolveu', () => {
    const texto = explain(statsOf([31, 4, 18, 32, 7, 25]), 100, 1.35, false)
    expect(texto).toContain('sem o IV total')
    expect(texto).not.toContain('/192')
  })
})

describe('explainSolution — ambíguo', () => {
  const ambiguo = () => explain(fillStats(16), 8, 1.2, false)

  it('diz quantas combinações existem, formatado em pt-BR', () => {
    const texto = ambiguo()
    expect(texto).toMatch(/[\d.]+ combinações de growths/)
  })

  it('explica a causa e deixa claro que não é erro de digitação', () => {
    const texto = ambiguo()
    expect(texto).toContain('fator de escala é pequeno')
    expect(texto).toContain('não é erro de digitação')
  })

  it('sugere informar o IV total quando ele está em branco', () => {
    expect(ambiguo()).toContain('Informe o IV total')
  })

  it('quando o IV total já foi dado e não bastou, sugere subir de level', () => {
    const texto = explain(fillStats(16), 8, 1.2, true)
    expect(texto).toContain('o IV total sozinho não bastou')
  })
})

describe('explainSolution — sem solução', () => {
  it('repassa o motivo apurado pelo solver', () => {
    const input = inputFor(fillStats(16), 100, 1, false)
    const quebrado = { ...input, stats: { ...input.stats, spa: 9999 } }
    expect(explainSolution(solveGrowths(quebrado), quebrado)).toContain('SpA')
  })
})

describe('listStats', () => {
  it('usa "e" antes do último, vírgula no resto', () => {
    expect(listStats(['spa'])).toBe('SpA')
    expect(listStats(['spa', 'spe'])).toBe('SpA e Vel')
    expect(listStats(['hp', 'spa', 'spe'])).toBe('HP, SpA e Vel')
  })

  it('lista vazia vira string vazia', () => {
    expect(listStats([])).toBe('')
  })
})

describe('explainPerfectRolls', () => {
  it('nomeia o tier e os stats que vieram perfeitos', () => {
    const growths = statsOf([1, 1, 1, 32, 1, 32])
    const ranges = {} as Stats<GrowthRange>
    for (const key of STAT_KEYS) {
      ranges[key] = { min: growths[key], max: growths[key], values: [growths[key]] }
    }
    const grade = gradeFromRanges(ranges, autoWeights(ALAKAZAM))

    const texto = explainPerfectRolls(grade)

    expect(texto).toContain('Tier A')
    expect(texto).toContain('SpA e Vel em 32/32')
    expect(texto).toContain('média de todos os stats')
  })
})
