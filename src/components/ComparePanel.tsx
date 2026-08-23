import { GRADE_COLORS } from '../config/grade.config'
import { COMPARE_MAX, COMPARE_MIN, type CompareEntry } from '../domain/compare'
import { IV_TOTAL_MAX } from '../domain/types'
import { Badge, Button, Callout, IconButton, Panel } from './ui'

function TrashIcon() {
  return (
    <svg viewBox="0 0 20 20" width="17" height="17" fill="none" aria-hidden>
      <path
        d="M3.5 5.5h13M8 5.5V4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1.5M5.5 5.5 6 16a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1l.5-10.5M8.5 8.5v5M11.5 8.5v5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

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
                  className="flex items-center gap-3 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-inset)] p-2 pl-3"
                >
                  <span
                    className="tabular flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-sm)] border text-xs font-bold"
                    style={{
                      color,
                      borderColor: `color-mix(in srgb, ${color} 45%, transparent)`,
                      backgroundColor: `color-mix(in srgb, ${color} 10%, transparent)`,
                    }}
                  >
                    {entry.grade.label}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm text-[var(--color-text-primary)]">
                      {entry.nickname}
                    </div>
                    <div className="tabular text-xs text-[var(--color-text-tertiary)]">
                      lv {entry.level} · q {entry.quality} ·{' '}
                      {entry.ivTotal.min === entry.ivTotal.max
                        ? entry.ivTotal.min
                        : `${entry.ivTotal.min}–${entry.ivTotal.max}`}
                      /{IV_TOTAL_MAX}
                    </div>
                  </div>

                  {!entry.isExact && <Badge color="var(--color-warn)">ambíguo</Badge>}

                  <IconButton label={`Remover ${entry.nickname}`} onClick={() => onRemove(entry.id)}>
                    <TrashIcon />
                  </IconButton>
                </li>
              )
            })}
          </ul>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button onClick={onValidate} disabled={!enough}>
              Validar comparação
            </Button>
            <Button variant="ghost" onClick={onClear}>
              Limpar comparação
            </Button>
          </div>

          {(!enough || full) && (
            <p className="mt-2 text-xs text-[var(--color-text-tertiary)]">
              {!enough
                ? `Faltam ${COMPARE_MIN - entries.length} para comparar.`
                : `Máximo de ${COMPARE_MAX} atingido.`}
            </p>
          )}
        </>
      )}
    </Panel>
  )
}
