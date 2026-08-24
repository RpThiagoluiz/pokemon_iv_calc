import { Button, Panel } from './ui'

function Stat({
  label,
  value,
  hint,
  testId,
}: {
  label: string
  value: string
  hint: string
  testId: string
}) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-inset)] p-4">
      <div className="text-xs text-[var(--color-text-secondary)]">{label}</div>
      <div
        data-testid={testId}
        className="tabular mt-1 text-2xl font-bold text-[var(--color-text-primary)]"
      >
        {value}
      </div>
      <div className="mt-1 text-xs text-[var(--color-text-tertiary)]">{hint}</div>
    </div>
  )
}

/** Formata a faixa refinada: "1,5638 – 1,5650". */
function faixa(r: { min: number; max: number }): string {
  const f = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 4, maximumFractionDigits: 4 })
  return `${f(r.min)} – ${f(r.max)}`
}

export function PowerCard({
  power,
  statSum,
  quality,
  qualityRange,
  onSeeProjection,
}: {
  power: number
  statSum: number
  quality: number
  /** Faixa que a inversão apurou — mais precisa que o número exibido no jogo. */
  qualityRange?: { min: number; max: number } | null
  /** Ausente quando não há solução — sem IVs não há o que projetar. */
  onSeeProjection?: () => void
}) {
  // Só vale mostrar quando a inversão apertou a faixa além do que o jogo mostra.
  const refinada = qualityRange && qualityRange.max > qualityRange.min ? qualityRange : null
  return (
    <Panel
      testId="power-panel"
      title="Power"
      hint="Soma dos stats exibidos × quality. Independente do grade de IV."
      right={
        onSeeProjection && (
          <Button variant="ghost" onClick={onSeeProjection}>
            Ver evolução
          </Button>
        )
      }
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Stat
          testId="power-value"
          label="Power"
          value={power.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}
          hint={`${statSum} × ${quality}`}
        />
        <Stat
          testId="quality-value"
          label="Quality"
          value={String(quality)}
          hint={refinada ? `na verdade entre ${faixa(refinada)}` : 'multiplicador de raridade'}
        />
      </div>
    </Panel>
  )
}
