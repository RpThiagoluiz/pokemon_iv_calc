import { describe, expect, it } from 'vitest'
import { calcAllStats, calcPower } from '../src/domain/formula'
import {
  MILESTONE_COUNT,
  PROJECTION_MAX_LEVEL,
  PROJECTION_STEP,
  clampLevel,
  hasSpread,
  milestoneLevels,
  powerGain,
  projectAt,
  projectSeries,
  type ProjectionInput,
} from '../src/domain/projection'
import { STAT_KEYS, type GrowthRange, type Stats } from '../src/domain/types'
import { VULPIX, statsOf } from './helpers'

/** Growths cravados: o caso sem ambiguidade nenhuma. */
function exato(growths: Stats): Stats<GrowthRange> {
  const out = {} as Stats<GrowthRange>
  for (const key of STAT_KEYS) {
    out[key] = { min: growths[key], max: growths[key], values: [growths[key]] }
  }
  return out
}

const GROWTHS = statsOf([12, 30, 3, 28, 19, 9])

const CRAVADO: ProjectionInput = {
  baseStats: VULPIX,
  growths: exato(GROWTHS),
  quality: { min: 1.45, max: 1.45 },
}

/** Cloyster real de tests/fixtures/specimens.json — âncora numérica. */
const CLOYSTER: ProjectionInput = {
  baseStats: { hp: 50, atk: 95, def: 180, spa: 85, spd: 45, spe: 70 },
  growths: exato(statsOf([28, 24, 16, 17, 16, 19])),
  quality: { min: 1.5638, max: 1.565 },
}

describe('clampLevel', () => {
  it('prende entre 1 e o teto', () => {
    expect(clampLevel(0)).toBe(1)
    expect(clampLevel(-40)).toBe(1)
    expect(clampLevel(5000)).toBe(PROJECTION_MAX_LEVEL)
    expect(clampLevel(NaN)).toBe(1)
  })

  it('descarta a parte fracionária', () => {
    expect(clampLevel(119.9)).toBe(119)
  })
})

describe('projectAt — sem ambiguidade', () => {
  it('no level atual reproduz exatamente a fórmula direta', () => {
    const p = projectAt(CRAVADO, 78)
    expect(p.stats).toEqual(calcAllStats(VULPIX, GROWTHS, 78, 1.45))
    expect(p.power).toBeCloseTo(calcPower(p.stats, 1.45), 6)
  })

  it('piso e teto colapsam, então não há faixa', () => {
    const p = projectAt(CRAVADO, 300)
    expect(p.statsMin).toEqual(p.statsMax)
    expect(p.powerMin).toBe(p.powerMax)
    expect(hasSpread(p)).toBe(false)
  })

  it('o Cloyster real bate com a fórmula direta no level dele', () => {
    const p = projectAt(CLOYSTER, 119)
    // A quality tem faixa, então o piso vem do extremo inferior dela.
    expect(p.statsMin).toEqual(
      calcAllStats(CLOYSTER.baseStats, statsOf([28, 24, 16, 17, 16, 19]), 119, 1.5638),
    )
    expect(p.stats.def).toBeGreaterThan(360)
  })
})

describe('projectAt — monotonia', () => {
  it('subir de level nunca reduz stat nem Power', () => {
    let anterior = projectAt(CRAVADO, 10)
    for (let lvl = 30; lvl <= 1000; lvl += 70) {
      const atual = projectAt(CRAVADO, lvl)
      for (const key of STAT_KEYS) {
        expect(atual.stats[key]).toBeGreaterThanOrEqual(anterior.stats[key])
      }
      expect(atual.power).toBeGreaterThanOrEqual(anterior.power)
      anterior = atual
    }
  })

  it('o level pedido é preso ao teto', () => {
    expect(projectAt(CRAVADO, 99999).level).toBe(PROJECTION_MAX_LEVEL)
  })
})

describe('projectAt — com ambiguidade', () => {
  const AMBIGUO: ProjectionInput = {
    baseStats: VULPIX,
    growths: {
      hp: { min: 10, max: 14, values: [10, 12, 14] },
      atk: { min: 28, max: 32, values: [28, 30, 32] },
      def: { min: 1, max: 5, values: [1, 3, 5] },
      spa: { min: 26, max: 30, values: [26, 28, 30] },
      spd: { min: 17, max: 21, values: [17, 19, 21] },
      spe: { min: 7, max: 11, values: [7, 9, 11] },
    },
    quality: { min: 1.445, max: 1.455 },
  }

  it('a faixa contém o valor verdadeiro', () => {
    const verdade = calcAllStats(VULPIX, GROWTHS, 250, 1.45)
    const p = projectAt(AMBIGUO, 250)
    for (const key of STAT_KEYS) {
      expect(p.statsMin[key]).toBeLessThanOrEqual(verdade[key])
      expect(p.statsMax[key]).toBeGreaterThanOrEqual(verdade[key])
    }
  })

  it('o Power verdadeiro cai dentro da faixa', () => {
    const verdade = calcPower(calcAllStats(VULPIX, GROWTHS, 250, 1.45), 1.45)
    const p = projectAt(AMBIGUO, 250)
    expect(p.powerMin).toBeLessThanOrEqual(verdade)
    expect(p.powerMax).toBeGreaterThanOrEqual(verdade)
  })

  it('a estimativa central fica entre o piso e o teto', () => {
    const p = projectAt(AMBIGUO, 250)
    expect(p.power).toBeGreaterThan(p.powerMin)
    expect(p.power).toBeLessThan(p.powerMax)
    expect(hasSpread(p)).toBe(true)
  })

  it('a faixa se alarga com o level, porque o erro escala junto', () => {
    const perto = projectAt(AMBIGUO, 100)
    const longe = projectAt(AMBIGUO, 900)
    expect(longe.powerMax - longe.powerMin).toBeGreaterThan(perto.powerMax - perto.powerMin)
  })
})

describe('projectSeries', () => {
  it('anda de 20 em 20 e inclui as duas pontas', () => {
    const s = projectSeries(CRAVADO, 100, 180)
    expect(s.map((p) => p.level)).toEqual([100, 120, 140, 160, 180])
  })

  it('inclui o alvo mesmo fora do passo', () => {
    const s = projectSeries(CRAVADO, 119, 175)
    expect(s[0].level).toBe(119)
    expect(s[s.length - 1].level).toBe(175)
  })

  it('alvo igual ao atual devolve um ponto só', () => {
    expect(projectSeries(CRAVADO, 119, 119)).toHaveLength(1)
  })

  it('alvo abaixo do atual não gera série invertida', () => {
    expect(projectSeries(CRAVADO, 200, 100)).toHaveLength(1)
  })

  it('do 1 ao teto não explode em pontos demais', () => {
    const s = projectSeries(CRAVADO, 1, PROJECTION_MAX_LEVEL)
    expect(s.length).toBeLessThanOrEqual(PROJECTION_MAX_LEVEL / PROJECTION_STEP + 2)
    expect(s[s.length - 1].level).toBe(PROJECTION_MAX_LEVEL)
  })
})

describe('milestoneLevels', () => {
  it('devolve o atual e os dois próximos marcos', () => {
    expect(milestoneLevels(119)).toEqual([119, 139, 159])
    expect(milestoneLevels(119)).toHaveLength(MILESTONE_COUNT + 1)
  })

  it('não passa do teto', () => {
    expect(milestoneLevels(990)).toEqual([990])
    expect(milestoneLevels(980)).toEqual([980, 1000])
  })
})

describe('powerGain', () => {
  it('mede a variação percentual contra o level atual', () => {
    const atual = projectAt(CRAVADO, 100)
    expect(powerGain(atual, atual)).toBe(0)
    expect(powerGain(atual, projectAt(CRAVADO, 200))).toBeCloseTo(100, 0)
  })

  it('Power zero não vira divisão por zero', () => {
    const zero = { ...projectAt(CRAVADO, 100), power: 0 }
    expect(powerGain(zero, projectAt(CRAVADO, 200))).toBe(0)
  })
})
