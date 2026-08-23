import { useMemo, useState } from 'react'
import { CompareModal } from './components/CompareModal'
import { ComparePanel } from './components/ComparePanel'
import { GradeCard } from './components/GradeCard'
import { IvResult } from './components/IvResult'
import { PowerCard } from './components/PowerCard'
import { SpeciesPanel } from './components/SpeciesPanel'
import { SpecimenPanel } from './components/SpecimenPanel'
import { EMPTY_FORM, type SpecimenForm } from './components/specimenForm'
import { Callout, Panel } from './components/ui'
import { COMPARE_MAX, defaultNickname, type CompareEntry } from './domain/compare'
import { explainSolution } from './domain/explain'
import { sumStats } from './domain/formula'
import { autoWeights, gradeFromRanges, keyStats } from './domain/grade'
import { ivTotalRange, solveGrowths } from './domain/inverse'
import { STAT_KEYS, type SpecimenInput, type Stats } from './domain/types'
import { useSpecies } from './hooks/useSpecies'

/** Converte o texto do formulário em número, ou `null` se estiver vazio/inválido. */
function num(value: string): number | null {
  const trimmed = value.trim()
  if (trimmed === '') return null
  const parsed = Number(trimmed.replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : null
}

export default function App() {
  const species = useSpecies()
  const [form, setForm] = useState<SpecimenForm>(EMPTY_FORM)
  const [compareEntries, setCompareEntries] = useState<CompareEntry[]>([])
  const [compareOpen, setCompareOpen] = useState(false)

  const slug = species.species?.slug ?? null

  /**
   * Trocar de Pokémon zera o espécime E a comparação — a lista é travada numa
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
    <div className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-white">
          Poke IV Calc <span className="text-[var(--color-muted)]">· Poke Idle World</span>
        </h1>
      </header>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="space-y-5">
          <SpeciesPanel species={species} onSearch={(name) => void searchSpecies(name)} />
          <SpecimenPanel form={form} onChange={setForm} />
        </div>

        <div className="space-y-5">
          {!ready ? (
            <Panel title="Resultado">
              <Callout tone="info">
                {species.species === null
                  ? 'Busque uma espécie para começar.'
                  : 'Preencha level, quality e os seis stats exibidos no jogo.'}
              </Callout>
            </Panel>
          ) : (
            <>
              <IvResult result={solved!} weights={weights} explanation={explanation} />
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
      </div>

      <CompareModal
        entries={compareEntries}
        speciesName={species.species?.name ?? ''}
        open={compareOpen}
        onClose={() => setCompareOpen(false)}
      />

      <footer className="mt-10 text-[11px] text-[var(--color-muted)]">
        Ferramenta não oficial feita por fãs, sem vínculo com o Poke Idle World. Dados de espécies
        via PokeAPI.
      </footer>
    </div>
  )
}
