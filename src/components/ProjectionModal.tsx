import { useMemo, useState } from 'react'
import { POWER_COLOR, SERIES_COLORS } from '../config/chart.config'
import {
  PROJECTION_STEP,
  clampLevel,
  hasSpread,
  milestoneLevels,
  powerGain,
  projectAt,
  projectSeries,
  type ProjectionInput,
} from '../domain/projection'
import { STAT_KEYS, STAT_LABELS } from '../domain/types'
import { LineChart, type Serie } from './charts/LineChart'
import { Button, Callout, Field, Modal, NumberInput } from './ui'

const int = (v: number) => Math.round(v).toLocaleString('pt-BR')
const pct = (v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`

/** Abrevia no eixo: 12.400 vira "12,4 mil". */
function curto(v: number): string {
  if (v >= 1000) return `${(v / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mil`
  return int(v)
}

export function ProjectionModal({
  input,
  currentLevel,
  speciesName,
  open,
  onClose,
}: {
  input: ProjectionInput
  currentLevel: number
  speciesName: string
  open: boolean
  onClose: () => void
}) {
  const atualLvl = clampLevel(currentLevel)
  const [alvo, setAlvo] = useState(() => atualLvl + 100)
  const [texto, setTexto] = useState(String(atualLvl + 100))

  /*
   * O jogo não tem teto de level, então o campo aceita qualquer número. O
   * slider precisa de um fim, e ele acompanha: vai até 500 acima do level
   * atual, ou até onde o usuário digitou, o que for maior.
   */
  const tetoSlider = Math.max(atualLvl + 500, alvo)

  const aplicar = (v: string) => {
    setTexto(v)
    const n = Number(v)
    if (Number.isFinite(n) && n >= atualLvl) setAlvo(clampLevel(n))
  }

  const serie = useMemo(
    () => projectSeries(input, atualLvl, alvo),
    [input, atualLvl, alvo],
  )
  const atual = useMemo(() => projectAt(input, atualLvl), [input, atualLvl])
  const destino = useMemo(() => projectAt(input, alvo), [input, alvo])
  const marcos = useMemo(
    () => milestoneLevels(atualLvl).map((lvl) => projectAt(input, lvl)),
    [input, atualLvl],
  )

  const incerto = hasSpread(destino)
  const levels = serie.map((p) => p.level)

  const powerSerie: Serie[] = [
    {
      key: 'power',
      label: 'Power',
      color: POWER_COLOR,
      values: serie.map((p) => p.power),
      band: incerto
        ? { min: serie.map((p) => p.powerMin), max: serie.map((p) => p.powerMax) }
        : undefined,
    },
  ]

  const statSerie: Serie[] = STAT_KEYS.map((key) => ({
    key,
    label: STAT_LABELS[key],
    color: SERIES_COLORS[key],
    values: serie.map((p) => p.stats[key]),
    band: incerto
      ? { min: serie.map((p) => p.statsMin[key]), max: serie.map((p) => p.statsMax[key]) }
      : undefined,
  }))

  return (
    <Modal
      open={open}
      onClose={onClose}
      labelledBy="projection-title"
      testId="projection-modal"
      variant="centered"
    >
      <div className="flex h-full flex-col">
        <header className="flex items-start justify-between gap-4 border-b border-[var(--color-border-default)] px-4 py-4 sm:px-6 sm:py-5">
          <div className="min-w-0">
            <h2
              id="projection-title"
              className="text-lg font-bold text-[var(--color-text-primary)]"
            >
              Futuro · <span className="capitalize">{speciesName}</span>
            </h2>
            <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">
              Stats e Power conforme este Pokémon sobe de level.
            </p>
          </div>
          <Button variant="ghost" onClick={onClose}>
            Fechar
          </Button>
        </header>

        <div className="flex-1 space-y-5 overflow-y-auto px-4 py-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-6">
          {incerto && (
            <Callout tone="warn">
              Os IVs ou a quality ainda têm faixa, então a projeção é aproximada. A área sombreada
              mostra o mínimo e o máximo possíveis — informe o IV total para fechar.
            </Callout>
          )}

          {/* --- marcos: a leitura de dois segundos --- */}
          <section>
            <h3 className="mb-3 text-xs font-semibold tracking-wide text-[var(--color-text-secondary)] uppercase">
              Próximos marcos
            </h3>
            <ul data-testid="milestones" className="grid gap-3 sm:grid-cols-3">
              {marcos.map((p, i) => (
                <li
                  key={p.level}
                  data-testid={`milestone-${i}`}
                  className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-inset)] p-4"
                >
                  <div className="text-xs text-[var(--color-text-secondary)]">
                    {i === 0 ? `Agora · level ${p.level}` : `Level ${p.level}`}
                  </div>
                  <div className="mt-1 text-2xl font-bold text-[var(--color-text-primary)]">
                    {int(p.power)}
                  </div>
                  <div className="mt-1 text-xs text-[var(--color-text-tertiary)]">
                    {i === 0 ? 'Power atual' : `Power · ${pct(powerGain(atual, p))}`}
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {/* --- level alvo --- */}
          <section className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] p-4">
            <div className="grid gap-3 sm:grid-cols-[10rem_1fr] sm:items-end">
              <Field label="Level alvo" hint={`a partir de ${atualLvl} — sem teto`}>
                <NumberInput value={texto} min={atualLvl} onChange={aplicar} />
              </Field>
              <label className="block pb-2">
                <span className="sr-only">Level alvo (deslizante)</span>
                <input
                  type="range"
                  min={atualLvl}
                  max={tetoSlider}
                  value={alvo}
                  onChange={(e) => {
                    setAlvo(Number(e.target.value))
                    setTexto(e.target.value)
                  }}
                  className="w-full accent-[var(--accent)]"
                />
              </label>
            </div>

            <p className="mt-3 text-sm text-[var(--color-text-secondary)]">
              No level <strong className="text-[var(--color-text-primary)]">{alvo}</strong> o Power
              vai a{' '}
              <strong data-testid="target-power" className="text-[var(--color-text-primary)]">
                {int(destino.power)}
              </strong>{' '}
              — <span className="text-[var(--accent)]">{pct(powerGain(atual, destino))}</span> em
              relação a agora.
            </p>
          </section>

          {/* --- Power e stats em gráficos separados: escalas diferentes --- */}
          <section>
            <h3 className="mb-2 text-xs font-semibold tracking-wide text-[var(--color-text-secondary)] uppercase">
              Power por level
            </h3>
            <LineChart
              testId="power-chart"
              title={`Power de ${speciesName} do level ${atualLvl} ao ${alvo}`}
              levels={levels}
              series={powerSerie}
              formatAxis={curto}
              formatValue={int}
              bandMode="always"
            />
          </section>

          <section>
            <h3 className="mb-2 text-xs font-semibold tracking-wide text-[var(--color-text-secondary)] uppercase">
              Stats por level
            </h3>
            <LineChart
              testId="stats-chart"
              title={`Stats de ${speciesName} do level ${atualLvl} ao ${alvo}`}
              levels={levels}
              series={statSerie}
              formatAxis={curto}
              formatValue={int}
              bandMode="hover"
            />
            <p className="mt-2 text-xs text-[var(--color-text-tertiary)]">
              Passe o mouse numa cor da legenda para isolar o stat{incerto ? ' e ver a faixa' : ''}.
            </p>
          </section>

          {/* --- tabela: também é a visão acessível dos gráficos --- */}
          <section>
            <h3 className="mb-3 text-xs font-semibold tracking-wide text-[var(--color-text-secondary)] uppercase">
              Agora × level {alvo}
            </h3>
            <div className="overflow-x-auto">
              <table data-testid="projection-table" className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--color-border-default)] text-left">
                    <th className="py-2 pr-3 text-xs font-semibold text-[var(--color-text-secondary)]">
                      Stat
                    </th>
                    <th className="py-2 pr-3 text-xs font-semibold text-[var(--color-text-secondary)]">
                      Level {atualLvl}
                    </th>
                    <th className="py-2 pr-3 text-xs font-semibold text-[var(--color-text-secondary)]">
                      Level {alvo}
                    </th>
                    <th className="py-2 text-xs font-semibold text-[var(--color-text-secondary)]">
                      Ganho
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {STAT_KEYS.map((key) => (
                    <tr key={key} className="border-t border-[var(--color-border-subtle)]">
                      <th
                        scope="row"
                        className="py-2 pr-3 text-left text-xs font-semibold text-[var(--color-text-secondary)]"
                      >
                        {STAT_LABELS[key]}
                      </th>
                      <td className="tabular py-2 pr-3 text-[var(--color-text-primary)]">
                        {int(atual.stats[key])}
                      </td>
                      <td className="tabular py-2 pr-3 text-[var(--color-text-primary)]">
                        {int(destino.stats[key])}
                      </td>
                      <td className="tabular py-2 text-[var(--color-ok)]">
                        +{int(destino.stats[key] - atual.stats[key])}
                      </td>
                    </tr>
                  ))}
                  <tr className="border-t border-[var(--color-border-default)]">
                    <th
                      scope="row"
                      className="py-2 pr-3 text-left text-xs font-semibold text-[var(--color-text-primary)]"
                    >
                      Power
                    </th>
                    <td className="tabular py-2 pr-3 text-[var(--color-text-primary)]">
                      {int(atual.power)}
                    </td>
                    <td className="tabular py-2 pr-3 text-[var(--color-text-primary)]">
                      {int(destino.power)}
                    </td>
                    <td className="tabular py-2 text-[var(--color-ok)]">
                      {pct(powerGain(atual, destino))}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <details className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)]">
            <summary className="cursor-pointer px-4 py-3 text-sm text-[var(--color-text-secondary)]">
              Ver de {PROJECTION_STEP} em {PROJECTION_STEP} levels
            </summary>
            <div className="overflow-x-auto px-4 pb-4">
              <table data-testid="steps-table" className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--color-border-default)] text-left">
                    <th className="py-2 pr-3 text-xs font-semibold text-[var(--color-text-secondary)]">
                      Level
                    </th>
                    <th className="py-2 pr-3 text-xs font-semibold text-[var(--color-text-secondary)]">
                      Power
                    </th>
                    <th className="py-2 text-xs font-semibold text-[var(--color-text-secondary)]">
                      Ganho
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {serie.map((p) => (
                    <tr key={p.level} className="border-t border-[var(--color-border-subtle)]">
                      <td className="tabular py-1.5 pr-3 text-[var(--color-text-primary)]">
                        {p.level}
                      </td>
                      <td className="tabular py-1.5 pr-3 text-[var(--color-text-primary)]">
                        {int(p.power)}
                      </td>
                      <td className="tabular py-1.5 text-[var(--color-text-tertiary)]">
                        {pct(powerGain(atual, p))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </div>
      </div>
    </Modal>
  )
}
