import { test as base } from '@playwright/test'
import { CalculatorPage } from '../pages/CalculatorPage'
import { stubPokeApi, type ApiStub } from './pokeapi'

interface Options {
  /**
   * O tutorial abre sozinho na primeira visita e cobriria a tela em todo
   * teste. Por padrão marcamos como visto ANTES de navegar; o spec do
   * tutorial faz `test.use({ skipOnboarding: false })` para vê-lo abrir.
   */
  skipOnboarding: boolean
}

interface Fixtures {
  /** Page Object já apontado para a app, com a PokeAPI interceptada. */
  app: CalculatorPage
  /** Controle do stub: conta chamadas e força falha de rede. */
  api: ApiStub
}

/**
 * `test` do projeto. Todo spec importa daqui, nunca de `@playwright/test`
 * direto — assim o stub da API, o onboarding e a navegação inicial ficam
 * garantidos em um lugar só, e nenhum teste esquece de montar o cenário.
 *
 * Cada teste roda em um contexto novo, então `localStorage` (cache de espécie,
 * overrides, onboarding) começa sempre limpo.
 */
export const test = base.extend<Options & Fixtures>({
  skipOnboarding: [true, { option: true }],

  api: async ({ page }, use) => {
    await use(await stubPokeApi(page))
  },

  app: async ({ page, api, skipOnboarding }, use) => {
    void api // garante que a rota é montada antes de qualquer navegação
    if (skipOnboarding) {
      await page.addInitScript(() => {
        try {
          localStorage.setItem('pokeivcalc:onboarding:seen', 'true')
        } catch {
          /* contexto sem storage: o tutorial abre, e o teste que trata disso */
        }
      })
    }
    const app = new CalculatorPage(page)
    await app.goto()
    await use(app)
  },
})

export { expect } from '@playwright/test'
