import { describe, expect, it } from 'vitest'
import { TYPE_CHART } from '../src/config/typechart.config'
import {
  bestEffectiveness,
  countAt,
  defensiveBuckets,
  effectiveness,
  offensiveBuckets,
  type SpeciesTypes,
} from '../src/domain/matchup'

/** Amostra do índice, com casos que exercitam imunidade e tipo duplo. */
const INDICE: SpeciesTypes[] = [
  { id: 1, slug: 'bulbasaur', types: ['grass', 'poison'] },
  { id: 4, slug: 'charmander', types: ['fire'] },
  { id: 6, slug: 'charizard', types: ['fire', 'flying'] },
  { id: 25, slug: 'pikachu', types: ['electric'] },
  { id: 92, slug: 'gastly', types: ['ghost', 'poison'] },
  { id: 95, slug: 'onix', types: ['rock', 'ground'] },
  { id: 130, slug: 'gyarados', types: ['water', 'flying'] },
  { id: 598, slug: 'ferrothorn', types: ['grass', 'steel'] },
]

describe('tabela de tipos', () => {
  it('tem as 18 entradas', () => {
    expect(Object.keys(TYPE_CHART)).toHaveLength(18)
  })

  it('nenhum tipo aparece em duas relações ao mesmo tempo', () => {
    for (const [tipo, r] of Object.entries(TYPE_CHART)) {
      const todos = [...r.x2, ...r.half, ...r.zero]
      expect(new Set(todos).size, `${tipo} repete um alvo`).toBe(todos.length)
    }
  })
})

describe('effectiveness — imunidade', () => {
  it('Terrestre não toca em Voador', () => {
    expect(effectiveness('ground', ['flying'])).toBe(0)
  })

  it('imunidade vence resistência no tipo duplo', () => {
    // Aço leva ×2 de Terrestre, mas Voador zera tudo.
    expect(effectiveness('ground', ['flying', 'steel'])).toBe(0)
  })

  it('Elétrico não toca em Terrestre; Normal não toca em Fantasma', () => {
    expect(effectiveness('electric', ['ground'])).toBe(0)
    expect(effectiveness('normal', ['ghost'])).toBe(0)
  })
})

describe('effectiveness — tipo duplo', () => {
  it('Fogo contra Planta/Aço é ×4', () => {
    expect(effectiveness('fire', ['grass', 'steel'])).toBe(4)
  })

  it('Água contra Fogo/Pedra é ×4', () => {
    expect(effectiveness('water', ['fire', 'rock'])).toBe(4)
  })

  it('Elétrico contra Água/Voador é ×4', () => {
    expect(effectiveness('electric', ['water', 'flying'])).toBe(4)
  })

  it('vantagem e resistência se cancelam', () => {
    // Planta: ×2 em Água, ×0,5 em Voador.
    expect(effectiveness('grass', ['water', 'flying'])).toBe(1)
  })

  it('duas resistências viram ×0,25', () => {
    expect(effectiveness('grass', ['fire', 'flying'])).toBe(0.25)
  })

  it('tipo desconhecido não quebra a conta', () => {
    expect(effectiveness('inventado', ['fire'])).toBe(1)
    expect(effectiveness('fire', ['inventado'])).toBe(1)
  })
})

describe('bestEffectiveness', () => {
  it('o atacante duplo usa o melhor dos dois tipos', () => {
    // Fogo/Voador contra Planta/Aço: fogo dá ×4, voador dá ×0,5.
    expect(bestEffectiveness(['fire', 'flying'], ['grass', 'steel'])).toBe(4)
  })

  it('não escolhe o pior nem quando um dos tipos é imune', () => {
    // Terrestre zera em Voador; Elétrico pega ×2. O melhor vence a imunidade.
    expect(bestEffectiveness(['ground', 'electric'], ['flying'])).toBe(2)
    // E Fogo, que é neutro em Voador, ainda ganha do zero do Terrestre.
    expect(bestEffectiveness(['ground', 'fire'], ['flying'])).toBe(1)
  })

  it('sem tipo, devolve neutro', () => {
    expect(bestEffectiveness([], ['fire'])).toBe(1)
  })
})

describe('offensiveBuckets', () => {
  const buckets = offensiveBuckets(['fire'], INDICE)

  it('agrupa do melhor para o pior, sem bucket vazio', () => {
    const ms = buckets.map((b) => b.multiplier)
    expect(ms).toEqual([...ms].sort((a, b) => b - a))
    expect(buckets.every((b) => b.species.length > 0)).toBe(true)
  })

  it('Ferrothorn (Planta/Aço) cai no ×4 de um atacante Fogo', () => {
    expect(countAt(buckets, 4)).toBe(1)
    expect(buckets[0].species[0].slug).toBe('ferrothorn')
  })

  it('não perde nem duplica nenhuma espécie', () => {
    const total = buckets.reduce((t, b) => t + b.species.length, 0)
    expect(total).toBe(INDICE.length)
    const slugs = buckets.flatMap((b) => b.species.map((s) => s.slug))
    expect(new Set(slugs).size).toBe(INDICE.length)
  })

  it('ordena por número da dex dentro do bucket', () => {
    const neutro = offensiveBuckets(['normal'], INDICE).find((b) => b.multiplier === 1)!
    const ids = neutro.species.map((s) => s.id)
    expect(ids).toEqual([...ids].sort((a, b) => a - b))
  })

  it('índice vazio devolve nenhum bucket', () => {
    expect(offensiveBuckets(['fire'], [])).toEqual([])
  })
})

describe('defensiveBuckets', () => {
  it('inverte o cálculo: quem bate forte em mim', () => {
    // Sou Planta/Aço. Charmander (Fogo) me pega em ×4.
    const buckets = defensiveBuckets(['grass', 'steel'], INDICE)
    const x4 = buckets.find((b) => b.multiplier === 4)!
    expect(x4.species.map((s) => s.slug)).toContain('charmander')
    expect(x4.species.map((s) => s.slug)).toContain('charizard')
  })

  it('quem não me machuca cai no bucket zero', () => {
    // Sou Voador; Onix é Pedra/Terrestre e o melhor dele contra mim é Pedra ×2.
    const buckets = defensiveBuckets(['flying'], INDICE)
    expect(buckets.some((b) => b.multiplier === 2)).toBe(true)
  })

  it('ataque e defesa não são a mesma conta', () => {
    const ofensivo = offensiveBuckets(['ground'], INDICE)
    const defensivo = defensiveBuckets(['ground'], INDICE)
    expect(countAt(ofensivo, 0)).not.toBe(countAt(defensivo, 0))
  })
})

describe('countAt', () => {
  it('devolve 0 para bucket inexistente', () => {
    expect(countAt(offensiveBuckets(['normal'], INDICE), 4)).toBe(0)
  })
})
