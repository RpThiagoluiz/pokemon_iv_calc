import type { Stats } from '../support/formula'

/**
 * Espécies servidas pelo stub da PokeAPI.
 *
 * Congeladas de propósito: os testes não podem quebrar porque a PokeAPI saiu
 * do ar, mudou um sprite ou reequilibrou um Pokémon numa geração nova.
 */
export interface SpeciesFixture {
  id: number
  slug: string
  baseStats: Stats
  types: string[]
}

export const VULPIX: SpeciesFixture = {
  id: 37,
  slug: 'vulpix',
  baseStats: { hp: 38, atk: 41, def: 40, spa: 50, spd: 65, spe: 65 },
  types: ['fire'],
}

/** Sweeper especial: SpA e Vel dominam, o resto é ruído. Ideal para o grade. */
export const ALAKAZAM: SpeciesFixture = {
  id: 65,
  slug: 'alakazam',
  baseStats: { hp: 55, atk: 50, def: 45, spa: 135, spd: 95, spe: 120 },
  types: ['psychic'],
}

export const ALL_SPECIES = [VULPIX, ALAKAZAM]

/** Resposta da PokeAPI no formato que `src/data/pokeapi.ts` consome. */
export function toPokeApiPayload(species: SpeciesFixture) {
  return {
    id: species.id,
    name: species.slug,
    stats: [
      { base_stat: species.baseStats.hp, stat: { name: 'hp' } },
      { base_stat: species.baseStats.atk, stat: { name: 'attack' } },
      { base_stat: species.baseStats.def, stat: { name: 'defense' } },
      { base_stat: species.baseStats.spa, stat: { name: 'special-attack' } },
      { base_stat: species.baseStats.spd, stat: { name: 'special-defense' } },
      { base_stat: species.baseStats.spe, stat: { name: 'speed' } },
    ],
    types: species.types.map((name) => ({ type: { name } })),
    // `null` de propósito: o app precisa aguentar espécie sem sprite.
    sprites: { front_default: null, other: { 'official-artwork': { front_default: null } } },
  }
}
