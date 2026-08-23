import { expect, test } from '../fixtures/test'
import { ALAKAZAM, VULPIX } from '../fixtures/species'
import type { CalculatorPage } from '../pages/CalculatorPage'
import { fill, growths } from '../support/formula'

/** Level 100 e quality 1 deixam a inversão exata, isolando o que se testa. */
const exato = { level: 100, quality: 1, withIvTotal: false as const }

/** Três Alakazam bem separados: SS, A e D. */
const PERFEITO = { species: ALAKAZAM, growths: fill(32), ...exato, nickname: 'perfeito' }
const FOCADO = {
  species: ALAKAZAM,
  growths: growths([1, 1, 1, 32, 1, 32]),
  ...exato,
  nickname: 'focado',
}
const LIXO = {
  species: ALAKAZAM,
  growths: growths([32, 32, 32, 4, 32, 4]),
  ...exato,
  nickname: 'lixo',
}

async function montar(app: CalculatorPage, specs: Array<typeof PERFEITO>) {
  for (const spec of specs) await app.addToCompare(spec)
}

test.describe('montar a comparação', () => {
  test('adicionar espécimes empilha na lista com apelido e grade', async ({ app }) => {
    await montar(app, [FOCADO, LIXO])

    await expect(app.compareItems).toHaveCount(2)
    await expect(app.compareItems.nth(0)).toContainText('focado')
    await expect(app.compareItems.nth(0)).toContainText('A')
    await expect(app.compareItems.nth(1)).toContainText('lixo')
  })

  test('sem apelido, ganha um rótulo gerado', async ({ app }) => {
    await app.addToCompare({ ...FOCADO, nickname: '' })

    await expect(app.compareItems.nth(0)).toContainText('Pokémon 1')
  })

  test('validar só libera com dois espécimes', async ({ app }) => {
    await app.addToCompare(FOCADO)

    await expect(app.validateButton).toBeDisabled()
    await expect(app.comparePanel).toContainText('Faltam 1 para comparar')

    await app.addToCompare(LIXO)

    await expect(app.validateButton).toBeEnabled()
  })

  test('trava em cinco espécimes', async ({ app }) => {
    for (let i = 0; i < 5; i++) {
      await app.addToCompare({ ...FOCADO, nickname: `n${i}` })
    }

    await expect(app.compareItems).toHaveCount(5)
    await expect(app.addToCompareButton).toBeDisabled()
    await expect(app.comparePanel).toContainText('Máximo de 5 atingido')
  })

  test('remover tira só o espécime escolhido', async ({ app }) => {
    await montar(app, [FOCADO, LIXO])

    await app.removeFromCompare('focado')

    await expect(app.compareItems).toHaveCount(1)
    await expect(app.compareItems.nth(0)).toContainText('lixo')
  })

  test('limpar esvazia a comparação', async ({ app }) => {
    await montar(app, [FOCADO, LIXO])

    await app.clearCompareButton.click()

    await expect(app.compareItems).toHaveCount(0)
  })

  test('não dá para comparar um espécime que não fecha', async ({ app }) => {
    await app.enterSpecimen(FOCADO)
    await app.statInput('spa').fill('9999')

    await expect(app.addToCompareButton).toBeDisabled()
    await expect(app.comparePanel).toContainText('não fecha com nenhuma combinação')
  })

  test('trocar de espécie zera a comparação', async ({ app }) => {
    await montar(app, [FOCADO, LIXO])
    await expect(app.compareItems).toHaveCount(2)

    await app.searchSpecies(VULPIX.slug)

    await expect(app.compareItems).toHaveCount(0)
  })
})

test.describe('modal de comparação', () => {
  test('ranqueia do melhor para o pior', async ({ app }) => {
    await montar(app, [LIXO, PERFEITO, FOCADO])
    await app.validateButton.click()

    await expect(app.compareModal).toBeVisible()
    expect(await app.podiumOrder()).toEqual(['perfeito', 'focado', 'lixo'])
  })

  test('agrupa por tier, pulando os grades vazios', async ({ app }) => {
    await montar(app, [LIXO, PERFEITO, FOCADO])
    await app.validateButton.click()

    await expect(app.gradeGroup('SS')).toContainText('perfeito')
    await expect(app.gradeGroup('A')).toContainText('focado')
    await expect(app.gradeGroup('D')).toContainText('lixo')
    await expect(app.gradeGroup('B')).toHaveCount(0)
  })

  test('mostra level, quality, Power e IV total de cada um', async ({ app }) => {
    await app.addToCompare({ ...FOCADO, level: 80, quality: 1.4, nickname: 'a' })
    await app.addToCompare({ ...LIXO, level: 90, quality: 1.2, nickname: 'b' })
    await app.validateButton.click()

    const tabela = app.compareTable
    await expect(tabela).toContainText('80')
    await expect(tabela).toContainText('1.4')
    await expect(tabela).toContainText('90')
    await expect(tabela).toContainText('1.2')
    await expect(tabela).toContainText('Power')
    await expect(tabela).toContainText('IV total')
  })

  test('destaca o melhor growth de cada stat', async ({ app }) => {
    await montar(app, [FOCADO, LIXO])
    await app.validateButton.click()

    // `focado` tem 32 em SpA, `lixo` tem 4 — o ▲ vai para focado.
    // Asserção pelo marcador, não pela classe: o destaque não pode depender só de cor.
    const idFocado = 'alakazam-100-1-0'
    const idLixo = 'alakazam-100-1-1'
    await expect(app.compareCell('spa', idFocado)).toContainText('▲')
    await expect(app.compareCell('spa', idLixo)).not.toContainText('▲')
    // E em Atk é o contrário.
    await expect(app.compareCell('atk', idLixo)).toContainText('▲')
  })

  test('avisa quando algum espécime ficou ambíguo', async ({ app }) => {
    await app.addToCompare({
      species: ALAKAZAM,
      growths: fill(16),
      level: 8,
      quality: 1.2,
      withIvTotal: false,
      nickname: 'incerto',
    })
    await app.addToCompare({ ...FOCADO, level: 8, quality: 1.2, nickname: 'outro' })
    await app.validateButton.click()

    await expect(app.compareModal).toContainText('comparação é aproximada')
  })

  test('fecha no botão e no Esc', async ({ app }) => {
    await montar(app, [FOCADO, LIXO])

    await app.validateButton.click()
    await expect(app.compareModal).toBeVisible()
    await app.closeCompareModal()
    await expect(app.compareModal).toBeHidden()

    await app.validateButton.click()
    await expect(app.compareModal).toBeVisible()
    await app.pressEscape()
    await expect(app.compareModal).toBeHidden()
  })

  test('a lista sobrevive ao fechar o modal', async ({ app }) => {
    await montar(app, [FOCADO, LIXO])
    await app.validateButton.click()
    await app.closeCompareModal()

    await expect(app.compareItems).toHaveCount(2)
  })
})
