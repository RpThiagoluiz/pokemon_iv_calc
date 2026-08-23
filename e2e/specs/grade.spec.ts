import { expect, test } from '../fixtures/test'
import { ALAKAZAM } from '../fixtures/species'
import { fill, growths } from '../support/formula'

/**
 * O Alakazam é o caso didático: SpA (135) e Vel (120) dominam, então o grade
 * tem que premiar IV que cai ali e ignorar IV que cai em Atk/Def.
 *
 * Level 100 e quality 1 deixam a inversão exata, isolando o que se quer testar.
 */
const exato = { level: 100, quality: 1, withIvTotal: false as const }

test.describe('grade de distribuição', () => {
  test('32 em tudo é SS, e a tag não aparece porque seria ruído', async ({ app }) => {
    await app.enterSpecimen({ species: ALAKAZAM, growths: fill(32), ...exato })

    await expect(app.gradeLabel).toHaveText('SS')
    await expect(app.perfectRollsTag).toBeHidden()
  })

  test('IV alto nos stats errados afunda o grade', async ({ app }) => {
    // IV total 136/192 — alto — mas quase nada em SpA/Vel.
    await app.enterSpecimen({ species: ALAKAZAM, growths: growths([32, 32, 32, 4, 32, 4]), ...exato })

    await expect(app.gradeLabel).toHaveText('D')
    await expect(app.perfectRollsTag).toBeHidden()
  })

  test('32 só em SpA e Vel, lixo no resto, ainda chega a A', async ({ app }) => {
    // IV total 68/192 — metade do caso acima — e mesmo assim muito melhor.
    await app.enterSpecimen({ species: ALAKAZAM, growths: growths([1, 1, 1, 32, 1, 32]), ...exato })

    await expect(app.gradeLabel).toHaveText('A')
  })

  test('SS não exige 32 em tudo: os stats pesados é que decidem', async ({ app }) => {
    // 32 em SpA/SpD/Vel e 16 no resto → IV total 144/192.
    await app.enterSpecimen({
      species: ALAKAZAM,
      growths: growths([16, 16, 16, 32, 32, 32]),
      ...exato,
    })

    await expect(app.gradeLabel).toHaveText('SS')
  })

  test('ambiguidade vira intervalo de grade, não um número inventado', async ({ app }) => {
    await app.enterSpecimen({
      species: ALAKAZAM,
      growths: fill(16),
      level: 8,
      quality: 1.2,
      withIvTotal: false,
    })

    await expect(app.gradeLabel).toContainText('–')
    await expect(app.gradePanel).toContainText('Os IVs estão ambíguos')
  })
})

test.describe('tag de IVs perfeitos no lugar certo', () => {
  test('acende com 2 IVs em 32 nos stats principais e explica no tooltip', async ({ app }) => {
    await app.enterSpecimen({ species: ALAKAZAM, growths: growths([1, 1, 1, 32, 1, 32]), ...exato })

    await expect(app.gradeLabel).toHaveText('A')
    await expect(app.perfectRollsTag).toBeVisible()
    await expect(app.perfectRollsTag).toContainText('2 IVs perfeitos no lugar certo')

    // O tooltip só aparece no hover, e precisa nomear os stats certos.
    await expect(app.perfectRollsTooltip).not.toBeVisible()
    await app.perfectRollsTag.hover()
    await expect(app.perfectRollsTooltip).toBeVisible()
    await expect(app.perfectRollsTooltip).toContainText('Tier A')
    await expect(app.perfectRollsTooltip).toContainText('SpA e Vel em 32/32')
  })

  test('não acende com um único 32 no lugar certo', async ({ app }) => {
    await app.enterSpecimen({ species: ALAKAZAM, growths: growths([1, 1, 1, 32, 1, 1]), ...exato })

    await expect(app.gradeLabel).toHaveText('C')
    await expect(app.perfectRollsTag).toBeHidden()
  })

  test('não acende com 32 caído em stat irrelevante', async ({ app }) => {
    await app.enterSpecimen({ species: ALAKAZAM, growths: growths([32, 32, 32, 4, 32, 4]), ...exato })

    await expect(app.perfectRollsTag).toBeHidden()
  })

  test('o tooltip é acessível por teclado', async ({ app }) => {
    await app.enterSpecimen({ species: ALAKAZAM, growths: growths([1, 1, 1, 32, 1, 32]), ...exato })

    await app.perfectRollsTag.focus()
    await expect(app.perfectRollsTooltip).toBeVisible()
  })
})

test.describe('pesos manuais', () => {
  test('redefinir os pesos muda o grade e marca que são manuais', async ({ app }) => {
    await app.enterSpecimen({ species: ALAKAZAM, growths: growths([32, 32, 32, 4, 32, 4]), ...exato })
    await expect(app.gradeLabel).toHaveText('D')

    // Declara Atk como o que importa: o mesmo espécime vira outro bicho.
    await app.weightSlider('spa').fill('0')
    await app.weightSlider('spe').fill('0')
    await app.weightSlider('atk').fill('1')

    await expect(app.gradePanel).toContainText('pesos manuais')
    await expect(app.gradeLabel).not.toHaveText('D')
  })

  test('os pesos manuais sobrevivem a uma troca de espécie e voltam', async ({ app }) => {
    await app.enterSpecimen({ species: ALAKAZAM, growths: fill(16), ...exato })
    await app.weightSlider('atk').fill('1')
    await expect(app.gradePanel).toContainText('pesos manuais')

    await app.searchSpecies('vulpix')
    await app.searchSpecies('alakazam')
    await app.enterSpecimen({ species: ALAKAZAM, growths: fill(16), ...exato })

    await expect(app.gradePanel).toContainText('pesos manuais')
    await expect(app.weightSlider('atk')).toHaveValue('1')
  })
})
