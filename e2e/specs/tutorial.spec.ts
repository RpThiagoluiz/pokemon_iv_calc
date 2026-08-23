import { expect, test } from '../fixtures/test'

/**
 * Quantos passos o tutorial tem, como valor esperado — não importado de
 * `src/`. Mudou o conteúdo? Este número muda junto, de propósito: é a chance
 * de reler se os passos ainda contam a história certa.
 */
const TOTAL = 5

test.describe('primeira visita', () => {
  // Único spec que NÃO marca o onboarding como visto: aqui queremos vê-lo abrir.
  test.use({ skipOnboarding: false })

  test('o tutorial abre sozinho', async ({ app }) => {
    await expect(app.tutorial).toBeVisible()
    await expect(app.tutorial).toContainText(`Passo 1 de ${TOTAL}`)
  })

  test('Avançar e Voltar percorrem os passos', async ({ app }) => {
    await expect(app.tutorialBack).toBeDisabled()

    await app.tutorialNext.click()
    await expect(app.tutorial).toContainText(`Passo 2 de ${TOTAL}`)
    await expect(app.tutorialBack).toBeEnabled()

    await app.tutorialBack.click()
    await expect(app.tutorial).toContainText(`Passo 1 de ${TOTAL}`)
  })

  test('o último passo troca Avançar por Começar', async ({ app }) => {
    for (let i = 0; i < TOTAL - 1; i++) await app.tutorialNext.click()

    await expect(app.tutorialNext).toHaveCount(0)
    await expect(app.tutorialStart).toBeVisible()
  })

  test('explica como o cálculo funciona', async ({ app }) => {
    await app.tutorialGoTo(2)

    await expect(app.tutorialTitle).toContainText('Como a conta é feita')
    await expect(app.tutorial).toContainText('base + 2 × growth')
    await expect(app.tutorial).toContainText('round')
  })

  test('os pontinhos navegam e marcam o passo atual', async ({ app }) => {
    await app.tutorialGoTo(3)

    await expect(app.tutorial).toContainText(`Passo 4 de ${TOTAL}`)
    await expect(app.tutorialCurrentDot).toHaveAttribute('aria-label', /^Passo 4:/)
  })

  test('as setas do teclado navegam', async ({ app, page }) => {
    await page.keyboard.press('ArrowRight')
    await expect(app.tutorial).toContainText(`Passo 2 de ${TOTAL}`)

    await page.keyboard.press('ArrowLeft')
    await expect(app.tutorial).toContainText(`Passo 1 de ${TOTAL}`)
  })

  test('Pular fecha, marca como visto e não reabre no reload', async ({ app, page }) => {
    await app.tutorialSkip.click()

    await expect(app.tutorial).toBeHidden()
    expect(await app.onboardingSeen()).toBe(true)

    await page.reload()

    await expect(app.tutorial).toBeHidden()
  })

  test('Começar também marca como visto', async ({ app }) => {
    for (let i = 0; i < TOTAL - 1; i++) await app.tutorialNext.click()
    await app.tutorialStart.click()

    await expect(app.tutorial).toBeHidden()
    expect(await app.onboardingSeen()).toBe(true)
  })

  test('Esc fecha e marca como visto', async ({ app }) => {
    await app.pressEscape()

    await expect(app.tutorial).toBeHidden()
    expect(await app.onboardingSeen()).toBe(true)
  })
})

test.describe('visitas seguintes', () => {
  test('o tutorial não abre sozinho', async ({ app }) => {
    await expect(app.tutorial).toBeHidden()
  })

  test('o botão de ajuda reabre, sempre do primeiro passo', async ({ app }) => {
    await app.tutorialButton.click()
    await expect(app.tutorial).toBeVisible()
    await app.tutorialNext.click()
    await expect(app.tutorial).toContainText(`Passo 2 de ${TOTAL}`)

    await app.pressEscape()
    await app.tutorialButton.click()

    await expect(app.tutorial).toContainText(`Passo 1 de ${TOTAL}`)
  })

  test('fechar o tutorial devolve o app utilizável', async ({ app }) => {
    await app.tutorialButton.click()
    await app.pressEscape()

    await app.searchSpecies('vulpix')

    await expect(app.speciesPanel).toContainText('#037')
  })
})
