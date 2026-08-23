import { expect, test } from '../fixtures/test'

const REPO = 'https://github.com/RpThiagoluiz/pokemon_iv_calc'

test.describe('rodapé', () => {
  test('convida a dar estrela e aponta para o repositório', async ({ app }) => {
    const link = app.githubLink

    await expect(link).toBeVisible()
    await expect(link).toHaveAttribute('href', REPO)
    await expect(link).toContainText('GitHub')
  })

  test('o link abre em nova aba sem vazar o opener', async ({ app }) => {
    await expect(app.githubLink).toHaveAttribute('target', '_blank')
    await expect(app.githubLink).toHaveAttribute('rel', /noreferrer/)
  })

  test('o alvo de toque do link respeita o mínimo', async ({ app }) => {
    const box = await app.githubLink.boundingBox()

    expect(box).not.toBeNull()
    expect(box!.height).toBeGreaterThanOrEqual(44)
  })

  // `app` não é usado no corpo, mas é a fixture que navega: sem pedi-la, a
  // página fica em `about:blank` e todo seletor acha zero elementos.
  test('mantém o aviso de que a ferramenta não é oficial', async ({ app, page }) => {
    await expect(app.githubLink).toBeVisible()

    await expect(page.getByRole('contentinfo')).toContainText('não oficial')
  })
})

test.describe('estrutura da página', () => {
  test('tem os landmarks de header, main e footer', async ({ app, page }) => {
    await expect(app.githubLink).toBeVisible()

    await expect(page.getByRole('banner')).toBeVisible()
    await expect(page.getByRole('main')).toBeVisible()
    await expect(page.getByRole('contentinfo')).toBeVisible()
  })

  test('o skip link aparece no primeiro Tab e leva ao conteúdo', async ({ app, page }) => {
    await page.keyboard.press('Tab')

    await expect(app.skipLink).toBeFocused()
    await expect(app.skipLink).toBeInViewport()

    await page.keyboard.press('Enter')

    await expect(page).toHaveURL(/#conteudo$/)
  })

  test('o botão de tutorial é alcançável por teclado', async ({ app, page }) => {
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')

    await expect(app.tutorialButton).toBeFocused()
  })
})
