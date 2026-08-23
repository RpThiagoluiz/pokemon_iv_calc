/**
 * Cor e rótulo pt-BR de cada tipo de Pokémon.
 *
 * As cores NÃO são as oficiais do jogo: aquelas são escuras demais para texto
 * sobre fundo escuro (dragon `#7038F8` reprova feio). Estas são versões
 * clareadas, todas medidas contra as superfícies do app — pior caso 6,51:1
 * (fighting). Trocou alguma? Meça antes (ver .claude/skills/poke-ui).
 *
 * A cor nunca é o único sinal: o badge sempre escreve o nome do tipo.
 */
export interface PokemonType {
  color: string
  label: string
}

export const TYPES: Record<string, PokemonType> = {
  normal: { color: '#c7cab8', label: 'Normal' },
  fire: { color: '#ffa352', label: 'Fogo' },
  water: { color: '#7fb2f7', label: 'Água' },
  electric: { color: '#ffd84d', label: 'Elétrico' },
  grass: { color: '#8bdd74', label: 'Planta' },
  ice: { color: '#93e3eb', label: 'Gelo' },
  fighting: { color: '#f5776b', label: 'Lutador' },
  poison: { color: '#ce85db', label: 'Venenoso' },
  ground: { color: '#ebc873', label: 'Terrestre' },
  flying: { color: '#afbdf5', label: 'Voador' },
  psychic: { color: '#ff95ad', label: 'Psíquico' },
  bug: { color: '#bfd84f', label: 'Inseto' },
  rock: { color: '#dac791', label: 'Pedra' },
  ghost: { color: '#af92d8', label: 'Fantasma' },
  dragon: { color: '#a294fa', label: 'Dragão' },
  dark: { color: '#ae9a8c', label: 'Sombrio' },
  steel: { color: '#c0cbdb', label: 'Metálico' },
  fairy: { color: '#f6afcd', label: 'Fada' },
}

/** Acento quando nenhuma espécie está carregada. */
export const NEUTRAL_ACCENT = '#8ab4ff'

export function typeInfo(name: string): PokemonType {
  return TYPES[name] ?? { color: NEUTRAL_ACCENT, label: name }
}

/** O primeiro tipo define o acento da tela. */
export function accentFor(types: string[] | undefined): string {
  if (!types || types.length === 0) return NEUTRAL_ACCENT
  return typeInfo(types[0]).color
}

/**
 * Variáveis de acento para aplicar no container do app.
 *
 * As três derivadas são calculadas com a cor literal, e não com
 * `var(--accent)`: uma custom property declarada em `:root` computa o `var()`
 * *ali*, então sobrescrever `--accent` num descendente não recalcularia
 * `--accent-soft`. Resolver tudo na mesma declaração evita essa pegadinha.
 */
export function accentVars(color: string): Record<string, string> {
  return {
    '--accent': color,
    '--accent-soft': `color-mix(in srgb, ${color} 14%, transparent)`,
    '--accent-edge': `color-mix(in srgb, ${color} 45%, transparent)`,
  }
}
