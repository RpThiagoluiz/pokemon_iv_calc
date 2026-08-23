import { useState } from 'react'
import { typeInfo } from '../config/types.config'
import { STAT_KEYS, STAT_LABELS } from '../domain/types'
import type { UseSpeciesResult } from '../hooks/useSpecies'
import { Badge, Button, Callout, Field, NumberInput, Panel, Skeleton, TextInput } from './ui'

const SUGESTOES = ['vulpix', 'alakazam', 'gengar', 'dragonite']

export function SpeciesPanel({
  species: s,
  onSearch,
}: {
  species: UseSpeciesResult
  /** Buscar troca de espécie e é o App que limpa o Pokémon anterior. */
  onSearch: (name: string) => void
}) {
  const [query, setQuery] = useState('')

  return (
    <Panel
      testId="species-panel"
      title="Pokémon"
      hint="Busque a espécie. Os base stats vêm da PokeAPI — se divergirem do jogo, edite e a correção fica salva."
      right={
        s.species && (
          <>
            {s.overriddenStats.length > 0 && (
              <Button variant="ghost" onClick={s.resetOverrides}>
                Reverter
              </Button>
            )}
            <Button variant="ghost" onClick={() => void s.load(s.species!.slug, true)}>
              Recarregar
            </Button>
          </>
        )
      }
    >
      <div className="flex items-end gap-2">
        <div className="min-w-0 flex-1">
          <Field label="Buscar Pokémon">
            <TextInput
              value={query}
              onChange={setQuery}
              placeholder="vulpix, alakazam, mr-mime…"
              onEnter={() => onSearch(query)}
              invalid={s.error !== null}
            />
          </Field>
        </div>
        <Button onClick={() => onSearch(query)} disabled={s.loading}>
          {s.loading ? 'Buscando…' : 'Buscar'}
        </Button>
      </div>

      {!s.species && !s.loading && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs text-[var(--color-text-tertiary)]">Exemplos:</span>
          {SUGESTOES.map((nome) => (
            <button
              key={nome}
              type="button"
              onClick={() => {
                setQuery(nome)
                onSearch(nome)
              }}
              className="rounded-full border border-[var(--color-border-strong)] px-3 py-1.5 text-xs text-[var(--color-text-secondary)] transition-colors hover:border-[var(--accent)] hover:text-[var(--color-text-primary)]"
            >
              {nome}
            </button>
          ))}
        </div>
      )}

      {s.error && (
        <div className="mt-3">
          <Callout tone="error">{s.error}</Callout>
        </div>
      )}

      {s.loading && !s.species && (
        <div className="mt-4 flex items-center gap-3">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
      )}

      {s.species && (
        <>
          <div className="mt-4 flex items-center gap-3">
            {s.species.spriteUrl ? (
              <img
                src={s.species.spriteUrl}
                alt=""
                width={64}
                height={64}
                className="h-16 w-16 shrink-0 [image-rendering:pixelated]"
              />
            ) : (
              <div
                aria-hidden
                className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-[var(--color-border-default)] text-xs text-[var(--color-text-tertiary)]"
              >
                sem arte
              </div>
            )}
            <div className="min-w-0">
              <div className="truncate text-lg font-semibold text-[var(--color-text-primary)] capitalize">
                {s.species.name}{' '}
                <span className="tabular text-[var(--color-text-tertiary)]">
                  #{String(s.species.id).padStart(3, '0')}
                </span>
              </div>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {s.species.types.map((t) => {
                  const info = typeInfo(t)
                  return (
                    <Badge key={t} color={info.color}>
                      {info.label}
                    </Badge>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2.5 sm:grid-cols-6">
            {STAT_KEYS.map((key) => (
              <Field key={key} label={`Base ${STAT_LABELS[key]}`}>
                <NumberInput
                  value={String(s.baseStats[key])}
                  highlight={s.overriddenStats.includes(key)}
                  min={1}
                  onChange={(v) => s.setBaseStat(key, Number(v) || 0)}
                />
              </Field>
            ))}
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
