import { useMemo } from 'react'
import { EXPONENTS } from '../config/formula.config'
import { calibrateAll, supports, type CalibrationSpecimen } from '../domain/calibrate'
import { STAT_KEYS, STAT_LABELS } from '../domain/types'
import { Badge, Button, Callout, Panel } from './ui'

/** Expoentes que queremos julgar: os das duas hipóteses em disputa. */
const CANDIDATES = [0.8, 0.95, 1] as const

export function CalibrationPanel({
  specimens,
  canAdd,
  onAdd,
  onRemove,
  onClear,
}: {
  specimens: CalibrationSpecimen[]
  canAdd: boolean
  onAdd: () => void
  onRemove: (id: string) => void
  onClear: () => void
}) {
  const calibration = useMemo(() => calibrateAll(specimens), [specimens])

  const contradictory = useMemo(
    () =>
      Array.from(
        new Set(STAT_KEYS.flatMap((key) => calibration[key].contradictorySpecimens)),
      ),
    [calibration],
  )

  const uninformative = specimens.length > 0 && specimens.every((s) => s.quality === 1)

  return (
    <Panel
      testId="calibration-panel"
      title="Calibrar expoentes"
      hint="Cadastre Pokémon reais seus. Cada um elimina os expoentes que não explicam os stats observados."
      right={
        <div className="flex gap-2">
          {specimens.length > 0 && (
            <Button variant="ghost" onClick={onClear}>
              Limpar
            </Button>
          )}
          <Button onClick={onAdd} disabled={!canAdd}>
            + Usar o espécime atual
          </Button>
        </div>
      }
    >
      {specimens.length === 0 ? (
        <Callout tone="info">
          Preencha espécie, level, quality e os seis stats na aba Calculadora, depois clique
          em "Usar o espécime atual". Pokémon com quality alta e variada estreitam muito mais
          rápido — quality 1,0 não informa nada, porque qualquer expoente vale 1 ali.
        </Callout>
      ) : (
        <>
          <div className="mb-4 space-y-1">
            {specimens.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between rounded-lg border border-[var(--color-edge)] bg-[var(--color-panel-2)]/60 px-3 py-2 text-xs"
              >
                <span className="text-white capitalize">
                  {s.label}
                  <span className="ml-2 text-[var(--color-muted)]">
                    lv {s.level} · quality {s.quality}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => onRemove(s.id)}
                  className="text-[var(--color-muted)] transition hover:text-rose-300"
                >
                  remover
                </button>
              </div>
            ))}
          </div>

          {uninformative && (
            <div className="mb-4">
              <Callout tone="warn">
                Todos os espécimes têm quality 1,0. Nessa quality qualquer expoente dá o mesmo
                resultado, então nada é eliminado. Cadastre Pokémon com quality mais alta.
              </Callout>
            </div>
          )}

          {contradictory.length > 0 && (
            <div className="mb-4">
              <Callout tone="error">
                Nenhum expoente explica {contradictory.join(', ')}. Confira os stats digitados
                — ou a fórmula do jogo mudou.
              </Callout>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-[var(--color-muted)]">
                  <th className="py-2 text-left font-medium">Stat</th>
                  <th className="py-2 text-left font-medium">Faixa viável</th>
                  {CANDIDATES.map((c) => (
                    <th key={c} className="py-2 text-center font-medium">
                      {c.toFixed(2)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {STAT_KEYS.map((key) => {
                  const c = calibration[key]
                  const discordExp = EXPONENTS.discord[key]
                  return (
                    <tr key={key} className="border-t border-[var(--color-edge)]">
                      <td className="py-2 font-semibold text-white">{STAT_LABELS[key]}</td>
                      <td className="py-2 font-mono text-[var(--color-muted)]">
                        {c.min === null
                          ? '—'
                          : c.min === c.max
                            ? c.min.toFixed(2)
                            : `${c.min.toFixed(2)} – ${c.max!.toFixed(2)}`}
                      </td>
                      {CANDIDATES.map((cand) => {
                        const ok = supports(c, cand)
                        const isDiscord = cand === discordExp
                        return (
                          <td key={cand} className="py-2 text-center">
                            <span
                              title={isDiscord ? 'hipótese do modo Discord' : undefined}
                              className={ok ? 'text-emerald-300' : 'text-rose-400/60'}
                            >
                              {ok ? '✓' : '✕'}
                              {isDiscord && ok && ' ★'}
                            </span>
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <p className="mt-3 text-[11px] text-[var(--color-muted)]">
            ✓ = o expoente ainda explica todos os espécimes. ★ marca a hipótese do modo
            Discord (0,95 em HP/Vel, 0,80 nos demais). Se a coluna 1,00 sobreviver sozinha, a
            fórmula oficial está certa e o modo Discord está errado.
          </p>

          <div className="mt-3">
            <Badge>{specimens.length} espécime(s) cadastrado(s)</Badge>
          </div>
        </>
      )}
    </Panel>
  )
}
