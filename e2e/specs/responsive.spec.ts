import type { Page } from '@playwright/test'
import { expect, test } from '../fixtures/test'
import { ALAKAZAM } from '../fixtures/species'
import { STAT_KEYS, growths } from '../support/formula'

/** iPhone SE — o menor aparelho que ainda vale suportar. */
const CELULAR = { width: 360, height: 740 }
const TABLET = { width: 768, height: 1024 }

/** Level 100 e quality 1 deixam a inversão exata, isolando o que se testa. */
const ESPECIME = {
  species: ALAKAZAM,
  growths: growths([1, 1, 1, 32, 1, 32]),
  level: 100,
  quality: 1,
  withIvTotal: false as const,
}

/** O `<body>` nunca pode rolar na horizontal: conteúdo largo rola no container dele. */
async function semRolagemHorizontal(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const el = document.documentElement
    return el.scrollWidth <= el.clientWidth
  })
}

test.describe('celular 360×740', () => {
  test.use({ viewport: CELULAR })

  test('a tela inicial não estoura na horizontal', async ({ app, page }) => {
    await expect(app.speciesInput).toBeVisible()

    expect(await semRolagemHorizontal(page)).toBe(true)
  })

  test('com resultado e comparação na tela, ainda não estoura', async ({ app, page }) => {
    await app.addToCompare({ ...ESPECIME, nickname: 'a' })
    await app.addToCompare({ ...ESPECIME, nickname: 'b', level: 90 })

    expect(await semRolagemHorizontal(page)).toBe(true)
  })

  test('todo campo de stat tem alvo de toque de 44px', async ({ app }) => {
    await app.searchSpecies(ALAKAZAM.slug)

    for (const key of STAT_KEYS) {
      const box = await app.statInput(key).boundingBox()
      expect(box, `campo ${key}`).not.toBeNull()
      expect(box!.height, `altura do campo ${key}`).toBeGreaterThanOrEqual(44)
    }
  })

  test('os botões de ação respeitam o alvo mínimo de toque', async ({ app }) => {
    await app.searchSpecies(ALAKAZAM.slug)

    for (const [nome, botao] of [
      ['tutorial', app.tutorialButton],
      ['comparar', app.addToCompareButton],
    ] as const) {
      const box = await botao.boundingBox()
      expect(box, nome).not.toBeNull()
      expect(box!.height, `altura de ${nome}`).toBeGreaterThanOrEqual(44)
      expect(box!.width, `largura de ${nome}`).toBeGreaterThanOrEqual(44)
    }
  })

  test('o modal de comparação rola sem estourar a página', async ({ app, page }) => {
    await app.addToCompare({ ...ESPECIME, nickname: 'a' })
    await app.addToCompare({ ...ESPECIME, nickname: 'b', level: 90 })
    await app.validateButton.click()

    await expect(app.compareModal).toBeVisible()
    // A tabela larga rola dentro do próprio container, não na página.
    await expect(app.compareTable).toBeVisible()
    expect(await semRolagemHorizontal(page)).toBe(true)
  })

  test('o tooltip aberto não estica a página', async ({ app, page }) => {
    await app.enterSpecimen(ESPECIME)
    await app.ivStatus.hover()

    await expect(app.ivStatusTooltip).toBeVisible()
    expect(await semRolagemHorizontal(page)).toBe(true)
  })

  test('o tutorial cabe na tela e as ações ficam alcançáveis', async ({ app, page }) => {
    await app.tutorialButton.click()

    await expect(app.tutorial).toBeVisible()
    await expect(app.tutorialNext).toBeInViewport()
    expect(await semRolagemHorizontal(page)).toBe(true)
  })
})

test.describe('tablet 768×1024', () => {
  test.use({ viewport: TABLET })

  test('não estoura na horizontal com tudo preenchido', async ({ app, page }) => {
    await app.enterSpecimen(ESPECIME)

    await expect(app.gradePanel).toBeVisible()
    expect(await semRolagemHorizontal(page)).toBe(true)
  })
})
