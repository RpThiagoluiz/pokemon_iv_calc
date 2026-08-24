import type { Locator, Page } from '@playwright/test'
import { expect } from '@playwright/test'
import { dexNumber, type SpeciesFixture } from '../fixtures/species'
import {
  STAT_KEYS,
  STAT_LABELS,
  ivTotalOf,
  statsOf,
  type StatKey,
  type Stats,
} from '../support/formula'

export interface SpecimenSpec {
  species: SpeciesFixture
  growths: Stats
  level: number
  quality: number
  /** Informar o IV total colapsa a ambiguidade. Passe `false` para omitir. */
  withIvTotal?: boolean
  /** Apelido usado ao mandar o espécime para a comparação. */
  nickname?: string
}

/**
 * Page Object da calculadora.
 *
 * Todo seletor do app vive aqui. Os specs falam em termos de domínio
 * ("preencha este espécime", "qual o grade") e nunca em CSS — quando a UI
 * mudar, muda este arquivo e só ele.
 */
export class CalculatorPage {
  // Campo explícito em vez de parameter property: `erasableSyntaxOnly`
  // (herdado da config do projeto) não permite o açúcar do construtor.
  private readonly page: Page

  constructor(page: Page) {
    this.page = page
  }

  // --- navegação ---------------------------------------------------------

  async goto(): Promise<void> {
    await this.page.goto('/')
    await expect(this.speciesInput).toBeVisible()
  }

  get skipLink(): Locator {
    return this.page.getByRole('link', { name: 'Pular para o conteúdo' })
  }

  get githubLink(): Locator {
    return this.page.getByTestId('github-link')
  }

  get speciesInput(): Locator {
    // Pelo label, não pelo placeholder: o campo Apelido também sugere "Vulpix".
    return this.page.getByLabel('Buscar Pokémon')
  }

  // --- espécie -----------------------------------------------------------

  async searchSpecies(name: string): Promise<void> {
    await this.speciesInput.fill(name)
    await this.page.getByRole('button', { name: 'Buscar' }).click()
    await expect(this.page.getByRole('button', { name: 'Buscar' })).toBeEnabled()
  }

  async reloadSpecies(): Promise<void> {
    await this.page.getByRole('button', { name: 'Recarregar' }).click()
    await expect(this.page.getByRole('button', { name: 'Buscar' })).toBeEnabled()
  }

  get speciesPanel(): Locator {
    return this.page.getByTestId('species-panel')
  }

  get speciesError(): Locator {
    return this.speciesPanel.getByText('não encontrado')
  }

  baseStatInput(key: StatKey): Locator {
    return this.page.getByLabel(`Base ${STAT_LABELS[key]}`)
  }

  async readBaseStats(): Promise<Stats> {
    const entries = await Promise.all(
      STAT_KEYS.map(async (key) => [key, Number(await this.baseStatInput(key).inputValue())]),
    )
    return Object.fromEntries(entries) as Stats
  }

  async overrideBaseStat(key: StatKey, value: number): Promise<void> {
    await this.baseStatInput(key).fill(String(value))
  }

  // --- espécime ----------------------------------------------------------

  get levelInput(): Locator {
    // Exato: o modal de projeção tem "Level alvo" e os gráficos têm títulos
    // acessíveis que citam "level". Sem `exact` isto casa com cinco elementos.
    return this.page.getByLabel('Level', { exact: true })
  }

  get qualityInput(): Locator {
    return this.page.getByLabel('Quality', { exact: true })
  }

  get ivTotalInput(): Locator {
    return this.page.getByLabel('IV total /192')
  }

  statInput(key: StatKey): Locator {
    return this.page.getByLabel(STAT_LABELS[key], { exact: true })
  }

  get nicknameInput(): Locator {
    return this.page.getByLabel('Apelido')
  }

  /**
   * Busca a espécie e digita o espécime derivado dos growths informados.
   *
   * Só busca quando a espécie ainda não está carregada — buscar de novo
   * limparia o formulário e a comparação.
   */
  async enterSpecimen(spec: SpecimenSpec): Promise<Stats> {
    const { species, growths, level, quality, withIvTotal = true, nickname } = spec
    const stats = statsOf(species.baseStats, growths, level, quality)

    if (!(await this.speciesPanel.getByText(dexNumber(species)).count())) {
      await this.searchSpecies(species.slug)
    }

    await this.nicknameInput.fill(nickname ?? '')
    await this.levelInput.fill(String(level))
    // 4 casas encolhem a janela de arredondamento da quality quase a zero, o
    // que mantém os testes determinísticos (ver QUALITY_CASAS_MIN no App).
    await this.qualityInput.fill(quality.toFixed(4))
    await this.ivTotalInput.fill(withIvTotal ? String(ivTotalOf(growths)) : '')
    for (const key of STAT_KEYS) await this.statInput(key).fill(String(stats[key]))

    return stats
  }

  async readSpecimenForm(): Promise<Record<string, string>> {
    const entries: Array<[string, string]> = [
      ['nickname', await this.nicknameInput.inputValue()],
      ['level', await this.levelInput.inputValue()],
      ['quality', await this.qualityInput.inputValue()],
      ['ivTotal', await this.ivTotalInput.inputValue()],
    ]
    for (const key of STAT_KEYS) entries.push([key, await this.statInput(key).inputValue()])
    return Object.fromEntries(entries)
  }

  // --- resultado ---------------------------------------------------------

  get ivPanel(): Locator {
    return this.page.getByTestId('iv-panel')
  }

  get ivStatus(): Locator {
    return this.page.getByTestId('iv-status')
  }

  get ivTotalResult(): Locator {
    return this.page.getByTestId('iv-total')
  }

  ivResult(key: StatKey): Locator {
    return this.page.getByTestId(`iv-${key}`)
  }

  /** Os seis growths resolvidos, já sem o sufixo `/32`. */
  async readResolvedIvs(): Promise<Record<StatKey, string>> {
    const entries = await Promise.all(
      STAT_KEYS.map(async (key) => {
        const raw = (await this.ivResult(key).innerText()).trim()
        return [key, raw.split('/')[0]]
      }),
    )
    return Object.fromEntries(entries) as Record<StatKey, string>
  }

  get gradePanel(): Locator {
    return this.page.getByTestId('grade-panel')
  }

  get gradeLabel(): Locator {
    return this.page.getByTestId('grade-label')
  }

  get perfectRollsTag(): Locator {
    return this.page.getByTestId('perfect-rolls-tag')
  }

  get perfectRollsTooltip(): Locator {
    return this.page.getByTestId('perfect-rolls-tag-content')
  }

  get ivStatusTooltip(): Locator {
    return this.page.getByTestId('iv-status-content')
  }

  get powerValue(): Locator {
    return this.page.getByTestId('power-value')
  }

  get qualityValue(): Locator {
    return this.page.getByTestId('quality-value')
  }

  get placeholderMessage(): Locator {
    return this.page.getByText('Preencha level, quality e os seis stats')
  }

  // --- comparação --------------------------------------------------------

  get comparePanel(): Locator {
    return this.page.getByTestId('compare-panel')
  }

  get compareList(): Locator {
    return this.page.getByTestId('compare-list')
  }

  get compareItems(): Locator {
    return this.compareList.getByRole('listitem')
  }

  get addToCompareButton(): Locator {
    return this.comparePanel.getByRole('button', { name: '+ Comparar' })
  }

  get validateButton(): Locator {
    return this.comparePanel.getByRole('button', { name: 'Validar comparação' })
  }

  get clearCompareButton(): Locator {
    return this.comparePanel.getByRole('button', { name: 'Limpar comparação' })
  }

  /** Preenche um espécime e manda para a comparação, em um passo. */
  async addToCompare(spec: SpecimenSpec): Promise<void> {
    await this.enterSpecimen(spec)
    await this.addToCompareButton.click()
  }

  async removeFromCompare(nickname: string): Promise<void> {
    await this.comparePanel.getByRole('button', { name: `Remover ${nickname}` }).click()
  }

  // --- modal de comparação -----------------------------------------------

  get compareModal(): Locator {
    return this.page.getByTestId('compare-modal')
  }

  get compareTable(): Locator {
    return this.page.getByTestId('compare-table')
  }

  /** Apelidos na ordem do ranking, do melhor para o pior. */
  async podiumOrder(): Promise<string[]> {
    const rows = this.page.getByTestId(/^podium-\d+$/)
    const count = await rows.count()
    const names: string[] = []
    for (let i = 0; i < count; i++) {
      names.push((await rows.nth(i).locator('div.truncate').innerText()).trim())
    }
    return names
  }

  gradeGroup(grade: string): Locator {
    return this.page.getByTestId(`group-${grade}`)
  }

  compareCell(key: StatKey, entryId: string): Locator {
    return this.page.getByTestId(`cell-${key}-${entryId}`)
  }

  async closeCompareModal(): Promise<void> {
    await this.compareModal.getByRole('button', { name: 'Fechar' }).click()
  }

  async pressEscape(): Promise<void> {
    await this.page.keyboard.press('Escape')
  }

  // --- projeção ----------------------------------------------------------

  get seeProjectionButton(): Locator {
    return this.page.getByRole('button', { name: 'Ver evolução' })
  }

  get projectionModal(): Locator {
    return this.page.getByTestId('projection-modal')
  }

  get targetLevelInput(): Locator {
    return this.projectionModal.getByLabel('Level alvo', { exact: true })
  }

  get targetPower(): Locator {
    return this.page.getByTestId('target-power')
  }

  get milestones(): Locator {
    return this.page.getByTestId('milestones').getByRole('listitem')
  }

  get powerChart(): Locator {
    return this.page.getByTestId('power-chart')
  }

  get statsChart(): Locator {
    return this.page.getByTestId('stats-chart')
  }

  get projectionTable(): Locator {
    return this.page.getByTestId('projection-table')
  }

  get stepsTable(): Locator {
    return this.page.getByTestId('steps-table')
  }

  async openProjection(): Promise<void> {
    await this.seeProjectionButton.click()
    await expect(this.projectionModal).toBeVisible()
  }

  async setTargetLevel(level: number): Promise<void> {
    await this.targetLevelInput.fill(String(level))
  }

  /** A tabela de 20 em 20 fica num `<details>`: fechada, some da árvore de a11y. */
  async openStepsTable(): Promise<void> {
    await this.projectionModal.getByText(/Ver de \d+ em \d+ levels/).click()
    await expect(this.stepsTable).toBeVisible()
  }

  // --- tutorial ----------------------------------------------------------

  get tutorial(): Locator {
    return this.page.getByTestId('tutorial-modal')
  }

  get tutorialTitle(): Locator {
    return this.page.getByTestId('tutorial-title')
  }

  get tutorialButton(): Locator {
    return this.page.getByRole('button', { name: 'Ver o tutorial' })
  }

  get tutorialNext(): Locator {
    return this.tutorial.getByRole('button', { name: 'Avançar' })
  }

  get tutorialBack(): Locator {
    return this.tutorial.getByRole('button', { name: 'Voltar' })
  }

  get tutorialSkip(): Locator {
    return this.tutorial.getByRole('button', { name: 'Pular' })
  }

  get tutorialStart(): Locator {
    return this.tutorial.getByRole('button', { name: 'Começar' })
  }

  /** Passo atual conforme o indicador de progresso (`aria-current="step"`). */
  get tutorialCurrentDot(): Locator {
    return this.tutorial.locator('[aria-current="step"]')
  }

  async tutorialGoTo(index: number): Promise<void> {
    await this.tutorial.getByRole('button', { name: new RegExp(`^Passo ${index + 1}:`) }).click()
  }

  /** `true` quando o navegador já registrou que o tutorial foi visto. */
  async onboardingSeen(): Promise<boolean> {
    return this.page.evaluate(
      () => localStorage.getItem('pokeivcalc:onboarding:seen') === 'true',
    )
  }
}
