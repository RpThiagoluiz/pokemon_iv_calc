import { GRADE_COLORS } from '../config/grade.config'
import { explainPerfectRolls, listStats } from '../domain/explain'
import type { GradeResult } from '../domain/grade'
import type { StatKey } from '../domain/types'
import { Badge, Panel, Tooltip } from './ui'

export function GradeCard({
  grade,
  keyStatNames,
}: {
  grade: GradeResult
  keyStatNames: StatKey[]
}) {
  const color = GRADE_COLORS[grade.maxGrade]
  const perfect = grade.perfectRolls

  return (
    <Panel
      testId="grade-panel"
      title="Grade de distribuição"
      hint="Avalia se os IVs caíram nos stats que importam para esta espécie. Não considera quality."
    >
      <div className="flex flex-wrap items-center gap-4 sm:flex-nowrap sm:gap-5">
        <div
          data-testid="grade-label"
          className="tabular flex h-20 w-20 shrink-0 items-center justify-center rounded-[var(--radius-lg)] border-2 text-3xl font-bold sm:h-24 sm:w-24"
          style={{
            color,
            borderColor: `color-mix(in srgb, ${color} 45%, transparent)`,
            backgroundColor: `color-mix(in srgb, ${color} 10%, transparent)`,
          }}
        >
          {grade.label}
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex items-baseline justify-between gap-2">
            <span className="text-xs text-[var(--color-text-secondary)]">Score</span>
            <span className="tabular text-sm text-[var(--color-text-primary)]">
              {grade.isRange
                ? `${(grade.minScore * 100).toFixed(1)}–${(grade.maxScore * 100).toFixed(1)}%`
                : `${(grade.maxScore * 100).toFixed(1)}%`}
            </span>
          </div>

          <div className="relative h-2 w-full overflow-hidden rounded-full bg-[var(--color-surface-inset)]">
            {grade.isRange && (
              <div
                className="absolute inset-y-0 bg-[var(--color-text-tertiary)]/35"
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
            <p className="mt-2 text-xs leading-relaxed text-[var(--color-text-tertiary)]">
              Os IVs estão ambíguos, então o grade é um intervalo. Informe o IV total ou suba de
              level para fechar.
            </p>
          )}

          {perfect.qualifies && (
            <div className="mt-2">
              <Tooltip testId="perfect-rolls-tag" content={explainPerfectRolls(grade)}>
                <Badge color={GRADE_COLORS.SS}>
                  ★ {perfect.stats.length} IVs perfeitos no lugar certo
                </Badge>
              </Tooltip>
            </div>
          )}
        </div>
      </div>

      <p className="mt-5 border-t border-[var(--color-border-subtle)] pt-4 text-xs leading-relaxed text-[var(--color-text-tertiary)]">
        Os pesos saem dos base stats da espécie, então o papel dela define a nota. Para este
        Pokémon o que mais conta é{' '}
        <strong className="font-semibold text-[var(--color-text-primary)]">
          {listStats(keyStatNames)}
        </strong>
        .
      </p>
    </Panel>
  )
}
