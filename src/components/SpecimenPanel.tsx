import { FORMULA_MODE_HINTS, FORMULA_MODE_LABELS } from '../config/formula.config'
import { IV_TOTAL_MAX, STAT_KEYS, STAT_LABELS, type FormulaMode } from '../domain/types'
import type { SpecimenForm } from './specimenForm'
import { Field, NumberInput, Panel, TextInput } from './ui'

export function SpecimenPanel({
  form,
  onChange,
}: {
  form: SpecimenForm
  onChange: (form: SpecimenForm) => void
}) {
  const set = <K extends keyof SpecimenForm>(key: K, value: SpecimenForm[K]) =>
    onChange({ ...form, [key]: value })

  return (
    <Panel
      title="Seu espécime"
      hint="Copie exatamente o que a tela do jogo mostra. O IV total é opcional, mas é ele que elimina a ambiguidade."
    >
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Field label="Level">
          <NumberInput
            value={form.level}
            min={1}
            max={100}
            onChange={(v) => set('level', v)}
          />
        </Field>
        <Field label="Quality (multiplicador)" hint="ex.: 1.42">
          <NumberInput
            value={form.quality}
            step={0.001}
            min={0}
            onChange={(v) => set('quality', v)}
          />
        </Field>
        <Field label={`IV total (de ${IV_TOTAL_MAX})`} hint="opcional">
          <TextInput
            value={form.ivTotal}
            placeholder="90"
            onChange={(v) => set('ivTotal', v)}
          />
        </Field>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-6">
        {STAT_KEYS.map((key) => (
          <Field key={key} label={STAT_LABELS[key]}>
            <NumberInput
              value={form.stats[key]}
              min={1}
              onChange={(v) => onChange({ ...form, stats: { ...form.stats, [key]: v } })}
            />
          </Field>
        ))}
      </div>

      <div className="mt-4">
        <span className="mb-2 block text-xs font-medium text-[var(--color-muted)]">
          Modo de fórmula
        </span>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(FORMULA_MODE_LABELS) as FormulaMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => set('mode', mode)}
              title={FORMULA_MODE_HINTS[mode]}
              className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                form.mode === mode
                  ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/15 text-white'
                  : 'border-[var(--color-edge)] text-[var(--color-muted)] hover:text-white'
              }`}
            >
              {FORMULA_MODE_LABELS[mode]}
            </button>
          ))}
        </div>
        <p className="mt-2 text-[11px] text-[var(--color-muted)]">
          {FORMULA_MODE_HINTS[form.mode]}
        </p>
      </div>
    </Panel>
  )
}
