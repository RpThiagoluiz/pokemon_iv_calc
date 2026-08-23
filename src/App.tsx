import { useMemo, useState } from 'react'
import { CompareModal } from './components/CompareModal'
import { ComparePanel } from './components/ComparePanel'
import { GradeCard } from './components/GradeCard'
import { ExternalLink, GithubIcon } from './components/prose'
import { HelpIcon, Tutorial } from './components/Tutorial'
import { IvResult } from './components/IvResult'
import { PowerCard } from './components/PowerCard'
import { SpeciesPanel } from './components/SpeciesPanel'
import { SpecimenPanel } from './components/SpecimenPanel'
import { EMPTY_FORM, type SpecimenForm } from './components/specimenForm'
import { Callout, IconButton, Panel } from './components/ui'
import { REPO_URL } from './config/links.config'
import { accentFor, accentVars } from './config/types.config'
import { COMPARE_MAX, defaultNickname, type CompareEntry } from './domain/compare'
import { explainSolution } from './domain/explain'
import { sumStats } from './domain/formula'
import { autoWeights, gradeFromRanges, keyStats } from './domain/grade'
import { ivTotalRange, solveGrowths } from './domain/inverse'
import { STAT_KEYS, type SpecimenInput, type Stats } from './domain/types'
import { useSpecies } from './hooks/useSpecies'
import { useTutorial } from './hooks/useTutorial'

/** Converte o texto do formulário em número, ou `null` se estiver vazio/inválido. */
function num(value: string): number | null {
  const trimmed = value.trim()
  if (trimmed === '') return null
  const parsed = Number(trimmed.replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : null
}

export default function App() {
  const species = useSpecies()
  const tutorial = useTutorial()
  const [form, setForm] = useState<SpecimenForm>(EMPTY_FORM)
  const [compareEntries, setCompareEntries] = useState<CompareEntry[]>([])
  const [compareOpen, setCompareOpen] = useState(false)

  const slug = species.species?.slug ?? null

  /**
   * Trocar de Pokémon zera o formulário E a comparação — a lista é travada numa
   * espécie só, então misturar espécies ali compararia coisas incomparáveis.
   *
   * A limpeza acontece depois que a busca resolve e só quando o slug realmente
   * mudou: recarregar a mesma espécie, ou errar o nome e tomar 404, preserva o
   * que já estava preenchido.
   */
  const searchSpecies = async (name: string) => {
    const previous = slug
    const found = await species.load(name)
    if (found && found.slug !== previous) {
      setForm(EMPTY_FORM)
      setCompareEntries([])
      setCompareOpen(false)
    }
  }

  const weights = useMemo(() => autoWeights(species.baseStats), [species.baseStats])
  const keyStatNames = useMemo(() => keyStats(weights), [weights])
  const accent = useMemo(() => accentFor(species.species?.types), [species.species])

  const parsed = useMemo(() => {
    const level = num(form.level)
    const quality = num(form.quality)
    const stats = {} as Stats
    let missing = false
    for (const key of STAT_KEYS) {
      const value = num(form.stats[key])
      if (value === null) missing = true
      stats[key] = value ?? 0
    }
    return { level, quality, stats, missing, ivTotal: num(form.ivTotal) }
  }, [form])

  const ready =
    species.species !== null && parsed.level !== null && parsed.quality !== null && !parsed.missing

  const input = useMemo<SpecimenInput | null>(
    () =>
      ready
        ? {
            baseStats: species.baseStats,
            level: parsed.level!,
            quality: parsed.quality!,
            stats: parsed.stats,
            ivTotal: parsed.ivTotal,
          }
        : null,
    [ready, species.baseStats, parsed],
  )

  const solved = useMemo(() => (input ? solveGrowths(input) : null), [input])

  const explanation = useMemo(
    () => (solved && input ? explainSolution(solved, input) : ''),
    [solved, input],
  )

  const grade = useMemo(
    () => (solved?.growths ? gradeFromRanges(solved.growths, weights) : null),
    [solved, weights],
  )

  const statSum = sumStats(parsed.stats)

  // --- comparação ---------------------------------------------------------

  const canAddToCompare = Boolean(solved?.growths && grade) && compareEntries.length < COMPARE_MAX

  const addBlockedReason = !ready
    ? 'Preencha um Pokémon e clique em "+ Comparar". Depois troque os dados e adicione o próximo.'
    : !solved?.growths
      ? 'Este Pokémon não fecha com nenhuma combinação de IVs — corrija antes de comparar.'
      : null

  const addToCompare = () => {
    if (!solved?.growths || !grade || !input) return
    setCompareEntries((current) => [
      ...current,
      {
        // Level + quality + posição já identificam de forma estável nesta sessão.
        id: `${slug}-${input.level}-${input.quality}-${current.length}`,
        nickname: form.nickname.trim() || defaultNickname(current.length),
        level: input.level,
        quality: input.quality,
        stats: { ...input.stats },
        growths: solved.growths!,
        ivTotal: ivTotalRange(solved.growths!),
        grade,
        power: statSum * input.quality,
        isExact: solved.status === 'exact',
      },
    ])
  }

  return (
    <div style={accentVars(accent)} className="min-h-dvh">
      <a href="#conteudo" className="skip-link">
        Pular para o conteúdo
      </a>

      <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
        <header className="mb-6 flex items-start justify-between gap-4 sm:mb-8">
          <h1 className="text-xl font-bold text-[var(--color-text-primary)] sm:text-2xl">
            Poke IV Calc{' '}
            <span className="font-medium text-[var(--color-text-tertiary)]">
              · Poke Idle World
            </span>
          </h1>
          <IconButton label="Ver o tutorial" onClick={tutorial.reopen}>
            <HelpIcon />
          </IconButton>
        </header>

        <main id="conteudo" className="grid gap-4 sm:gap-5 lg:grid-cols-2">
          <div className="space-y-4 sm:space-y-5">
            <SpeciesPanel species={species} onSearch={(name) => void searchSpecies(name)} />
            <SpecimenPanel form={form} onChange={setForm} />
          </div>

          <div
            className="space-y-4 sm:space-y-5"
            aria-live="polite"
            aria-busy={species.loading || undefined}
          >
            {!ready ? (
              <Panel title="Resultado">
                <Callout tone="info">
                  {species.species === null
                    ? 'Busque um Pokémon para começar. Se for a primeira vez, o botão “?” no topo explica tudo.'
                    : 'Preencha level, quality e os seis stats exibidos no jogo.'}
                </Callout>
              </Panel>
            ) : (
              <>
                <IvResult
                  result={solved!}
                  keyStatNames={keyStatNames}
                  explanation={explanation}
                />
                {grade && <GradeCard grade={grade} keyStatNames={keyStatNames} />}
                <PowerCard
                  power={statSum * parsed.quality!}
                  statSum={statSum}
                  quality={parsed.quality!}
                />
              </>
            )}

            {species.species && (
              <ComparePanel
                entries={compareEntries}
                canAdd={canAddToCompare}
                addBlockedReason={addBlockedReason}
                onAdd={addToCompare}
                onRemove={(id) =>
                  setCompareEntries((current) => current.filter((entry) => entry.id !== id))
                }
                onClear={() => setCompareEntries([])}
                onValidate={() => setCompareOpen(true)}
              />
            )}
          </div>
        </main>

        <footer className="mt-8 border-t border-[var(--color-border-subtle)] pt-5 sm:mt-10">
          <div className="flex flex-wrap items-center gap-3">
            <ExternalLink href={REPO_URL} testId="github-link">
              <GithubIcon />
              Dar uma ⭐ no GitHub
            </ExternalLink>
            <p className="text-xs text-[var(--color-text-tertiary)]">
              Projeto aberto e gratuito. Uma estrela ajuda mais gente a encontrar.
            </p>
          </div>

          <p className="mt-4 text-xs text-[var(--color-text-tertiary)]">
            Ferramenta não oficial feita por fãs, sem vínculo com o Poke Idle World. Dados de
            espécies via PokeAPI.
          </p>
        </footer>
      </div>

      <CompareModal
        entries={compareEntries}
        speciesName={species.species?.name ?? ''}
        open={compareOpen}
        onClose={() => setCompareOpen(false)}
      />

      <Tutorial tutorial={tutorial} />
    </div>
  )
}
