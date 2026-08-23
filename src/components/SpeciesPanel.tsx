import { useState } from 'react'
import type { UseSpeciesResult } from '../hooks/useSpecies'
import { STAT_KEYS, STAT_LABELS } from '../domain/types'
import { Badge, Button, Callout, Field, NumberInput, Panel, TextInput } from './ui'

export function SpeciesPanel({ species: s }: { species: UseSpeciesResult }) {
  const [query, setQuery] = useState('vulpix')

  return (
    <Panel
      title="Espécie"
      hint="Base stats vêm da PokeAPI. Se divergirem do jogo, edite — a correção fica salva."
      right={
        s.species && (
          <div className="flex gap-2">
            {s.overriddenStats.length > 0 && (
              <Button variant="ghost" onClick={s.resetOverrides}>
                Reverter
              </Button>
            )}
            <Button variant="ghost" onClick={() => void s.load(s.species!.slug, true)}>
              Recarregar
            </Button>
          </div>
        )
      }
    >
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <Field label="Nome do Pokémon">
            <TextInput
              value={query}
              onChange={setQuery}
              placeholder="vulpix, alakazam, mr-mime…"
              onEnter={() => void s.load(query)}
            />
          </Field>
        </div>
        <Button onClick={() => void s.load(query)} disabled={s.loading}>
          {s.loading ? 'Buscando…' : 'Buscar'}
        </Button>
      </div>

      {s.error && (
        <div className="mt-3">
          <Callout tone="error">{s.error}</Callout>
        </div>
      )}

      {s.species && (
        <>
          <div className="mt-4 flex items-center gap-3">
            {s.species.spriteUrl && (
              <img
                src={s.species.spriteUrl}
                alt={s.species.name}
                className="h-16 w-16 [image-rendering:pixelated]"
              />
            )}
            <div>
              <div className="text-lg font-semibold text-white capitalize">
                {s.species.name} <span className="text-[var(--color-muted)]">#{s.species.id}</span>
              </div>
              <div className="mt-1 flex gap-1">
                {s.species.types.map((t) => (
                  <Badge key={t}>{t}</Badge>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-6">
            {STAT_KEYS.map((key) => {
              const overridden = s.overriddenStats.includes(key)
              return (
                <Field key={key} label={`Base ${STAT_LABELS[key]}`}>
                  <NumberInput
                    value={String(s.baseStats[key])}
                    highlight={overridden}
                    min={1}
                    onChange={(v) => s.setBaseStat(key, Number(v) || 0)}
                  />
                </Field>
              )
            })}
          </div>

          {s.overriddenStats.length > 0 && (
            <div className="mt-3">
              <Callout tone="warn">
                {s.overriddenStats.map((k) => STAT_LABELS[k]).join(', ')} sobrescrito(s)
                manualmente — o valor da PokeAPI foi ignorado.
              </Callout>
            </div>
          )}
        </>
      )}
    </Panel>
  )
}
