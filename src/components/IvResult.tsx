import {
  GROWTH_MAX,
  IV_TOTAL_MAX,
  STAT_KEYS,
  STAT_LABELS,
  type SolveResult,
  type StatKey,
  type Stats,
} from '../domain/types'
import { Badge, Callout, Panel, Tooltip } from './ui'

/** Barra 0–32 do growth. Faixas ambíguas viram um bloco translúcido sobre o mínimo. */
function GrowthBar({ min, max, isKey }: { min: number; max: number; isKey: boolean }) {
  const pct = (v: number) => (v / GROWTH_MAX) * 100
  return (
    <div className="relative h-2 w-full overflow-hidden rounded-full bg-[var(--color-surface-inset)]">
      {max > min && (
        <div
          className="absolute inset-y-0 bg-[var(--color-text-tertiary)]/35"
          style={{ left: `${pct(min)}%`, width: `${pct(max - min)}%` }}
        />
      )}
      <div
        className="absolute inset-y-0 left-0 rounded-full"
        style={{
          width: `${pct(min)}%`,
          backgroundColor: isKey ? 'var(--accent)' : 'var(--color-text-tertiary)',
        }}
      />
    </div>
  )
}

export function IvResult({
  result,
  keyStatNames,
  explanation,
}: {
  result: SolveResult
  /** Stats que pesam para a espécie — marcados com ★, não só com cor. */
  keyStatNames: StatKey[]
  /** Por que a inversão saiu assim para ESTE Pokémon — vira o tooltip da tag. */
  explanation: string
}) {
  if (result.status === 'noSolution') {
    return (
      <Panel testId="iv-panel" title="IVs por stat">
        <Callout tone="error">{result.reason}</Callout>
      </Panel>
    )
  }

  const growths = result.growths as Stats<{ min: number; max: number; values: number[] }>
  /*
   * A faixa vem do solver, não de somar as faixas por stat: somar os mínimos
   * de cada stat produz um total que nenhuma combinação atinge, e por isso
   * informar o IV total não mudava nada na tela.
   */
  const total = result.ivTotalRange ?? { min: 0, max: 0 }
  const exact = result.status === 'exact'

  return (
    <Panel
      testId="iv-panel"
      title="IVs por stat"
      hint={
        exact
          ? 'Solução única: estes são os IVs exatos do seu Pokémon.'
          : 'Vários growths reproduzem esses stats. Suba de level e recalcule para estreitar.'
      }
      right={
        <Tooltip testId="iv-status" content={explanation} align="end">
          <Badge color={exact ? 'var(--color-ok)' : 'var(--color-warn)'}>
            {exact ? 'exato' : 'ambíguo'}
          </Badge>
        </Tooltip>
      }
    >
      <ul className="space-y-2.5">
        {STAT_KEYS.map((key) => {
          const g = growths[key]
          const isKey = keyStatNames.includes(key)
          return (
            <li key={key} className="grid grid-cols-[3.5rem_1fr_4.5rem] items-center gap-3">
              <span className="text-xs font-semibold text-[var(--color-text-secondary)]">
                {isKey && (
                  <span
                    className="mr-1 text-[var(--accent)]"
                    title="Stat que mais pesa para esta espécie"
                  >
                    ★
                  </span>
                )}
                {STAT_LABELS[key]}
              </span>
              <GrowthBar min={g.min} max={g.max} isKey={isKey} />
              <span
                data-testid={`iv-${key}`}
                className="tabular text-right text-sm text-[var(--color-text-primary)]"
              >
                {g.min === g.max ? g.min : `${g.min}–${g.max}`}
                <span className="text-[var(--color-text-tertiary)]">/{GROWTH_MAX}</span>
              </span>
            </li>
          )
        })}
      </ul>

      <div className="mt-4 flex items-baseline justify-between border-t border-[var(--color-border-subtle)] pt-3">
        <span className="text-xs text-[var(--color-text-secondary)]">IV total</span>
        <span data-testid="iv-total" className="tabular text-lg text-[var(--color-text-primary)]">
          {total.min === total.max ? total.min : `${total.min}–${total.max}`}
          <span className="text-sm text-[var(--color-text-tertiary)]">/{IV_TOTAL_MAX}</span>
        </span>
      </div>

      <p className="mt-2 text-xs text-[var(--color-text-tertiary)]">
        ★ marca os stats que mais pesam no grade desta espécie.
      </p>
    </Panel>
  )
}
