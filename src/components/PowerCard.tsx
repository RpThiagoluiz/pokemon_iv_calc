import { Panel } from './ui'

export function PowerCard({
  power,
  statSum,
  quality,
}: {
  power: number
  statSum: number
  quality: number
}) {
  return (
    <Panel
      testId="power-panel"
      title="Power"
      hint="Soma dos stats exibidos × quality. Independente do grade de IV."
    >
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-[var(--color-edge)] bg-[var(--color-panel-2)]/60 p-4">
          <div className="text-xs text-[var(--color-muted)]">Power</div>
          <div data-testid="power-value" className="mt-1 font-mono text-2xl font-bold text-white">
            {power.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}
          </div>
          <div className="mt-1 text-[11px] text-[var(--color-muted)]">
            {statSum} × {quality}
          </div>
        </div>
        <div className="rounded-xl border border-[var(--color-edge)] bg-[var(--color-panel-2)]/60 p-4">
          <div className="text-xs text-[var(--color-muted)]">Quality</div>
          <div
            data-testid="quality-value"
            className="mt-1 font-mono text-2xl font-bold text-white"
          >
            {quality}
          </div>
          <div className="mt-1 text-[11px] text-[var(--color-muted)]">
            multiplicador de raridade
          </div>
        </div>
      </div>
    </Panel>
  )
}
