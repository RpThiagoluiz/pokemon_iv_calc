import { GROWTH_MAX, STAT_KEYS, STAT_LABELS, type SolveResult, type Stats } from '../domain/types'
import { ivTotalRange } from '../domain/inverse'
import { Badge, Callout, Panel } from './ui'

/** Barra 0–32 do growth. Faixas ambíguas viram um bloco translúcido sobre o mínimo. */
function GrowthBar({ min, max, weight }: { min: number; max: number; weight: number }) {
  const pct = (v: number) => (v / GROWTH_MAX) * 100
  const strong = weight > 0.35
  return (
    <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-[var(--color-panel-2)]">
      {max > min && (
        <div
          className="absolute inset-y-0 bg-white/15"
          style={{ left: `${pct(min)}%`, width: `${pct(max - min)}%` }}
        />
      )}
      <div
        className="absolute inset-y-0 left-0 rounded-full"
        style={{
          width: `${pct(min)}%`,
          background: strong
            ? 'linear-gradient(90deg,#34d399,#6ea8fe)'
            : 'linear-gradient(90deg,#4b5675,#6b7a9c)',
        }}
      />
    </div>
  )
}

export function IvResult({
  result,
  weights,
}: {
  result: SolveResult
  weights: Stats
}) {
  if (result.status === 'noSolution') {
    return (
      <Panel testId="iv-panel" title="IVs (growth por stat)">
        <Callout tone="error">{result.reason}</Callout>
      </Panel>
    )
  }

  const growths = result.growths!
  const total = ivTotalRange(growths)
  const exact = result.status === 'exact'

  return (
    <Panel
      testId="iv-panel"
      title="IVs (growth por stat)"
      hint={
        exact
          ? 'Solução única: estes são os IVs exatos do seu Pokémon.'
          : `${result.solutionCount.toLocaleString('pt-BR')} combinações compatíveis. Suba de level e recalcule para estreitar.`
      }
      right={
        <span data-testid="iv-status">
          <Badge color={exact ? '#34d399' : '#fbbf24'}>{exact ? 'exato' : 'ambíguo'}</Badge>
        </span>
      }
    >
      <div className="space-y-3">
        {STAT_KEYS.map((key) => {
          const g = growths[key]
          return (
            <div key={key} className="grid grid-cols-[3rem_1fr_4.5rem] items-center gap-3">
              <span className="text-xs font-semibold text-[var(--color-muted)]">
                {STAT_LABELS[key]}
              </span>
              <GrowthBar min={g.min} max={g.max} weight={weights[key]} />
              <span
                data-testid={`iv-${key}`}
                className="text-right font-mono text-sm text-white"
              >
                {g.min === g.max ? g.min : `${g.min}–${g.max}`}
                <span className="text-[var(--color-muted)]">/{GROWTH_MAX}</span>
              </span>
            </div>
          )
        })}
      </div>

      <div className="mt-4 flex items-baseline justify-between border-t border-[var(--color-edge)] pt-3">
        <span className="text-xs text-[var(--color-muted)]">IV total</span>
        <span data-testid="iv-total" className="font-mono text-lg text-white">
          {total.min === total.max ? total.min : `${total.min}–${total.max}`}
          <span className="text-sm text-[var(--color-muted)]">/192</span>
        </span>
      </div>
    </Panel>
  )
}
