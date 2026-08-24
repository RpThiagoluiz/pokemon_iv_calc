import { useCallback, useRef, useState } from 'react'
import { fetchTypeIndex } from '../data/typeIndex'
import type { SpeciesTypes } from '../domain/matchup'

export interface UseTypeIndexResult {
  index: SpeciesTypes[] | null
  loading: boolean
  error: string | null
  /**
   * Busca sob demanda. Sem `force`, só tenta UMA vez por sessão — nova
   * tentativa é escolha explícita do usuário, no botão.
   */
  load: (force?: boolean) => void
}

/**
 * Índice de tipos, carregado só quando alguém precisa.
 *
 * São 374 KB de rede: baixar isso no carregamento da página, para uma ação que
 * talvez ninguém abra, seria desperdício. O modal chama `load` ao abrir.
 */
export function useTypeIndex(): UseTypeIndexResult {
  const [index, setIndex] = useState<SpeciesTypes[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /*
   * Uma tentativa por sessão, salvo pedido explícito.
   *
   * O modal chama `load` num efeito, e o efeito redispara a cada render. Sem
   * esta trava, uma falha levava a: erro → render → efeito → nova busca → …
   * O erro nunca aparecia na tela e a API levava martelada em laço.
   */
  const tentou = useRef(false)
  const emVoo = useRef(false)

  const load = useCallback((force = false) => {
    if (emVoo.current) return
    if (!force && tentou.current) return

    tentou.current = true
    emVoo.current = true
    setLoading(true)
    setError(null)

    fetchTypeIndex(force)
      .then(setIndex)
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Falha ao montar o mapa de tipos.')
      })
      .finally(() => {
        emVoo.current = false
        setLoading(false)
      })
  }, [])

  return { index, loading, error, load }
}
