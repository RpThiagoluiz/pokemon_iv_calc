import { describe, expect, it } from 'vitest'
import {
  buildGrid,
  calibrateAll,
  calibrateStat,
  supports,
  type CalibrationSpecimen,
} from '../src/domain/calibrate'
import { calcAllStats } from '../src/domain/formula'
import type { FormulaMode, Stats } from '../src/domain/types'
import { ALAKAZAM, VULPIX, makeRng, randomGrowths } from './helpers'

function specimen(
  label: string,
  baseStats: Stats,
  growths: Stats,
  level: number,
  quality: number,
  mode: FormulaMode,
): CalibrationSpecimen {
  return {
    id: label,
    label,
    baseStats,
    level,
    quality,
    stats: calcAllStats(baseStats, growths, level, quality, mode),
  }
}

describe('buildGrid', () => {
  it('gera a grade sem acumular erro de ponto flutuante', () => {
    const grid = buildGrid(0.5, 1.2, 0.01)
    expect(grid[0]).toBe(0.5)
    expect(grid[grid.length - 1]).toBe(1.2)
    expect(grid).toContain(0.8)
    expect(grid).toContain(0.95)
    expect(grid).toContain(1)
  })
})

describe('calibrateStat', () => {
  const rng = makeRng(4242)

  it('espécimes gerados com 0,80 mantêm 0,80 viável e descartam 1,00', () => {
    const specimens = Array.from({ length: 12 }, (_, i) =>
      specimen(
        `atk-${i}`,
        i % 2 === 0 ? VULPIX : ALAKAZAM,
        randomGrowths(rng),
        60 + Math.floor(rng() * 41),
        1.3 + Math.floor(rng() * 51) / 100,
        'discord',
      ),
    )
    const result = calibrateStat('atk', specimens)
    expect(supports(result, 0.8)).toBe(true)
    expect(supports(result, 1)).toBe(false)
  })

  it('espécimes gerados com expoente 1 mantêm 1 viável e descartam 0,80', () => {
    const specimens = Array.from({ length: 12 }, (_, i) =>
      specimen(
        `spa-${i}`,
        ALAKAZAM,
        randomGrowths(rng),
        70 + Math.floor(rng() * 31),
        1.4 + Math.floor(rng() * 41) / 100,
        'official',
      ),
    )
    const result = calibrateStat('spa', specimens)
    expect(supports(result, 1)).toBe(true)
    expect(supports(result, 0.8)).toBe(false)
  })

  it('quality 1 não informa nada: a grade inteira sobrevive', () => {
    const specimens = [specimen('q1', VULPIX, randomGrowths(rng), 100, 1, 'discord')]
    const result = calibrateStat('hp', specimens)
    expect(result.feasible.length).toBe(buildGrid(0.5, 1.2, 0.01).length)
  })

  it('um espécime contraditório é registrado sem zerar a calibração', () => {
    const good = specimen('bom', VULPIX, randomGrowths(rng), 90, 1.6, 'discord')
    const bad: CalibrationSpecimen = {
      ...good,
      id: 'ruim',
      label: 'ruim',
      stats: { ...good.stats, hp: 99999 },
    }
    const result = calibrateStat('hp', [good, bad])
    expect(result.contradictorySpecimens).toEqual(['ruim'])
    expect(result.min).not.toBeNull()
  })

  it('sem espécimes, nada é descartado', () => {
    const result = calibrateStat('def', [])
    expect(result.feasible.length).toBeGreaterThan(0)
    expect(result.contradictorySpecimens).toEqual([])
  })
})

describe('calibrateAll', () => {
  it('recupera o par 0,95 (HP/Vel) e 0,80 (demais) do modo discord', () => {
    const rng = makeRng(90210)
    const specimens = Array.from({ length: 20 }, (_, i) =>
      specimen(
        `s${i}`,
        i % 2 === 0 ? VULPIX : ALAKAZAM,
        randomGrowths(rng),
        75 + Math.floor(rng() * 26),
        1.35 + Math.floor(rng() * 46) / 100,
        'discord',
      ),
    )
    const result = calibrateAll(specimens)
    expect(supports(result.hp, 0.95)).toBe(true)
    expect(supports(result.spe, 0.95)).toBe(true)
    for (const key of ['atk', 'def', 'spa', 'spd'] as const) {
      expect(supports(result[key], 0.8)).toBe(true)
      expect(supports(result[key], 0.95)).toBe(false)
    }
  })
})
