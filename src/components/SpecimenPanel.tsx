import { IV_TOTAL_MAX, STAT_KEYS, STAT_LABELS } from '../domain/types'
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
      testId="specimen-panel"
      title="Seu Pokémon"
      hint="Copie exatamente o que a tela do jogo mostra. O IV total é opcional, mas é ele que elimina a ambiguidade."
    >
      <Field label="Apelido" hint="opcional — identifica este Pokémon na comparação">
        <TextInput
          value={form.nickname}
          placeholder="ex.: Vulpix do hunt"
          onChange={(v) => set('nickname', v)}
        />
      </Field>

      <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        <Field label="Level">
          <NumberInput value={form.level} min={1} max={100} onChange={(v) => set('level', v)} />
        </Field>
        <Field label="Quality" hint="ex.: 1.42">
          <NumberInput
            value={form.quality}
            step={0.001}
            min={0}
            onChange={(v) => set('quality', v)}
          />
        </Field>
        <Field label={`IV total /${IV_TOTAL_MAX}`} hint="opcional">
          <TextInput value={form.ivTotal} placeholder="90" onChange={(v) => set('ivTotal', v)} />
        </Field>
      </div>

      <fieldset className="mt-4">
        <legend className="mb-2 text-xs font-medium text-[var(--color-text-secondary)]">
          Stats exibidos no jogo
        </legend>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
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
      </fieldset>
    </Panel>
  )
}
