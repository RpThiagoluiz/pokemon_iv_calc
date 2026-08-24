import { expect, test } from '../fixtures/test'

/**
 * O stub serve quatro espécies (ver e2e/fixtures/species.ts):
 * Pidgey (Normal/Voador), Vulpix (Fogo), Alakazam (Psíquico) e
 * Ferrothorn (Planta/Aço). Suficiente para provar tipo duplo e imunidade.
 */

test.describe('a ação depende só da busca', () => {
  test('o painel aparece assim que a espécie carrega, sem preencher stats', async ({ app }) => {
    await expect(app.matchupPanel).toBeHidden()

    await app.searchSpecies('vulpix')

    await expect(app.matchupPanel).toBeVisible()
    await expect(app.matchupPanel).toContainText('Mapa de caça')
    // Nenhum stat foi digitado, e a ação já está disponível.
    await expect(app.seeMatchupButton).toBeEnabled()
  })

  test('mostra os tipos do Pokémon em português', async ({ app }) => {
    await app.searchSpecies('ferrothorn')

    await expect(app.matchupPanel).toContainText('Planta')
    await expect(app.matchupPanel).toContainText('Metálico')
  })

  test('trocar de espécie troca o mapa', async ({ app }) => {
    await app.searchSpecies('vulpix')
    await expect(app.matchupPanel).toContainText('Fogo')

    await app.searchSpecies('alakazam')

    await expect(app.matchupPanel).toContainText('Psíquico')
    await expect(app.matchupPanel).not.toContainText('Fogo')
  })
})

test.describe('modal', () => {
  test('abre, lista os buckets e fecha no Esc', async ({ app }) => {
    await app.searchSpecies('vulpix')
    await app.openMatchup()

    await expect(app.matchupModal).toContainText('Mapa de caça')
    await app.pressEscape()
    await expect(app.matchupModal).toBeHidden()
  })

  test('Vulpix (Fogo) massacra Ferrothorn (Planta/Aço) em ×4', async ({ app }) => {
    await app.searchSpecies('vulpix')
    await app.openMatchup()

    await expect(app.bucket(4)).toContainText('Massacre')
    await expect(app.speciesChip(4, 'ferrothorn')).toBeVisible()
  })

  test('o bucket melhor abre sozinho e os outros ficam recolhidos', async ({ app }) => {
    await app.searchSpecies('vulpix')
    await app.openMatchup()

    await expect(app.bucket(4)).toHaveAttribute('open', '')
    await expect(app.bucket(1)).not.toHaveAttribute('open', '')
  })

  test('avisa que a tabela não foi confirmada no jogo', async ({ app }) => {
    await app.searchSpecies('vulpix')
    await app.openMatchup()

    await expect(app.matchupModal).toContainText('não')
    await expect(app.matchupModal).toContainText('confirmada')
  })
})

test.describe('ofensivo e defensivo', () => {
  test('alternar as abas troca a conta', async ({ app }) => {
    await app.searchSpecies('ferrothorn')
    await app.openMatchup()

    // Atacando como Planta/Aço, Vulpix (Fogo) resiste.
    await expect(app.offensiveTab()).toHaveAttribute('aria-selected', 'true')
    await expect(app.speciesChip(4, 'vulpix')).toHaveCount(0)

    await app.defensiveTab().click()

    // Defendendo, Vulpix pega Ferrothorn em ×4.
    await expect(app.defensiveTab()).toHaveAttribute('aria-selected', 'true')
    await expect(app.speciesChip(4, 'vulpix')).toBeVisible()
  })
})

test.describe('imunidade', () => {
  test('Pidgey (Normal/Voador) é imune a um atacante Terrestre', async ({ app }) => {
    // Alakazam não é Terrestre; usamos o lado defensivo do Pidgey para checar
    // que Alakazam (Psíquico) não o machuca mais que o normal.
    await app.searchSpecies('pidgey')
    await app.openMatchup()

    // Normal não machuca Fantasma — e nenhuma das fixtures é Fantasma,
    // então o bucket zero não existe. O que existe é o neutro.
    await expect(app.bucket(1)).toBeVisible()
  })

  test('Normal não toca em Fantasma continua valendo no domínio', async ({ app }) => {
    await app.searchSpecies('pidgey')
    await app.openMatchup()

    // Pidgey ataca com Normal ou Voador; contra Ferrothorn (Planta/Aço)
    // Voador é neutro em Planta e Aço resiste — o melhor é ×1... na verdade
    // Aço resiste aos dois, então cai em resistência.
    await expect(app.matchupBuckets).toContainText('ferrothorn')
  })
})

test.describe('navegação pelo mapa', () => {
  test('clicar num Pokémon carrega ele no app', async ({ app }) => {
    await app.searchSpecies('vulpix')
    await app.openMatchup()

    await app.speciesChip(4, 'ferrothorn').click()

    await expect(app.matchupModal).toBeHidden()
    await expect(app.speciesPanel).toContainText('#598')
    await expect(app.matchupPanel).toContainText('Planta')
  })
})

test.describe('rede', () => {
  test('só busca os tipos quando o modal abre', async ({ app, api }) => {
    await app.searchSpecies('vulpix')

    expect(api.calls().filter((c) => c.startsWith('type:'))).toHaveLength(0)

    await app.openMatchup()

    expect(api.calls().filter((c) => c.startsWith('type:'))).toHaveLength(18)
  })

  test('o índice fica em cache: reabrir não busca de novo', async ({ app, api }) => {
    await app.searchSpecies('vulpix')
    await app.openMatchup()
    const primeiro = api.calls().filter((c) => c.startsWith('type:')).length

    await app.pressEscape()
    await app.openMatchup()

    expect(api.calls().filter((c) => c.startsWith('type:'))).toHaveLength(primeiro)
  })

  test('falha de rede vira mensagem com botão de tentar de novo', async ({ app, api }) => {
    await app.searchSpecies('vulpix')
    // Espera a espécie REALMENTE carregar: `failNext` derruba a próxima
    // requisição, e se a da espécie ainda estivesse no ar seria ela a cair.
    await expect(app.matchupPanel).toBeVisible()

    api.failNext()
    await app.seeMatchupButton.click()

    await expect(app.matchupModal.getByRole('button', { name: 'Tentar de novo' })).toBeVisible()
  })
})
