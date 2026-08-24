import { TYPE_CHART } from '../config/typechart.config'
import type { SpeciesTypes } from '../domain/matchup'
import { readJson, writeJson } from './storage'

const API = 'https://pokeapi.co/api/v2/type'

/**
 * Acima disso a PokeAPI numera formas alternativas: megas, formas regionais,
 * Gmax. Elas não são espécies próprias e poluiriam a lista com "charizard-mega-x".
 */
const FORM_ID_FLOOR = 10_000

/** Sobe quando o formato do índice mudar, para o cache velho ser descartado. */
const CACHE_VERSION = 1

interface CachedIndex {
  version: number
  species: SpeciesTypes[]
}

interface RawTypeResponse {
  pokemon: Array<{ pokemon: { name: string; url: string } }>
}

function idFromUrl(url: string): number {
  return Number(url.split('/').filter(Boolean).pop())
}

/**
 * Índice de todas as espécies e seus tipos.
 *
 * Montado a partir dos 18 endpoints `/type/{nome}` e NÃO de mil chamadas a
 * `/pokemon/{nome}`: cada espécie aparece na lista de um ou dois tipos, então
 * 18 requisições (~374 KB) reconstroem a dex inteira. O que fica em cache é só
 * o índice derivado — 26 KB, contra os 374 KB do material bruto.
 */
export async function fetchTypeIndex(force = false): Promise<SpeciesTypes[]> {
  if (!force) {
    const cache = readJson<CachedIndex>('typeindex', 'v1')
    if (cache?.version === CACHE_VERSION && cache.species.length > 0) return cache.species
  }

  const tipos = Object.keys(TYPE_CHART)
  let respostas: RawTypeResponse[]
  try {
    respostas = await Promise.all(
      tipos.map(async (tipo) => {
        const r = await fetch(`${API}/${tipo}`)
        if (!r.ok) throw new Error(`PokeAPI respondeu ${r.status} para o tipo ${tipo}.`)
        return (await r.json()) as RawTypeResponse
      }),
    )
  } catch (err) {
    if (err instanceof Error && err.message.startsWith('PokeAPI')) throw err
    throw new Error('Não foi possível montar o mapa de tipos. Verifique sua conexão.')
  }

  const porSlug = new Map<string, SpeciesTypes>()
  respostas.forEach((resposta, i) => {
    const tipo = tipos[i]
    for (const entrada of resposta.pokemon) {
      const id = idFromUrl(entrada.pokemon.url)
      if (!Number.isFinite(id) || id >= FORM_ID_FLOOR) continue
      const slug = entrada.pokemon.name
      const existente = porSlug.get(slug)
      if (existente) existente.types.push(tipo)
      else porSlug.set(slug, { id, slug, types: [tipo] })
    }
  })

  // Ordena os tipos de cada espécie pela ordem da tabela, para o badge não
  // dançar conforme a ordem em que as respostas chegaram.
  const species = [...porSlug.values()]
    .map((s) => ({ ...s, types: tipos.filter((t) => s.types.includes(t)) }))
    .sort((a, b) => a.id - b.id)

  writeJson('typeindex', 'v1', { version: CACHE_VERSION, species } satisfies CachedIndex)
  return species
}
