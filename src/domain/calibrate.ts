import { GROWTH_MAX, GROWTH_MIN, STAT_KEYS, type StatKey, type Stats } from './types'

/** Um Pokémon real do usuário, com os stats que o jogo exibe. */
export interface CalibrationSpecimen {
  id: string
  label: string
  baseStats: Stats
  level: number
  quality: number
  stats: Stats
}

export interface StatCalibration {
  stat: StatKey
  /** Expoentes da grade que reproduzem TODOS os espécimes deste stat. */
  feasible: number[]
  min: number | null
  max: number | null
  /** Espécimes que nenhum expoente da grade conseguiu reproduzir. */
  contradictorySpecimens: string[]
}

export const DEFAULT_EXPONENT_GRID = buildGrid(0.5, 1.2, 0.01)

export function buildGrid(from: number, to: number, step: number): number[] {
  const out: number[] = []
  const steps = Math.round((to - from) / step)
  for (let i = 0; i <= steps; i++) {
    // Reconstrói a partir do índice para não acumular erro de ponto flutuante.
    out.push(Number((from + i * step).toFixed(6)))
  }
  return out
}

/**
 * Existe algum growth de 1 a 32 que reproduz o stat exibido com este expoente?
 *
 * Não sabemos o growth verdadeiro, então testamos existência: um expoente só
 * é descartado quando NENHUM growth válido explica o valor observado.
 */
function explains(
  base: number,
  displayed: number,
  level: number,
  quality: number,
  exponent: number,
): boolean {
  const k = (level / 100) * Math.pow(quality, exponent)
  if (!Number.isFinite(k) || k <= 0) return false
  const lo = ((displayed - 0.5) / k - base) / 2
  const hi = ((displayed + 0.5) / k - base) / 2
  const from = Math.max(GROWTH_MIN, Math.floor(lo) - 1)
  const to = Math.min(GROWTH_MAX, Math.ceil(hi) + 1)
  for (let g = from; g <= to; g++) {
    if (Math.round((base + 2 * g) * k) === displayed) return true
  }
  return false
}

/**
 * Estreita o expoente de um stat cruzando vários espécimes reais.
 *
 * Cada espécime elimina os expoentes incompatíveis com ele. Espécimes com
 * level e quality variados estreitam muito mais rápido — quality 1.0 não
 * informa nada, já que qualquer expoente vale 1 ali.
 */
export function calibrateStat(
  stat: StatKey,
  specimens: CalibrationSpecimen[],
  grid: number[] = DEFAULT_EXPONENT_GRID,
): StatCalibration {
  const contradictory: string[] = []
  let feasible = [...grid]

  for (const specimen of specimens) {
    const survivors = feasible.filter((e) =>
      explains(
        specimen.baseStats[stat],
        specimen.stats[stat],
        specimen.level,
        specimen.quality,
        e,
      ),
    )
    // Um espécime que zera as opções está errado (ou a fórmula não é essa):
    // registra e segue, em vez de destruir a calibração inteira.
    if (survivors.length === 0) contradictory.push(specimen.label)
    else feasible = survivors
  }

  return {
    stat,
    feasible,
    min: feasible.length > 0 ? feasible[0] : null,
    max: feasible.length > 0 ? feasible[feasible.length - 1] : null,
    contradictorySpecimens: contradictory,
  }
}

export function calibrateAll(
  specimens: CalibrationSpecimen[],
  grid: number[] = DEFAULT_EXPONENT_GRID,
): Record<StatKey, StatCalibration> {
  const out = {} as Record<StatKey, StatCalibration>
  for (const stat of STAT_KEYS) out[stat] = calibrateStat(stat, specimens, grid)
  return out
}

/** Um expoente candidato sobreviveu à calibração deste stat? */
export function supports(calibration: StatCalibration, exponent: number): boolean {
  if (calibration.min === null || calibration.max === null) return false
  return exponent >= calibration.min && exponent <= calibration.max
}
