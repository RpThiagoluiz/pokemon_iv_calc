import { useMemo, useState } from 'react'
import { CalibrationPanel } from './components/CalibrationPanel'
import { GradeCard } from './components/GradeCard'
import { IvResult } from './components/IvResult'
import { PowerCard } from './components/PowerCard'
import { SpeciesPanel } from './components/SpeciesPanel'
import { SpecimenPanel } from './components/SpecimenPanel'
import { EMPTY_FORM, type SpecimenForm } from './components/specimenForm'
import { Callout, Panel } from './components/ui'
import { readJson, removeJson, writeJson } from './data/storage'
import type { CalibrationSpecimen } from './domain/calibrate'
import { sumStats } from './domain/formula'
import { autoWeights, gradeFromRanges } from './domain/grade'
import { solveGrowths } from './domain/inverse'
import { STAT_KEYS, type StatKey, type Stats } from './domain/types'
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
  /** Ajuste de pesos feito nesta sessão. Fica atrelado ao slug para não vazar entre espécies. */
  const [edited, setEdited] = useState<{ slug: string | null; weights: Stats | null }>({
    slug: null,
    weights: null,
  })

  const slug = species.species?.slug ?? null

  // O preset salvo é lido por slug; a edição da sessão tem precedência sobre ele.
  const savedWeights = useMemo(() => (slug ? readJson<Stats>('weights', slug) : null), [slug])
  const customWeights = edited.slug === slug ? edited.weights : savedWeights

  const derivedWeights = useMemo(() => autoWeights(species.baseStats), [species.baseStats])
  const weights = customWeights ?? derivedWeights

  const setWeight = (key: StatKey, value: number) => {
    const next = { ...weights, [key]: value }
    setEdited({ slug, weights: next })
    if (slug) writeJson('weights', slug, next)
  }

  const resetWeights = () => {
    setEdited({ slug, weights: null })
    if (slug) removeJson('weights', slug)
  }

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
    species.species !== null &&
    parsed.level !== null &&
    parsed.quality !== null &&
    !parsed.missing

  const solved = useMemo(() => {
    if (!ready) return null
    return solveGrowths({
      baseStats: species.baseStats,
      level: parsed.level!,
      quality: parsed.quality!,
      stats: parsed.stats,
      ivTotal: parsed.ivTotal,
      mode: form.mode,
    })
  }, [ready, species.baseStats, parsed, form.mode])

  const grade = useMemo(
    () => (solved?.growths ? gradeFromRanges(solved.growths, weights) : null),
    [solved, weights],
  )

  const statSum = sumStats(parsed.stats)

  // --- Calibração ---------------------------------------------------------
  const [tab, setTab] = useState<'calc' | 'calibrate'>('calc')
  const [calibrationSpecimens, setCalibrationSpecimens] = useState<CalibrationSpecimen[]>(
    () => readJson<CalibrationSpecimen[]>('calibration', 'specimens') ?? [],
  )

  const persistSpecimens = (next: CalibrationSpecimen[]) => {
    setCalibrationSpecimens(next)
    writeJson('calibration', 'specimens', next)
  }

  const addCalibrationSpecimen = () => {
    if (!ready || !species.species) return
    persistSpecimens([
      ...calibrationSpecimens,
      {
        // Sem crypto.randomUUID: o índice + slug já identifica de forma estável.
        id: `${species.species.slug}-${parsed.level}-${parsed.quality}-${calibrationSpecimens.length}`,
        label: species.species.name,
        baseStats: { ...species.baseStats },
        level: parsed.level!,
        quality: parsed.quality!,
        stats: { ...parsed.stats },
      },
    ])
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-white">
          Poke IV Calc <span className="text-[var(--color-muted)]">· Poke Idle World</span>
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-[var(--color-muted)]">
          O jogo esconde o growth (IV) de cada stat. Informe o que a tela mostra e o app
          inverte a fórmula para descobri-los — e diz se caíram nos stats que importam.
        </p>
      </header>

      <nav className="mb-5 flex gap-2">
        {(
          [
            ['calc', 'Calculadora'],
            ['calibrate', 'Calibrar expoentes'],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`rounded-lg border px-4 py-2 text-xs font-semibold transition ${
              tab === key
                ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/15 text-white'
                : 'border-[var(--color-edge)] text-[var(--color-muted)] hover:text-white'
            }`}
          >
            {label}
          </button>
        ))}
      </nav>

      {tab === 'calibrate' && (
        <CalibrationPanel
          specimens={calibrationSpecimens}
          canAdd={ready}
          onAdd={addCalibrationSpecimen}
          onRemove={(id) =>
            persistSpecimens(calibrationSpecimens.filter((s) => s.id !== id))
          }
          onClear={() => persistSpecimens([])}
        />
      )}

      <div className={`grid gap-5 lg:grid-cols-2 ${tab === 'calc' ? '' : 'hidden'}`}>
        <div className="space-y-5">
          <SpeciesPanel species={species} />
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
              <IvResult result={solved!} weights={weights} />
              {grade && (
                <GradeCard
                  grade={grade}
                  weights={weights}
                  isCustom={customWeights !== null}
                  onWeightChange={setWeight}
                  onResetWeights={resetWeights}
                />
              )}
              <PowerCard
                power={statSum * parsed.quality!}
                statSum={statSum}
                quality={parsed.quality!}
              />
            </>
          )}
        </div>
      </div>

      <footer className="mt-10 text-[11px] text-[var(--color-muted)]">
        Base stats via PokeAPI (pública, sem token). Fórmulas conforme
        pokepedia/systems/power; os expoentes do modo Discord são hipótese da comunidade.
      </footer>
    </div>
  )
}
