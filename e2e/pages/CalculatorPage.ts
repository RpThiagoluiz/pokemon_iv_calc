import type { Locator, Page } from '@playwright/test'
import { expect } from '@playwright/test'
import type { SpeciesFixture } from '../fixtures/species'
import {
  STAT_KEYS,
  STAT_LABELS,
  ivTotalOf,
  statsOf,
  type FormulaMode,
  type StatKey,
  type Stats,
} from '../support/formula'

export interface SpecimenSpec {
  species: SpeciesFixture
  growths: Stats
  level: number
  quality: number
  mode?: FormulaMode
  /** Informar o IV total colapsa a ambiguidade. Passe `false` para omitir. */
  withIvTotal?: boolean
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

  get speciesInput(): Locator {
    return this.page.getByPlaceholder('vulpix')
  }

  async openTab(tab: 'Calculadora' | 'Calibrar expoentes'): Promise<void> {
    await this.page.getByRole('button', { name: tab, exact: true }).click()
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
    return this.speciesPanel.getByText('não encontrada')
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
    return this.page.getByLabel('Level')
  }

  get qualityInput(): Locator {
    return this.page.getByLabel('Quality (multiplicador)')
  }

  get ivTotalInput(): Locator {
    return this.page.getByLabel('IV total (de 192)')
  }

  statInput(key: StatKey): Locator {
    return this.page.getByLabel(STAT_LABELS[key], { exact: true })
  }

  formulaModeButton(mode: FormulaMode): Locator {
    const label = mode === 'official' ? 'Oficial (× quality)' : 'Discord (quality^exp)'
    return this.page.getByRole('button', { name: label })
  }

  async setFormulaMode(mode: FormulaMode): Promise<void> {
    await this.formulaModeButton(mode).click()
  }

  /** O botão ativo ganha a borda de destaque — é assim que a UI marca o modo. */
  async activeFormulaMode(): Promise<FormulaMode> {
    const cls = (await this.formulaModeButton('official').getAttribute('class')) ?? ''
    return cls.includes('accent') ? 'official' : 'discord'
  }

  /** Busca a espécie e digita o espécime derivado dos growths informados. */
  async enterSpecimen(spec: SpecimenSpec): Promise<Stats> {
    const { species, growths, level, quality, mode = 'discord', withIvTotal = true } = spec
    const stats = statsOf(species.baseStats, growths, level, quality, mode)

    await this.searchSpecies(species.slug)
    if (mode !== 'discord') await this.setFormulaMode(mode)

    await this.levelInput.fill(String(level))
    await this.qualityInput.fill(String(quality))
    await this.ivTotalInput.fill(withIvTotal ? String(ivTotalOf(growths)) : '')
    for (const key of STAT_KEYS) await this.statInput(key).fill(String(stats[key]))

    return stats
  }

  async readSpecimenForm(): Promise<Record<string, string>> {
    const entries: Array<[string, string]> = [
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

  weightSlider(key: StatKey): Locator {
    return this.gradePanel.getByRole('slider').nth(STAT_KEYS.indexOf(key))
  }

  get powerValue(): Locator {
    return this.page.getByTestId('power-value')
  }

  get qualityTier(): Locator {
    return this.page.getByTestId('quality-tier')
  }

  get placeholderMessage(): Locator {
    return this.page.getByText('Preencha level, quality e os seis stats')
  }

  // --- calibração --------------------------------------------------------

  get calibrationPanel(): Locator {
    return this.page.getByTestId('calibration-panel')
  }

  async addCurrentSpecimenToCalibration(): Promise<void> {
    await this.openTab('Calibrar expoentes')
    await this.page.getByRole('button', { name: '+ Usar o espécime atual' }).click()
    await this.openTab('Calculadora')
  }

  async clearCalibration(): Promise<void> {
    await this.calibrationPanel.getByRole('button', { name: 'Limpar' }).click()
  }

  /** Faixa viável de expoente lida da tabela de calibração, ex.: `"0.80 – 0.87"`. */
  async calibrationRange(key: StatKey): Promise<string> {
    const row = this.calibrationPanel.getByRole('row').filter({
      has: this.page.getByRole('cell', { name: STAT_LABELS[key], exact: true }),
    })
    return (await row.getByRole('cell').nth(1).innerText()).trim()
  }
}
