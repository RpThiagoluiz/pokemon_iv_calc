import type { Species, StatKey, Stats } from '../domain/types'
import { readJson, writeJson } from './storage'

const API = 'https://pokeapi.co/api/v2/pokemon'

/** Nomes de stat da PokeAPI → chaves do domínio. */
const STAT_MAP: Record<string, StatKey> = {
  hp: 'hp',
  attack: 'atk',
  defense: 'def',
  'special-attack': 'spa',
  'special-defense': 'spd',
  speed: 'spe',
}

/** `Mr. Mime` → `mr-mime`; `Nidoran♀` → `nidoran-f`. */
export function normalizeName(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // remove acentos
    .replace(/♀/g, '-f') // ♀
    .replace(/♂/g, '-m') // ♂
    .replace(/['.:]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

interface RawPokemon {
  id: number
  name: string
  stats: Array<{ base_stat: number; stat: { name: string } }>
  types: Array<{ type: { name: string } }>
  sprites: {
    front_default: string | null
    other?: { 'official-artwork'?: { front_default: string | null } }
  }
}

function toSpecies(raw: RawPokemon): Species {
  const baseStats = { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 } as Stats
  for (const entry of raw.stats) {
    const key = STAT_MAP[entry.stat.name]
    if (key) baseStats[key] = entry.base_stat
  }
  return {
    id: raw.id,
    slug: raw.name,
    name: raw.name,
    baseStats,
    types: raw.types.map((t) => t.type.name),
    spriteUrl: raw.sprites.front_default,
    artworkUrl: raw.sprites.other?.['official-artwork']?.front_default ?? null,
  }
}

export class SpeciesNotFoundError extends Error {
  constructor(name: string) {
    super(`Espécie "${name}" não encontrada na PokeAPI.`)
    this.name = 'SpeciesNotFoundError'
  }
}

/**
 * Busca uma espécie, preferindo o cache.
 *
 * A PokeAPI é pública e sem token. Base stats não mudam, então o cache não
 * expira — só o `force` refaz a chamada.
 */
export async function fetchSpecies(name: string, force = false): Promise<Species> {
  const slug = normalizeName(name)
  if (!slug) throw new SpeciesNotFoundError(name)

  if (!force) {
    const cached = readJson<Species>('species', slug)
    if (cached) return cached
  }

  let response: Response
  try {
    response = await fetch(`${API}/${slug}`)
  } catch {
    throw new Error('Não foi possível falar com a PokeAPI. Verifique sua conexão.')
  }

  if (response.status === 404) throw new SpeciesNotFoundError(name)
  if (!response.ok) throw new Error(`PokeAPI respondeu ${response.status}.`)

  const species = toSpecies((await response.json()) as RawPokemon)
  writeJson('species', slug, species)
  return species
}
