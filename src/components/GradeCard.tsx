import { GRADE_COLORS } from '../config/grade.config'
import type { GradeResult } from '../domain/grade'
import { GROWTH_MAX, STAT_KEYS, STAT_LABELS, type StatKey, type Stats } from '../domain/types'
import { Badge, Button, Panel, Tooltip } from './ui'

/** "SpA e Vel" — lista em português, com "e" antes do último. */
function listStats(stats: StatKey[]): string {
  const labels = stats.map((key) => STAT_LABELS[key])
  if (labels.length <= 1) return labels.join('')
  return `${labels.slice(0, -1).join(', ')} e ${labels[labels.length - 1]}`
}

export function GradeCard({
  grade,
  weights,
  isCustom,
  onWeightChange,
  onResetWeights,
}: {
  grade: GradeResult
  weights: Stats
  isCustom: boolean
  onWeightChange: (key: keyof Stats, value: number) => void
  onResetWeights: () => void
}) {
  const color = GRADE_COLORS[grade.maxGrade]
  const perfect = grade.perfectRolls

  return (
    <Panel
      testId="grade-panel"
      title="Grade de distribuição"
      hint="Avalia se os IVs caíram nos stats que importam para esta espécie. Não considera quality."
      right={isCustom && <Button variant="ghost" onClick={onResetWeights}>Pesos automáticos</Button>}
    >
      <div className="flex items-center gap-5">
        <div
          data-testid="grade-label"
          className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl border-2 text-3xl font-black"
          style={{ color, borderColor: `${color}66`, backgroundColor: `${color}14` }}
        >
          {grade.label}
        </div>
        <div className="flex-1">
          <div className="mb-1 flex items-baseline justify-between">
            <span className="text-xs text-[var(--color-muted)]">Score</span>
            <span className="font-mono text-sm text-white">
              {grade.isRange
                ? `${(grade.minScore * 100).toFixed(1)}–${(grade.maxScore * 100).toFixed(1)}%`
                : `${(grade.maxScore * 100).toFixed(1)}%`}
            </span>
          </div>
          <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-[var(--color-panel-2)]">
            {grade.isRange && (
              <div
                className="absolute inset-y-0 bg-white/15"
                style={{
                  left: `${grade.minScore * 100}%`,
                  width: `${(grade.maxScore - grade.minScore) * 100}%`,
                }}
              />
            )}
            <div
              className="absolute inset-y-0 left-0 rounded-full"
              style={{ width: `${grade.minScore * 100}%`, backgroundColor: color }}
            />
          </div>
          {grade.isRange && (
            <p className="mt-2 text-[11px] text-[var(--color-muted)]">
              Os IVs estão ambíguos, então o grade é um intervalo. Informe o IV total ou suba
              de level para fechar.
            </p>
          )}
          {(perfect.qualifies || isCustom) && (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {perfect.qualifies && (
                <Tooltip
                  testId="perfect-rolls-tag"
                  content={
                    `Tier ${grade.label}, mas com ${perfect.stats.length} IVs perfeitos no lugar certo: ` +
                    `${listStats(perfect.stats)} em ${GROWTH_MAX}/${GROWTH_MAX}. ` +
                    'O grade é uma média de todos os stats, então ele dilui esse acerto — ' +
                    'na prática este Pokémon vale mais que outro do mesmo tier com os IVs espalhados.'
                  }
                >
                  <Badge color="#f472b6">
                    ★ {perfect.stats.length} IVs perfeitos no lugar certo
                  </Badge>
                </Tooltip>
              )}
              {isCustom && <Badge color="#fbbf24">pesos manuais</Badge>}
            </div>
          )}
        </div>
      </div>

      <div className="mt-5 border-t border-[var(--color-edge)] pt-4">
        <p className="mb-3 text-xs text-[var(--color-muted)]">
          Peso de cada stat — derivado dos base stats da espécie. Ajuste se você usa este
          Pokémon num papel diferente.
        </p>
        <div className="grid grid-cols-1 gap-x-5 gap-y-2 sm:grid-cols-2">
          {STAT_KEYS.map((key) => (
            <label key={key} className="flex items-center gap-2">
              <span className="w-8 shrink-0 text-xs font-semibold text-[var(--color-muted)]">
                {STAT_LABELS[key]}
              </span>
              {/* min-w-0: sem isso o range não encolhe abaixo da largura intrínseca e vaza da célula */}
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={weights[key]}
                onChange={(e) => onWeightChange(key, Number(e.target.value))}
                className="w-full min-w-0 flex-1 accent-[var(--color-accent)]"
              />
              <span className="w-9 shrink-0 text-right font-mono text-[11px] text-white">
                {weights[key].toFixed(2)}
              </span>
            </label>
          ))}
        </div>
      </div>
    </Panel>
  )
}
