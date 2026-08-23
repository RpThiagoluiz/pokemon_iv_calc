import { expect, test } from '../fixtures/test'
import { ALAKAZAM, VULPIX } from '../fixtures/species'
import type { CalculatorPage } from '../pages/CalculatorPage'
import { STAT_KEYS, growths } from '../support/formula'

const CAMPOS = ['nickname', 'level', 'quality', 'ivTotal', ...STAT_KEYS]

async function preencherVulpix(app: CalculatorPage) {
  await app.enterSpecimen({
    species: VULPIX,
    growths: growths([12, 30, 3, 28, 19, 9]),
    level: 78,
    quality: 1.45,
  })
}

test.describe('busca de espécie', () => {
  test('carrega os base stats da espécie', async ({ app }) => {
    await app.searchSpecies('vulpix')

    await expect(app.speciesPanel).toContainText('#37')
    expect(await app.readBaseStats()).toEqual(VULPIX.baseStats)
  })

  test('nome inexistente mostra erro e preserva o que estava na tela', async ({ app }) => {
    await preencherVulpix(app)

    await app.searchSpecies('naoexistepokemon')

    await expect(app.speciesError).toBeVisible()
    // Um erro de digitação não pode destruir a sessão.
    await expect(app.speciesPanel).toContainText('#37')
    const form = await app.readSpecimenForm()
    expect(form.level).toBe('78')
    await expect(app.ivStatus).toHaveText('exato')
  })

  test('cache: rebuscar a mesma espécie não chama a API de novo', async ({ app, api }) => {
    await app.searchSpecies('vulpix')
    expect(api.calls()).toEqual(['vulpix'])

    await app.searchSpecies('vulpix')

    expect(api.calls()).toEqual(['vulpix'])
  })

  test('Recarregar força uma nova chamada', async ({ app, api }) => {
    await app.searchSpecies('vulpix')
    await app.reloadSpecies()

    expect(api.calls()).toEqual(['vulpix', 'vulpix'])
  })

  test('falha de rede vira mensagem, não tela branca', async ({ app, api }) => {
    api.failNext()
    await app.searchSpecies('vulpix')

    await expect(app.speciesPanel).toContainText('Não foi possível falar com a PokeAPI')
  })

  test('base stat sobrescrito é marcado e muda o IV resolvido', async ({ app }) => {
    await app.enterSpecimen({
      species: VULPIX,
      growths: growths([12, 30, 3, 28, 19, 9]),
      level: 78,
      quality: 1.45,
      withIvTotal: false,
    })
    await expect(app.ivResult('spa')).toContainText('28')

    await app.overrideBaseStat('spa', 60)

    await expect(app.speciesPanel).toContainText('sobrescrito')
    // Mesmo stat exibido, base maior → o growth necessário cai.
    await expect(app.ivResult('spa')).toContainText('23')
  })

  test('IV total que não fecha com os stats é reportado', async ({ app }) => {
    await preencherVulpix(app)
    await expect(app.ivStatus).toHaveText('exato')

    await app.overrideBaseStat('spa', 60)

    await expect(app.ivPanel).toContainText('IV total só pode ficar')
  })
})

test.describe('trocar de Pokémon limpa o espécime anterior', () => {
  test('buscar outra espécie zera os nove campos', async ({ app }) => {
    await preencherVulpix(app)

    await app.searchSpecies(ALAKAZAM.slug)

    const form = await app.readSpecimenForm()
    for (const campo of CAMPOS) expect(form[campo], `campo ${campo}`).toBe('')
    await expect(app.placeholderMessage).toBeVisible()
    await expect(app.speciesPanel).toContainText('#65')
  })

  test('rebuscar a MESMA espécie preserva os dados', async ({ app }) => {
    await preencherVulpix(app)

    await app.searchSpecies('vulpix')

    expect((await app.readSpecimenForm()).level).toBe('78')
    await expect(app.ivStatus).toHaveText('exato')
  })

  test('Recarregar preserva os dados', async ({ app }) => {
    await preencherVulpix(app)

    await app.reloadSpecies()

    expect((await app.readSpecimenForm()).level).toBe('78')
  })

  test('o apelido também é limpo', async ({ app }) => {
    await app.enterSpecimen({
      species: VULPIX,
      growths: growths([12, 30, 3, 28, 19, 9]),
      level: 78,
      quality: 1.45,
      nickname: 'meu Vulpix',
    })

    await app.searchSpecies(ALAKAZAM.slug)

    expect((await app.readSpecimenForm()).nickname).toBe('')
  })
})
