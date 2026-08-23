import { GRADE_COLORS } from '../config/grade.config'
import { COMPARE_MAX, COMPARE_MIN, type CompareEntry } from '../domain/compare'
import { IV_TOTAL_MAX } from '../domain/types'
import { Badge, Button, Callout, Panel } from './ui'

export function ComparePanel({
  entries,
  canAdd,
  addBlockedReason,
  onAdd,
  onRemove,
  onClear,
  onValidate,
}: {
  entries: CompareEntry[]
  canAdd: boolean
  /** Por que o botão está travado — some do caminho quando `canAdd` é true. */
  addBlockedReason: string | null
  onAdd: () => void
  onRemove: (id: string) => void
  onClear: () => void
  onValidate: () => void
}) {
  const full = entries.length >= COMPARE_MAX
  const enough = entries.length >= COMPARE_MIN

  return (
    <Panel
      testId="compare-panel"
      title="Comparar Pokémon"
      hint={`Guarde de ${COMPARE_MIN} a ${COMPARE_MAX} Pokémon da mesma espécie e veja lado a lado qual é o melhor.`}
      right={
        <Button onClick={onAdd} disabled={!canAdd || full}>
          + Comparar
        </Button>
      }
    >
      {entries.length === 0 ? (
        <Callout tone="info">
          {addBlockedReason ??
            'Preencha um Pokémon e clique em "+ Comparar". Depois troque os dados e adicione o próximo.'}
        </Callout>
      ) : (
        <>
          <ul data-testid="compare-list" className="space-y-2">
            {entries.map((entry) => {
              const color = GRADE_COLORS[entry.grade.maxGrade]
              return (
                <li
                  key={entry.id}
                  className="flex items-center gap-3 rounded-lg border border-[var(--color-edge)] bg-[var(--color-panel-2)]/60 px-3 py-2"
                >
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-xs font-black"
                    style={{ color, borderColor: `${color}66`, backgroundColor: `${color}14` }}
                  >
                    {entry.grade.label}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-xs text-white">
                    {entry.nickname}
                    <span className="ml-2 text-[var(--color-muted)]">
                      lv {entry.level} · q {entry.quality}
                    </span>
                  </span>
                  <span className="shrink-0 font-mono text-xs text-[var(--color-muted)]">
                    {entry.ivTotal.min === entry.ivTotal.max
                      ? entry.ivTotal.min
                      : `${entry.ivTotal.min}–${entry.ivTotal.max}`}
                    /{IV_TOTAL_MAX}
                  </span>
                  {!entry.isExact && <Badge color="#fbbf24">ambíguo</Badge>}
                  <button
                    type="button"
                    aria-label={`Remover ${entry.nickname}`}
                    onClick={() => onRemove(entry.id)}
                    className="shrink-0 text-xs text-[var(--color-muted)] transition hover:text-rose-300"
                  >
                    remover
                  </button>
                </li>
              )
            })}
          </ul>

          <div className="mt-4 flex items-center gap-2">
            <Button onClick={onValidate} disabled={!enough}>
              Validar comparação
            </Button>
            <Button variant="ghost" onClick={onClear}>
              Limpar comparação
            </Button>
            {!enough && (
              <span className="text-[11px] text-[var(--color-muted)]">
                Faltam {COMPARE_MIN - entries.length} para comparar.
              </span>
            )}
            {full && (
              <span className="text-[11px] text-[var(--color-muted)]">
                Máximo de {COMPARE_MAX} atingido.
              </span>
            )}
          </div>
        </>
      )}
    </Panel>
  )
}
