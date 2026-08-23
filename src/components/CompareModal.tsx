import { GRADE_COLORS } from '../config/grade.config'
import { bestPerStat, groupByGrade, hasAmbiguity, rankEntries } from '../domain/compare'
import type { CompareEntry } from '../domain/compare'
import { explainPerfectRolls } from '../domain/explain'
import { GROWTH_MAX, IV_TOTAL_MAX, STAT_KEYS, STAT_LABELS, type StatKey } from '../domain/types'
import { Badge, Button, Callout, Modal, Tooltip } from './ui'

function growthText(entry: CompareEntry, key: StatKey): string {
  const g = entry.growths[key]
  return g.min === g.max ? String(g.min) : `${g.min}–${g.max}`
}

function ivTotalText(entry: CompareEntry): string {
  const { min, max } = entry.ivTotal
  return min === max ? String(min) : `${min}–${max}`
}

/** Primeira coluna fixa: sem ela, rolar a tabela faz perder qual linha é qual. */
const stickyLabel =
  'sticky left-0 z-10 bg-[var(--color-surface-base)] py-2 pr-3 text-left text-xs font-semibold text-[var(--color-text-secondary)]'

export function CompareModal({
  entries,
  speciesName,
  open,
  onClose,
}: {
  entries: CompareEntry[]
  speciesName: string
  open: boolean
  onClose: () => void
}) {
  const ranked = rankEntries(entries)
  const groups = groupByGrade(entries)
  const best = bestPerStat(entries)
  const ambiguo = hasAmbiguity(entries)

  return (
    <Modal open={open} onClose={onClose} labelledBy="compare-title" testId="compare-modal">
      <div className="mx-auto flex h-full max-w-6xl flex-col">
        <header className="flex items-start justify-between gap-4 border-b border-[var(--color-border-default)] px-4 py-4 sm:px-6 sm:py-5">
          <div className="min-w-0">
            <h2 id="compare-title" className="text-lg font-bold text-[var(--color-text-primary)]">
              Comparação · <span className="capitalize">{speciesName}</span>
            </h2>
            <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">
              {entries.length} Pokémon, ordenados por grade de distribuição de IV.
            </p>
          </div>
          <Button variant="ghost" onClick={onClose}>
            Fechar
          </Button>
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-6">
          {ambiguo && (
            <div className="mb-5">
              <Callout tone="warn">
                Algum Pokémon ficou com IVs ambíguos, então a comparação é aproximada. Informe o IV
                total ou suba de level e refaça para ter certeza.
              </Callout>
            </div>
          )}

          {/* Pódio: a resposta que o usuário veio buscar, antes de qualquer tabela. */}
          <section data-testid="compare-podium" className="mb-8">
            <h3 className="mb-3 text-xs font-semibold tracking-wide text-[var(--color-text-secondary)] uppercase">
              Ranking
            </h3>
            <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {ranked.map((entry, index) => {
                const color = GRADE_COLORS[entry.grade.maxGrade]
                return (
                  <li
                    key={entry.id}
                    data-testid={`podium-${index}`}
                    className="flex items-center gap-3 rounded-[var(--radius-lg)] border p-3"
                    style={{
                      borderColor: `color-mix(in srgb, ${color} 40%, transparent)`,
                      backgroundColor: `color-mix(in srgb, ${color} 8%, transparent)`,
                    }}
                  >
                    <span className="tabular w-5 shrink-0 text-center text-sm text-[var(--color-text-tertiary)]">
                      {index + 1}
                    </span>
                    <span
                      className="tabular flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-md)] border-2 text-base font-bold"
                      style={{ color, borderColor: `color-mix(in srgb, ${color} 45%, transparent)` }}
                    >
                      {entry.grade.label}
                    </span>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-[var(--color-text-primary)]">
                        {entry.nickname}
                      </div>
                      <div className="tabular text-xs text-[var(--color-text-tertiary)]">
                        score {(entry.grade.maxScore * 100).toFixed(1)}% · IV {ivTotalText(entry)}/
                        {IV_TOTAL_MAX}
                      </div>
                      {entry.grade.perfectRolls.qualifies && (
                        <div className="mt-1">
                          <Tooltip content={explainPerfectRolls(entry.grade)}>
                            <Badge color={GRADE_COLORS.SS}>
                              ★ {entry.grade.perfectRolls.stats.length} IVs perfeitos
                            </Badge>
                          </Tooltip>
                        </div>
                      )}
                    </div>
                  </li>
                )
              })}
            </ol>
          </section>

          <section data-testid="compare-groups" className="mb-8">
            <h3 className="mb-3 text-xs font-semibold tracking-wide text-[var(--color-text-secondary)] uppercase">
              Por tier
            </h3>
            <div className="space-y-2">
              {groups.map((group) => {
                const color = GRADE_COLORS[group.grade]
                return (
                  <div
                    key={group.grade}
                    data-testid={`group-${group.grade}`}
                    className="flex items-center gap-4 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)] px-4 py-3"
                  >
                    <span
                      className="tabular w-10 shrink-0 text-center text-xl font-bold"
                      style={{ color }}
                    >
                      {group.grade}
                    </span>
                    <span className="text-sm text-[var(--color-text-primary)]">
                      {group.entries.map((entry) => entry.nickname).join(', ')}
                    </span>
                  </div>
                )
              })}
            </div>
          </section>

          <section>
            <h3 className="mb-3 text-xs font-semibold tracking-wide text-[var(--color-text-secondary)] uppercase">
              Detalhe por Pokémon
            </h3>
            <div className="overflow-x-auto">
              <table data-testid="compare-table" className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--color-border-default)]">
                    <th className={stickyLabel}>
                      <span className="sr-only">Atributo</span>
                    </th>
                    {ranked.map((entry) => (
                      <th
                        key={entry.id}
                        scope="col"
                        className="min-w-28 px-3 py-2 text-left font-semibold text-[var(--color-text-primary)]"
                      >
                        {entry.nickname}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <Row label="Grade" ranked={ranked} value={(e) => e.grade.label} />
                  <Row
                    label="Score"
                    ranked={ranked}
                    value={(e) => `${(e.grade.maxScore * 100).toFixed(1)}%`}
                  />
                  <Row label="Level" ranked={ranked} value={(e) => String(e.level)} />
                  <Row label="Quality" ranked={ranked} value={(e) => String(e.quality)} />
                  <Row
                    label="Power"
                    ranked={ranked}
                    value={(e) => e.power.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}
                  />
                  <Row label={`IV total /${IV_TOTAL_MAX}`} ranked={ranked} value={ivTotalText} />
                  {STAT_KEYS.map((key) => (
                    <tr key={key} className="border-t border-[var(--color-border-subtle)]">
                      <th scope="row" className={stickyLabel}>
                        {STAT_LABELS[key]}
                      </th>
                      {ranked.map((entry) => {
                        const wins = best[key].includes(entry.id) && ranked.length > 1
                        return (
                          <td
                            key={entry.id}
                            data-testid={`cell-${key}-${entry.id}`}
                            className={`tabular px-3 py-2 ${
                              wins
                                ? 'font-bold text-[var(--color-ok)]'
                                : 'text-[var(--color-text-primary)]'
                            }`}
                          >
                            {wins && (
                              <span aria-label="melhor" title="melhor">
                                ▲{' '}
                              </span>
                            )}
                            {growthText(entry, key)}
                            <span className="text-[var(--color-text-tertiary)]">/{GROWTH_MAX}</span>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-[var(--color-text-tertiary)]">
              ▲ marca o maior growth garantido de cada stat. Faixas ambíguas são comparadas pelo
              piso — ninguém ganha destaque por um teto que talvez não exista.
            </p>
          </section>
        </div>
      </div>
    </Modal>
  )
}

function Row({
  label,
  ranked,
  value,
}: {
  label: string
  ranked: CompareEntry[]
  value: (entry: CompareEntry) => string
}) {
  return (
    <tr className="border-t border-[var(--color-border-subtle)]">
      <th scope="row" className={stickyLabel}>
        {label}
      </th>
      {ranked.map((entry) => (
        <td key={entry.id} className="tabular px-3 py-2 text-[var(--color-text-primary)]">
          {value(entry)}
        </td>
      ))}
    </tr>
  )
}
