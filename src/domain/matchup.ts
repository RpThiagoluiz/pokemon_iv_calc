import { MULTIPLIERS, TYPE_CHART, type Multiplier } from '../config/typechart.config'

/** Uma espécie do índice: só o que o mapa precisa saber. */
export interface SpeciesTypes {
  id: number
  slug: string
  types: string[]
}

export interface MatchupBucket {
  multiplier: Multiplier
  species: SpeciesTypes[]
}

/**
 * Multiplicador de UM tipo atacante contra um defensor de um ou dois tipos.
 *
 * É o produto das duas relações, e é daí que a imunidade sai de graça: `zero`
 * zera o produto inteiro, então Terrestre não toca em Voador/Aço mesmo com Aço
 * levando dano dobrado de Terrestre.
 */
export function effectiveness(attack: string, defense: string[]): number {
  const rel = TYPE_CHART[attack]
  if (!rel) return 1
  return defense.reduce((mult, def) => {
    if (rel.zero.includes(def)) return 0
    if (rel.x2.includes(def)) return mult * 2
    if (rel.half.includes(def)) return mult * 0.5
    return mult
  }, 1)
}

/**
 * O melhor que um atacante consegue contra um defensor.
 *
 * Um Pokémon de tipo duplo ataca com o tipo que render mais — é o que qualquer
 * jogador faria. Sem tipo nenhum, devolve neutro em vez de quebrar.
 */
export function bestEffectiveness(attackTypes: string[], defense: string[]): number {
  if (attackTypes.length === 0) return 1
  return Math.max(...attackTypes.map((t) => effectiveness(t, defense)))
}

/** Prende um produto qualquer ao conjunto de multiplicadores exibíveis. */
function toMultiplier(value: number): Multiplier {
  let melhor: Multiplier = 1
  let dist = Infinity
  for (const m of MULTIPLIERS) {
    const d = Math.abs(m - value)
    if (d < dist) {
      dist = d
      melhor = m
    }
  }
  return melhor
}

function bucketize(
  species: SpeciesTypes[],
  multiplierOf: (s: SpeciesTypes) => number,
): MatchupBucket[] {
  const mapa = new Map<Multiplier, SpeciesTypes[]>()
  for (const s of species) {
    const m = toMultiplier(multiplierOf(s))
    const lista = mapa.get(m)
    if (lista) lista.push(s)
    else mapa.set(m, [s])
  }
  // Ordem fixa do melhor para o pior; buckets vazios não entram.
  return MULTIPLIERS.filter((m) => mapa.has(m)).map((m) => ({
    multiplier: m,
    species: [...mapa.get(m)!].sort((a, b) => a.id - b.id),
  }))
}

/** Quem eu machuco mais, agrupado por multiplicador. */
export function offensiveBuckets(myTypes: string[], index: SpeciesTypes[]): MatchupBucket[] {
  return bucketize(index, (alvo) => bestEffectiveness(myTypes, alvo.types))
}

/**
 * Quem me machuca mais.
 *
 * Mesma simplificação do lado ofensivo: cada Pokémon ataca com o próprio tipo,
 * então o perigo dele contra mim é o melhor dos tipos que ele tem.
 */
export function defensiveBuckets(myTypes: string[], index: SpeciesTypes[]): MatchupBucket[] {
  return bucketize(index, (inimigo) => bestEffectiveness(inimigo.types, myTypes))
}

/** Quantas espécies caem em cada multiplicador — a prévia do painel. */
export function countAt(buckets: MatchupBucket[], multiplier: Multiplier): number {
  return buckets.find((b) => b.multiplier === multiplier)?.species.length ?? 0
}
