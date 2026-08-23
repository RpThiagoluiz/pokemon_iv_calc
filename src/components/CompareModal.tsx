import { useEffect, useRef } from 'react'
import { GRADE_COLORS } from '../config/grade.config'
import { bestPerStat, groupByGrade, hasAmbiguity, rankEntries } from '../domain/compare'
import type { CompareEntry } from '../domain/compare'
import { explainPerfectRolls } from '../domain/explain'
import { GROWTH_MAX, IV_TOTAL_MAX, STAT_KEYS, STAT_LABELS, type StatKey } from '../domain/types'
import { Badge, Button, Callout, Tooltip } from './ui'

function growthText(entry: CompareEntry, key: StatKey): string {
  const g = entry.growths[key]
  return g.min === g.max ? String(g.min) : `${g.min}–${g.max}`
}

function ivTotalText(entry: CompareEntry): string {
  const { min, max } = entry.ivTotal
  return min === max ? String(min) : `${min}–${max}`
}

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
  const ref = useRef<HTMLDialogElement>(null)

  /**
   * `<dialog>` nativo em vez de um overlay caseiro: `showModal()` traz foco
   * preso, fechar no Esc e backdrop inerte de graça — coisas que uma div com
   * `role="dialog"` só ganha com bastante código e costuma ganhar errado.
   */
  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  const ranked = rankEntries(entries)
  const groups = groupByGrade(entries)
  const best = bestPerStat(entries)
  const ambiguo = hasAmbiguity(entries)

  return (
    <dialog
      ref={ref}
      data-testid="compare-modal"
      onClose={onClose}
      className="m-0 h-screen max-h-none w-screen max-w-none bg-[var(--color-ink)] p-0 text-[#e8ecff] backdrop:bg-black/70"
    >
      <div className="mx-auto flex h-full max-w-6xl flex-col">
        <header className="flex items-start justify-between gap-4 border-b border-[var(--color-edge)] px-6 py-5">
          <div>
            <h2 className="text-lg font-bold text-white">
              Comparação · <span className="capitalize">{speciesName}</span>
            </h2>
            <p className="mt-1 text-xs text-[var(--color-muted)]">
              {entries.length} Pokémon, ordenados por grade de distribuição de IV.
            </p>
          </div>
          <Button variant="ghost" onClick={onClose}>
            Fechar
          </Button>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          {ambiguo && (
            <div className="mb-5">
              <Callout tone="warn">
                Algum Pokémon ficou com IVs ambíguos, então a comparação é aproximada. Informe o
                IV total ou suba de level e refaça para ter certeza.
              </Callout>
            </div>
          )}

          {/* Pódio: a resposta que o usuário veio buscar, antes de qualquer tabela. */}
          <section data-testid="compare-podium" className="mb-8">
            <h3 className="mb-3 text-xs font-semibold tracking-wide text-white uppercase">
              Ranking
            </h3>
            <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {ranked.map((entry, index) => {
                const color = GRADE_COLORS[entry.grade.maxGrade]
                return (
                  <li
                    key={entry.id}
                    data-testid={`podium-${index}`}
                    className="flex items-center gap-3 rounded-xl border p-3"
                    style={{ borderColor: `${color}55`, backgroundColor: `${color}10` }}
                  >
                    <span className="w-5 shrink-0 text-center font-mono text-sm text-[var(--color-muted)]">
                      {index + 1}
                    </span>
                    <span
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border-2 text-base font-black"
                      style={{ color, borderColor: `${color}66` }}
                    >
                      {entry.grade.label}
                    </span>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-white">
                        {entry.nickname}
                      </div>
                      <div className="text-[11px] text-[var(--color-muted)]">
                        score {(entry.grade.maxScore * 100).toFixed(1)}% · IV{' '}
                        {ivTotalText(entry)}/{IV_TOTAL_MAX}
                      </div>
                      {entry.grade.perfectRolls.qualifies && (
                        <div className="mt-1">
                          <Tooltip content={explainPerfectRolls(entry.grade)}>
                            <Badge color="#f472b6">
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
            <h3 className="mb-3 text-xs font-semibold tracking-wide text-white uppercase">
              Por tier
            </h3>
            <div className="space-y-2">
              {groups.map((group) => {
                const color = GRADE_COLORS[group.grade]
                return (
                  <div
                    key={group.grade}
                    data-testid={`group-${group.grade}`}
                    className="flex items-center gap-4 rounded-lg border border-[var(--color-edge)] bg-[var(--color-panel)]/60 px-4 py-3"
                  >
                    <span
                      className="w-12 shrink-0 text-center text-xl font-black"
                      style={{ color }}
                    >
                      {group.grade}
                    </span>
                    <span className="text-sm text-white">
                      {group.entries.map((entry) => entry.nickname).join(', ')}
                    </span>
                  </div>
                )
              })}
            </div>
          </section>

          <section>
            <h3 className="mb-3 text-xs font-semibold tracking-wide text-white uppercase">
              Detalhe por Pokémon
            </h3>
            <div className="overflow-x-auto">
              <table data-testid="compare-table" className="w-full min-w-[36rem] text-sm">
                <thead>
                  <tr className="border-b border-[var(--color-edge)]">
                    <th className="py-2 text-left text-xs font-medium text-[var(--color-muted)]">
                      &nbsp;
                    </th>
                    {ranked.map((entry) => (
                      <th key={entry.id} className="px-3 py-2 text-left text-white">
                        {entry.nickname}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="font-mono">
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
                    <tr key={key} className="border-t border-[var(--color-edge)]/60">
                      <td className="py-2 text-xs font-semibold text-[var(--color-muted)]">
                        {STAT_LABELS[key]}
                      </td>
                      {ranked.map((entry) => {
                        const wins = best[key].includes(entry.id) && ranked.length > 1
                        return (
                          <td
                            key={entry.id}
                            data-testid={`cell-${key}-${entry.id}`}
                            className={`px-3 py-2 ${wins ? 'font-bold text-emerald-300' : 'text-white'}`}
                          >
                            {growthText(entry, key)}
                            <span className="text-[var(--color-muted)]">/{GROWTH_MAX}</span>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-[11px] text-[var(--color-muted)]">
              Em verde, o maior growth garantido de cada stat. Faixas ambíguas são comparadas pelo
              piso — ninguém ganha destaque por um teto que talvez não exista.
            </p>
          </section>
        </div>
      </div>
    </dialog>
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
    <tr className="border-t border-[var(--color-edge)]/60">
      <td className="py-2 text-xs font-semibold text-[var(--color-muted)]">{label}</td>
      {ranked.map((entry) => (
        <td key={entry.id} className="px-3 py-2 text-white">
          {value(entry)}
        </td>
      ))}
    </tr>
  )
}
