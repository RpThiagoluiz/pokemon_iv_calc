import { useCallback, useRef, useState } from 'react'
import { fetchSpecies, normalizeName } from '../data/pokeapi'
import { readJson, removeJson, writeJson } from '../data/storage'
import { STAT_KEYS, type Species, type StatKey, type Stats } from '../domain/types'

export interface UseSpeciesResult {
  species: Species | null
  /** Base stats efetivos: os da API, com overrides do usuário aplicados por cima. */
  baseStats: Stats
  /** Stats cujo valor foi sobrescrito manualmente. */
  overriddenStats: StatKey[]
  loading: boolean
  error: string | null
  /** Devolve a espécie carregada, ou `null` se a busca falhou ou foi superada por outra. */
  load: (name: string, force?: boolean) => Promise<Species | null>
  setBaseStat: (key: StatKey, value: number) => void
  resetOverrides: () => void
}

const EMPTY_BASE: Stats = { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 }

export function useSpecies(): UseSpeciesResult {
  const [species, setSpecies] = useState<Species | null>(null)
  const [overrides, setOverrides] = useState<Partial<Stats>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  /** Ignora respostas de buscas que já foram substituídas por outra mais nova. */
  const requestId = useRef(0)

  const load = useCallback(async (name: string, force = false): Promise<Species | null> => {
    const slug = normalizeName(name)
    if (!slug) return null
    const id = ++requestId.current
    setLoading(true)
    setError(null)
    try {
      const found = await fetchSpecies(slug, force)
      if (id !== requestId.current) return null
      setSpecies(found)
      setOverrides(readJson<Partial<Stats>>('override', found.slug) ?? {})
      return found
    } catch (err) {
      if (id !== requestId.current) return null
      // Um erro de digitação não deve destruir a espécie já carregada:
      // mostra a mensagem e mantém o que estava na tela.
      setError(err instanceof Error ? err.message : 'Falha ao buscar a espécie.')
      return null
    } finally {
      if (id === requestId.current) setLoading(false)
    }
  }, [])

  const setBaseStat = useCallback(
    (key: StatKey, value: number) => {
      if (!species) return
      setOverrides((prev) => {
        const next = { ...prev }
        // Voltar ao valor da API remove o override em vez de gravá-lo.
        if (value === species.baseStats[key]) delete next[key]
        else next[key] = value

        if (Object.keys(next).length === 0) removeJson('override', species.slug)
        else writeJson('override', species.slug, next)
        return next
      })
    },
    [species],
  )

  const resetOverrides = useCallback(() => {
    if (species) removeJson('override', species.slug)
    setOverrides({})
  }, [species])

  const baseStats = species ? { ...species.baseStats, ...overrides } : EMPTY_BASE
  const overriddenStats = STAT_KEYS.filter((key) => overrides[key] !== undefined)

  return { species, baseStats, overriddenStats, loading, error, load, setBaseStat, resetOverrides }
}
