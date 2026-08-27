import { expect, test } from '../fixtures/test'
import { GENGAR, VULPIX } from '../fixtures/species'
import { STAT_KEYS, fill, growths, ivTotalOf, sumOf } from '../support/formula'

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
    await expect(app.ivPanel).toContainText('Suba de level e recalcule')
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

  test('Power e quality aparecem à parte do grade', async ({ app }) => {
    const stats = await app.enterSpecimen({
      species: VULPIX,
      growths: growths([12, 30, 3, 28, 19, 9]),
      level: 78,
      quality: 1.45,
    })

    await expect(app.powerValue).toHaveText(
      (sumOf(stats) * 1.45).toLocaleString('pt-BR', { maximumFractionDigits: 1 }),
    )
    await expect(app.qualityValue).toHaveText('1.45')
  })
})

test.describe('tooltip da tag de status', () => {
  test('em "exato", explica por que a solução é única para este espécime', async ({ app }) => {
    await app.enterSpecimen({
      species: VULPIX,
      growths: growths([12, 30, 3, 28, 19, 9]),
      level: 78,
      quality: 1.45,
    })
    await expect(app.ivStatus).toHaveText('exato')

    await expect(app.ivStatusTooltip).not.toBeVisible()
    await app.ivStatus.hover()

    await expect(app.ivStatusTooltip).toBeVisible()
    await expect(app.ivStatusTooltip).toContainText('Solução única')
    // Cita os valores DESTE espécime, não um texto genérico.
    await expect(app.ivStatusTooltip).toContainText('level 78')
    await expect(app.ivStatusTooltip).toContainText('quality 1.45')
    await expect(app.ivStatusTooltip).toContainText('101/192')
  })

  test('em "ambíguo", explica a causa e o que fazer', async ({ app }) => {
    await app.enterSpecimen({
      species: VULPIX,
      growths: fill(16),
      level: 8,
      quality: 1.2,
      withIvTotal: false,
    })
    await expect(app.ivStatus).toHaveText('ambíguo')

    await app.ivStatus.hover()

    await expect(app.ivStatusTooltip).toContainText('combinações de growths')
    await expect(app.ivStatusTooltip).toContainText('não é erro de digitação')
    await expect(app.ivStatusTooltip).toContainText('Informe o IV total')
  })

  test('o tooltip abre por teclado', async ({ app }) => {
    await app.enterSpecimen({
      species: VULPIX,
      growths: growths([12, 30, 3, 28, 19, 9]),
      level: 78,
      quality: 1.45,
    })

    await app.ivStatus.focus()

    await expect(app.ivStatusTooltip).toBeVisible()
  })
})

test.describe('o IV total informado muda o que aparece na tela', () => {
  /**
   * Regressão: com o Gengar em level baixo, digitar o IV total não mexia no
   * total exibido — a tela recompunha o número somando as faixas por stat, o
   * que produz totais que nenhuma combinação atinge.
   */
  const GENGAR_LOW = {
    species: GENGAR,
    growths: growths([30, 18, 22, 32, 21, 26]), // soma 149
    level: 12,
    quality: 1.43,
  }

  test('sem o IV total o resultado é uma faixa; com ele, colapsa no número', async ({ app }) => {
    await app.enterSpecimen({ ...GENGAR_LOW, withIvTotal: false })

    await expect(app.ivStatus).toHaveText('ambíguo')
    const semTotal = (await app.ivTotalResult.innerText()).trim()
    expect(semTotal).toContain('–')

    await app.ivTotalInput.fill('149')

    await expect(app.ivTotalResult).toContainText('149')
    await expect(app.ivTotalResult).not.toHaveText(semTotal)
  })

  test('o total exibido deixa de ser uma faixa', async ({ app }) => {
    await app.enterSpecimen(GENGAR_LOW)

    const texto = (await app.ivTotalResult.innerText()).trim()
    expect(texto.split('/')[0]).toBe('149')
  })

  test('apagar o IV total devolve a faixa', async ({ app }) => {
    await app.enterSpecimen(GENGAR_LOW)
    await expect(app.ivTotalResult).toContainText('149')

    await app.ivTotalInput.fill('')

    await expect(app.ivTotalResult).toContainText('–')
  })
})
