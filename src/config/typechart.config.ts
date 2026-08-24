/**
 * Relações de dano da tabela de tipos, por tipo ATACANTE.
 *
 * ⚠️ Esta é a tabela canônica da série (a mesma que a PokeAPI publica), e
 * **não** foi confirmada dentro do Poke Idle World. Se o jogo divergir, a
 * correção é só aqui — nada mais no app conhece essas relações. O modal avisa
 * isso na tela, mesma política que levou o tier de quality a ser removido.
 *
 * Gerada a partir de `/api/v2/type/{nome}` para não errar nenhuma das 18
 * entradas digitando à mão. O que não está em `x2`, `half` ou `zero` é ×1.
 */
export interface DamageRelations {
  /** Dobro de dano contra estes tipos. */
  x2: string[]
  /** Metade do dano. */
  half: string[]
  /** Nenhum dano — a imunidade que zera tudo, mesmo em tipo duplo. */
  zero: string[]
}

export const TYPE_CHART: Record<string, DamageRelations> = {
  normal: {
    x2: [],
    half: ['rock', 'steel'],
    zero: ['ghost'],
  },
  fire: {
    x2: ['bug', 'steel', 'grass', 'ice'],
    half: ['rock', 'fire', 'water', 'dragon'],
    zero: [],
  },
  water: {
    x2: ['ground', 'rock', 'fire'],
    half: ['water', 'grass', 'dragon'],
    zero: [],
  },
  electric: {
    x2: ['flying', 'water'],
    half: ['grass', 'electric', 'dragon'],
    zero: ['ground'],
  },
  grass: {
    x2: ['ground', 'rock', 'water'],
    half: ['flying', 'poison', 'bug', 'steel', 'fire', 'grass', 'dragon'],
    zero: [],
  },
  ice: {
    x2: ['flying', 'ground', 'grass', 'dragon'],
    half: ['steel', 'fire', 'water', 'ice'],
    zero: [],
  },
  fighting: {
    x2: ['normal', 'rock', 'steel', 'ice', 'dark'],
    half: ['flying', 'poison', 'bug', 'psychic', 'fairy'],
    zero: ['ghost'],
  },
  poison: {
    x2: ['grass', 'fairy'],
    half: ['poison', 'ground', 'rock', 'ghost'],
    zero: ['steel'],
  },
  ground: {
    x2: ['poison', 'rock', 'steel', 'fire', 'electric'],
    half: ['bug', 'grass'],
    zero: ['flying'],
  },
  flying: {
    x2: ['fighting', 'bug', 'grass'],
    half: ['rock', 'steel', 'electric'],
    zero: [],
  },
  psychic: {
    x2: ['fighting', 'poison'],
    half: ['steel', 'psychic'],
    zero: ['dark'],
  },
  bug: {
    x2: ['grass', 'psychic', 'dark'],
    half: ['fighting', 'flying', 'poison', 'ghost', 'steel', 'fire', 'fairy'],
    zero: [],
  },
  rock: {
    x2: ['flying', 'bug', 'fire', 'ice'],
    half: ['fighting', 'ground', 'steel'],
    zero: [],
  },
  ghost: {
    x2: ['ghost', 'psychic'],
    half: ['dark'],
    zero: ['normal'],
  },
  dragon: {
    x2: ['dragon'],
    half: ['steel'],
    zero: ['fairy'],
  },
  dark: {
    x2: ['ghost', 'psychic'],
    half: ['fighting', 'dark', 'fairy'],
    zero: [],
  },
  steel: {
    x2: ['rock', 'ice', 'fairy'],
    half: ['steel', 'fire', 'water', 'electric'],
    zero: [],
  },
  fairy: {
    x2: ['fighting', 'dragon', 'dark'],
    half: ['poison', 'steel', 'fire'],
    zero: [],
  },
}

/** Multiplicadores possíveis, do melhor para o pior. */
export const MULTIPLIERS = [4, 2, 1, 0.5, 0.25, 0] as const

export type Multiplier = (typeof MULTIPLIERS)[number]

/** Como cada multiplicador é apresentado. A cor nunca vai sozinha: o ×N é escrito. */
export const MULTIPLIER_LABELS: Record<Multiplier, { label: string; hint: string }> = {
  4: { label: 'Massacre', hint: 'dano quadruplicado' },
  2: { label: 'Bom', hint: 'dano dobrado' },
  1: { label: 'Neutro', hint: 'dano normal' },
  0.5: { label: 'Resiste', hint: 'metade do dano' },
  0.25: { label: 'Resiste muito', hint: 'um quarto do dano' },
  0: { label: 'Imune', hint: 'nenhum dano' },
}
