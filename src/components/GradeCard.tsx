import { GRADE_COLORS } from '../config/grade.config'
import { explainPerfectRolls, listStats } from '../domain/explain'
import type { GradeResult } from '../domain/grade'
import type { StatKey } from '../domain/types'
import { Badge, Panel, Tooltip } from './ui'

export function GradeCard({ grade, keyStatNames }: { grade: GradeResult; keyStatNames: StatKey[] }) {
  const color = GRADE_COLORS[grade.maxGrade]
  const perfect = grade.perfectRolls

  return (
    <Panel
      testId="grade-panel"
      title="Grade de distribuição"
      hint="Avalia se os IVs caíram nos stats que importam para esta espécie. Não considera quality."
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
              Os IVs estão ambíguos, então o grade é um intervalo. Informe o IV total ou suba de
              level para fechar.
            </p>
          )}
          {perfect.qualifies && (
            <div className="mt-2">
              <Tooltip testId="perfect-rolls-tag" content={explainPerfectRolls(grade)}>
                <Badge color="#f472b6">★ {perfect.stats.length} IVs perfeitos no lugar certo</Badge>
              </Tooltip>
            </div>
          )}
        </div>
      </div>

      <p className="mt-5 border-t border-[var(--color-edge)] pt-4 text-[11px] text-[var(--color-muted)]">
        Os pesos saem dos base stats da espécie, então o papel dela define a nota. Para este
        Pokémon o que mais conta é <strong className="text-white">{listStats(keyStatNames)}</strong>
        .
      </p>
    </Panel>
  )
}
