import type { Page, Route } from '@playwright/test'
import { ALL_SPECIES, toPokeApiPayload } from './species'

const ENDPOINT = 'https://pokeapi.co/api/v2/pokemon/**'

export interface ApiStub {
  /** Quantas chamadas de rede chegaram até aqui — prova que o cache funciona. */
  calls: () => string[]
  /** Faz a próxima chamada falhar como se a rede tivesse caído. */
  failNext: () => void
}

/**
 * Intercepta a PokeAPI e responde com as fixtures locais.
 *
 * E2E que depende de rede externa é e2e que falha na sexta-feira à noite por
 * motivo alheio ao código. Aqui o app roda inteiro — fetch, cache, render —
 * mas o payload é determinístico.
 */
export async function stubPokeApi(page: Page): Promise<ApiStub> {
  const calls: string[] = []
  let shouldFail = false

  await page.route(ENDPOINT, async (route: Route) => {
    const slug = decodeURIComponent(new URL(route.request().url()).pathname.split('/').pop() ?? '')
    calls.push(slug)

    if (shouldFail) {
      shouldFail = false
      await route.abort('failed')
      return
    }

    const species = ALL_SPECIES.find((s) => s.slug === slug || String(s.id) === slug)
    if (!species) {
      await route.fulfill({ status: 404, contentType: 'application/json', body: '{}' })
      return
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(toPokeApiPayload(species)),
    })
  })

  return {
    calls: () => [...calls],
    failNext: () => {
      shouldFail = true
    },
  }
}
