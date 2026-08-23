import { describe, expect, it } from 'vitest'
import {
  COMPARE_MAX,
  COMPARE_MIN,
  bestPerStat,
  defaultNickname,
  groupByGrade,
  hasAmbiguity,
  rankEntries,
  type CompareEntry,
} from '../src/domain/compare'
import { calcAllStats, calcPower } from '../src/domain/formula'
import { autoWeights, gradeFromRanges } from '../src/domain/grade'
import { ivTotalRange } from '../src/domain/inverse'
import { STAT_KEYS, type GrowthRange, type Stats } from '../src/domain/types'
import { ALAKAZAM, fillStats, statsOf } from './helpers'

const WEIGHTS = autoWeights(ALAKAZAM)

function ranges(growths: Stats): Stats<GrowthRange> {
  const out = {} as Stats<GrowthRange>
  for (const key of STAT_KEYS) {
    out[key] = { min: growths[key], max: growths[key], values: [growths[key]] }
  }
  return out
}

function entry(id: string, growths: Stats, isExact = true): CompareEntry {
  const g = ranges(growths)
  const stats = calcAllStats(ALAKAZAM, growths, 100, 1)
  return {
    id,
    nickname: id,
    level: 100,
    quality: 1,
    stats,
    growths: g,
    ivTotal: ivTotalRange(g),
    grade: gradeFromRanges(g, WEIGHTS),
    power: calcPower(stats, 1),
    isExact,
  }
}

// SS, A, D — três patamares bem separados no Alakazam.
const perfeito = entry('perfeito', fillStats(32))
const focado = entry('focado', statsOf([1, 1, 1, 32, 1, 32]))
const lixo = entry('lixo', statsOf([32, 32, 32, 4, 32, 4]))

describe('limites', () => {
  it('comparar exige pelo menos dois e no máximo cinco', () => {
    expect(COMPARE_MIN).toBe(2)
    expect(COMPARE_MAX).toBe(5)
  })

  it('gera rótulo para quem não recebeu apelido', () => {
    expect(defaultNickname(0)).toBe('Pokémon 1')
    expect(defaultNickname(4)).toBe('Pokémon 5')
  })
})

describe('rankEntries', () => {
  it('ordena do melhor grade para o pior', () => {
    const ordenado = rankEntries([lixo, perfeito, focado])
    expect(ordenado.map((e) => e.id)).toEqual(['perfeito', 'focado', 'lixo'])
  })

  it('desempata pelo score dentro do mesmo grade', () => {
    const a = entry('a', statsOf([1, 1, 1, 32, 1, 32])) // A, 77,2%
    const b = entry('b', statsOf([3, 3, 3, 32, 3, 32])) // A também, score um pouco maior
    expect(a.grade.maxGrade).toBe(b.grade.maxGrade)
    expect(rankEntries([a, b]).map((e) => e.id)).toEqual(['b', 'a'])
  })

  it('não muta o array recebido', () => {
    const original = [lixo, perfeito]
    rankEntries(original)
    expect(original.map((e) => e.id)).toEqual(['lixo', 'perfeito'])
  })
})

describe('groupByGrade', () => {
  it('agrupa por grade e pula os vazios', () => {
    const grupos = groupByGrade([lixo, perfeito, focado])
    expect(grupos.map((g) => g.grade)).toEqual(['SS', 'A', 'D'])
    expect(grupos[0].entries.map((e) => e.id)).toEqual(['perfeito'])
  })

  it('junta empates de grade no mesmo grupo', () => {
    const outro = entry('outro', statsOf([2, 2, 2, 32, 2, 32]))
    const grupos = groupByGrade([focado, outro])
    expect(grupos).toHaveLength(1)
    expect(grupos[0].entries).toHaveLength(2)
  })

  it('lista vazia devolve zero grupos', () => {
    expect(groupByGrade([])).toEqual([])
  })
})

describe('bestPerStat', () => {
  it('aponta o vencedor de cada stat', () => {
    const melhores = bestPerStat([focado, lixo])
    expect(melhores.spa).toEqual(['focado'])
    expect(melhores.atk).toEqual(['lixo'])
  })

  it('empate devolve todos os empatados', () => {
    expect(bestPerStat([focado, focado]).spa).toEqual(['focado', 'focado'])
  })

  it('compara pelo piso da faixa: ambíguo não ganha por um teto incerto', () => {
    const certo = entry('certo', fillStats(20))
    const talvez = entry('talvez', fillStats(10), false)
    talvez.growths.spa = { min: 10, max: 32, values: [10, 32] }

    // O teto de `talvez` é 32, mas só 10 está garantido — quem vence é `certo`.
    expect(bestPerStat([certo, talvez]).spa).toEqual(['certo'])
  })

  it('lista vazia não quebra', () => {
    expect(bestPerStat([]).hp).toEqual([])
  })
})

describe('hasAmbiguity', () => {
  it('acusa quando algum espécime ficou ambíguo', () => {
    expect(hasAmbiguity([perfeito, focado])).toBe(false)
    expect(hasAmbiguity([perfeito, entry('x', fillStats(16), false)])).toBe(true)
  })
})
