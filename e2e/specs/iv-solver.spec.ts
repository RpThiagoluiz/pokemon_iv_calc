import { expect, test } from '../fixtures/test'
import { VULPIX } from '../fixtures/species'
import { STAT_KEYS, fill, growths, ivTotalOf } from '../support/formula'

test.describe('inversão de IVs', () => {
  test('recupera exatamente os growths a partir dos stats exibidos', async ({ app }) => {
    const g = growths([12, 30, 3, 28, 19, 9])

    await app.enterSpecimen({ species: VULPIX, growths: g, level: 78, quality: 1.45 })

    await expect(app.ivStatus).toHaveText('exato')
    const resolved = await app.readResolvedIvs()
    for (const key of STAT_KEYS) {
      expect(resolved[key], `growth de ${key}`).toBe(String(g[key]))
    }
    await expect(app.ivTotalResult).toContainText(String(ivTotalOf(g)))
  })

  test('level alto dispensa o IV total e ainda dá solução única', async ({ app }) => {
    const g = growths([31, 4, 18, 32, 7, 25])

    await app.enterSpecimen({
      species: VULPIX,
      growths: g,
      level: 100,
      quality: 1.35,
      withIvTotal: false,
    })

    await expect(app.ivStatus).toHaveText('exato')
    const resolved = await app.readResolvedIvs()
    for (const key of STAT_KEYS) expect(resolved[key]).toBe(String(g[key]))
  })

  test('level baixo devolve faixas em vez de fingir precisão', async ({ app }) => {
    await app.enterSpecimen({
      species: VULPIX,
      growths: fill(16),
      level: 8,
      quality: 1.2,
      withIvTotal: false,
    })

    await expect(app.ivStatus).toHaveText('ambíguo')
    await expect(app.ivPanel).toContainText('combinações compatíveis')
    // Toda faixa precisa conter o growth verdadeiro.
    const resolved = await app.readResolvedIvs()
    for (const key of STAT_KEYS) {
      const [min, max] = resolved[key].split('–').map(Number)
      expect(min).toBeLessThanOrEqual(16)
      expect(max ?? min).toBeGreaterThanOrEqual(16)
    }
  })

  test('stat impossível é reportado com o nome do stat', async ({ app }) => {
    await app.enterSpecimen({
      species: VULPIX,
      growths: fill(16),
      level: 100,
      quality: 1,
      withIvTotal: false,
    })
    await app.statInput('spa').fill('9999')

    await expect(app.ivPanel).toContainText('Nenhum growth de 1 a 32 reproduz o valor de SpA')
  })

  test('IV total incompatível com os stats é rejeitado', async ({ app }) => {
    await app.enterSpecimen({
      species: VULPIX,
      growths: fill(16),
      level: 100,
      quality: 1,
      withIvTotal: false,
    })
    await app.ivTotalInput.fill('192')

    await expect(app.ivPanel).toContainText('IV total')
  })

  test('o modo de fórmula errado torna os stats inexplicáveis', async ({ app }) => {
    await app.enterSpecimen({
      species: VULPIX,
      growths: fill(30),
      level: 100,
      quality: 1.7,
      withIvTotal: false,
    })
    await expect(app.ivStatus).toHaveText('exato')

    await app.setFormulaMode('official')

    await expect(app.ivPanel).toContainText('Nenhum growth')
  })

  test('Power e tier de quality aparecem à parte do grade', async ({ app }) => {
    const stats = await app.enterSpecimen({
      species: VULPIX,
      growths: growths([12, 30, 3, 28, 19, 9]),
      level: 78,
      quality: 1.45,
    })

    const soma = STAT_KEYS.reduce((acc, key) => acc + stats[key], 0)
    await expect(app.powerValue).toHaveText(
      (soma * 1.45).toLocaleString('pt-BR', { maximumFractionDigits: 1 }),
    )
    await expect(app.qualityTier).toHaveText('Epic')
  })
})
