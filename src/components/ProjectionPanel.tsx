import { useMemo } from 'react'
import {
  milestoneLevels,
  powerGain,
  projectAt,
  type ProjectionInput,
} from '../domain/projection'
import { Button, Panel } from './ui'

const int = (v: number) => Math.round(v).toLocaleString('pt-BR')
const pct = (v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`

export function ProjectionPanel({
  input,
  currentLevel,
  onOpen,
}: {
  input: ProjectionInput
  currentLevel: number
  onOpen: () => void
}) {
  /*
   * A prévia mostra só os marcos futuros — o level atual já está no card de
   * Power logo acima, e repetir ali seria ruído.
   */
  const previa = useMemo(() => {
    const niveis = milestoneLevels(currentLevel)
    const atual = projectAt(input, niveis[0])
    return niveis.slice(1).map((lvl) => {
      const p = projectAt(input, lvl)
      return { level: lvl, power: p.power, ganho: powerGain(atual, p) }
    })
  }, [input, currentLevel])

  return (
    <Panel
      testId="projection-panel"
      title="Futuro do Pokémon"
      hint="Veja como os stats e o Power crescem conforme ele sobe de level."
      right={<Button onClick={onOpen}>Ver evolução</Button>}
    >
      {previa.length > 0 ? (
        <ul data-testid="projection-preview" className="grid grid-cols-2 gap-3">
          {previa.map((p) => (
            <li
              key={p.level}
              className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-inset)] p-3"
            >
              <div className="text-xs text-[var(--color-text-secondary)]">Level {p.level}</div>
              <div className="tabular mt-0.5 text-lg font-bold text-[var(--color-text-primary)]">
                {int(p.power)}
              </div>
              <div className="tabular mt-0.5 text-xs text-[var(--accent)]">
                {pct(p.ganho)} de Power
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-[var(--color-text-tertiary)]">
          Este Pokémon já está no teto de level.
        </p>
      )}
    </Panel>
  )
}
