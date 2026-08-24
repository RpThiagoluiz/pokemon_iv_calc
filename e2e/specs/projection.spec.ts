import { VULPIX } from '../fixtures/species'
import { expect, test } from '../fixtures/test'
import { fill, growths } from '../support/formula'

/** Espécime exato: com solução única a projeção não tem faixa e os números são cravados. */
const EXATO = {
  species: VULPIX,
  growths: growths([12, 30, 3, 28, 19, 9]),
  level: 78,
  quality: 1.45,
}

const soParaAbrir = async (app: import('../pages/CalculatorPage').CalculatorPage) => {
  await app.enterSpecimen(EXATO)
  await app.openProjection()
}

test.describe('ação de evolução', () => {
  test('o botão só aparece quando existe solução', async ({ app }) => {
    await app.enterSpecimen(EXATO)
    await expect(app.seeProjectionButton).toBeVisible()

    // Um stat impossível derruba a solução — e some a ação junto.
    await app.statInput('spa').fill('9999')

    await expect(app.seeProjectionButton).toBeHidden()
  })

  test('não aparece antes de preencher o Pokémon', async ({ app }) => {
    await app.searchSpecies('vulpix')
    await expect(app.seeProjectionButton).toBeHidden()
  })

  test('abre o modal e fecha no Esc', async ({ app }) => {
    await soParaAbrir(app)
    await expect(app.projectionModal).toContainText('Futuro')

    await app.pressEscape()

    await expect(app.projectionModal).toBeHidden()
  })
})

test.describe('marcos', () => {
  test('mostra o level atual e os dois seguintes, de 20 em 20', async ({ app }) => {
    await soParaAbrir(app)

    await expect(app.milestones).toHaveCount(3)
    await expect(app.milestones.nth(0)).toContainText('Agora · level 78')
    await expect(app.milestones.nth(1)).toContainText('Level 98')
    await expect(app.milestones.nth(2)).toContainText('Level 118')
  })

  test('o primeiro marco é o Power de agora, sem variação', async ({ app }) => {
    await app.enterSpecimen(EXATO)
    const agora = (await app.powerValue.innerText()).trim()
    await app.openProjection()

    await expect(app.milestones.nth(0)).toContainText('Power atual')
    // O Power do card e o do marco falam do mesmo level.
    await expect(app.milestones.nth(0)).toContainText(agora.split(',')[0])
  })

  test('os marcos seguintes crescem', async ({ app }) => {
    await soParaAbrir(app)

    await expect(app.milestones.nth(1)).toContainText('+')
    await expect(app.milestones.nth(2)).toContainText('+')
  })
})

test.describe('level alvo', () => {
  test('trocar o alvo muda o Power projetado', async ({ app }) => {
    await soParaAbrir(app)
    const antes = await app.targetPower.innerText()

    await app.setTargetLevel(600)

    await expect(app.targetPower).not.toHaveText(antes)
    await expect(app.projectionModal).toContainText('No level 600')
  })

  test('aceita o teto de 1000', async ({ app }) => {
    await soParaAbrir(app)
    await app.setTargetLevel(1000)
    await app.openStepsTable()

    await expect(app.projectionModal).toContainText('No level 1000')
    // 78, 98, ... 978 (46 marcos) mais o alvo 1000, mais o cabeçalho.
    // O 998 é descartado por cair colado no alvo — ver projectSeries.
    await expect(app.stepsTable.getByRole('row')).toHaveCount(48)
    await expect(app.stepsTable).not.toContainText('998')
  })

  test('dobrar o level dobra o Power — a fórmula é linear no level', async ({ app }) => {
    await soParaAbrir(app)
    await app.setTargetLevel(156) // 2× o level 78

    await expect(app.projectionModal).toContainText('+100')
  })
})

test.describe('gráficos e tabela', () => {
  test('desenha os dois gráficos separados', async ({ app }) => {
    await soParaAbrir(app)

    await expect(app.powerChart).toBeVisible()
    await expect(app.statsChart).toBeVisible()
    // Escalas diferentes exigem gráficos separados, nunca dois eixos y.
    await expect(app.powerChart.locator('polyline')).toHaveCount(1)
    await expect(app.statsChart.locator('polyline')).toHaveCount(6)
  })

  test('a legenda nomeia os seis stats — identidade nunca só por cor', async ({ app }) => {
    await soParaAbrir(app)

    for (const label of ['HP', 'Atk', 'Def', 'SpA', 'SpD', 'Vel']) {
      await expect(app.statsChart.getByRole('button', { name: label })).toBeVisible()
    }
  })

  test('a tabela repete o que o gráfico mostra', async ({ app }) => {
    await soParaAbrir(app)
    await app.setTargetLevel(156)

    // O level entra linear na fórmula, então dobrar o level dobra o stat.
    const linhaHp = app.projectionTable.getByRole('row').filter({ hasText: 'HP' })
    await expect(linhaHp).toContainText('69') // level 78
    await expect(linhaHp).toContainText('138') // level 156
  })

  test('solução exata não mostra aviso de aproximação', async ({ app }) => {
    await soParaAbrir(app)
    await expect(app.projectionModal).not.toContainText('projeção é aproximada')
  })
})

test.describe('quando os IVs são ambíguos', () => {
  test('avisa que a projeção é aproximada', async ({ app }) => {
    await app.enterSpecimen({
      species: VULPIX,
      growths: fill(16),
      level: 8,
      quality: 1.2,
      withIvTotal: false,
    })
    await app.openProjection()

    await expect(app.projectionModal).toContainText('projeção é aproximada')
  })
})

test.describe('trocar de espécie', () => {
  test('fecha a projeção junto com o resto', async ({ app }) => {
    await soParaAbrir(app)
    await app.pressEscape()

    await app.searchSpecies('alakazam')

    await expect(app.projectionModal).toBeHidden()
    await expect(app.seeProjectionButton).toBeHidden()
  })
})
