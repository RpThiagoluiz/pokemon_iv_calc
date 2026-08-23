import { test as base } from '@playwright/test'
import { CalculatorPage } from '../pages/CalculatorPage'
import { stubPokeApi, type ApiStub } from './pokeapi'

interface Fixtures {
  /** Page Object já apontado para a app, com a PokeAPI interceptada. */
  app: CalculatorPage
  /** Controle do stub: conta chamadas e força falha de rede. */
  api: ApiStub
}

/**
 * `test` do projeto. Todo spec importa daqui, nunca de `@playwright/test`
 * direto — assim o stub da API e a navegação inicial ficam garantidos em um
 * lugar só, e nenhum teste esquece de montar o cenário.
 *
 * Cada teste roda em um contexto novo, então `localStorage` (cache de espécie,
 * overrides, pesos, calibração) começa sempre limpo.
 */
export const test = base.extend<Fixtures>({
  api: async ({ page }, use) => {
    await use(await stubPokeApi(page))
  },
  app: async ({ page, api }, use) => {
    void api // garante que a rota é montada antes de qualquer navegação
    const app = new CalculatorPage(page)
    await app.goto()
    await use(app)
  },
})

export { expect } from '@playwright/test'
