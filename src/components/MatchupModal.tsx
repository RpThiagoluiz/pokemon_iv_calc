import { useEffect, useMemo, useState } from 'react'
import { typeInfo } from '../config/types.config'
import { MULTIPLIER_LABELS, type Multiplier } from '../config/typechart.config'
import {
  defensiveBuckets,
  offensiveBuckets,
  type MatchupBucket,
  type SpeciesTypes,
} from '../domain/matchup'
import type { UseTypeIndexResult } from '../hooks/useTypeIndex'
import { Badge, Button, Callout, Modal, Skeleton } from './ui'

type Lado = 'ofensivo' | 'defensivo'

/** Quantos chips um bucket mostra antes de pedir "ver todos". */
const CHIPS_VISIVEIS = 40

/** Cor por multiplicador, das mesmas famílias dos tokens de feedback. */
const COR: Record<Multiplier, string> = {
  4: 'var(--color-ok)',
  2: 'var(--color-ok)',
  1: 'var(--color-text-tertiary)',
  0.5: 'var(--color-warn)',
  0.25: 'var(--color-warn)',
  0: 'var(--color-danger)',
}

function BucketSection({
  bucket,
  aberto,
  onSelect,
}: {
  bucket: MatchupBucket
  aberto: boolean
  onSelect: (slug: string) => void
}) {
  const [expandido, setExpandido] = useState(false)
  const info = MULTIPLIER_LABELS[bucket.multiplier]
  const cor = COR[bucket.multiplier]
  const mostrar = expandido ? bucket.species : bucket.species.slice(0, CHIPS_VISIVEIS)
  const restam = bucket.species.length - mostrar.length

  return (
    <details
      open={aberto}
      data-testid={`bucket-${bucket.multiplier}`}
      className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)]"
    >
      <summary className="flex cursor-pointer items-center gap-3 px-4 py-3">
        <span className="tabular w-10 shrink-0 text-base font-bold" style={{ color: cor }}>
          ×{bucket.multiplier}
        </span>
        <span className="text-sm font-semibold text-[var(--color-text-primary)]">
          {info.label}
        </span>
        <span className="text-xs text-[var(--color-text-tertiary)]">{info.hint}</span>
        <span className="tabular ml-auto text-xs text-[var(--color-text-secondary)]">
          {bucket.species.length}
        </span>
      </summary>

      <div className="px-4 pb-4">
        <ul className="flex flex-wrap gap-1.5">
          {mostrar.map((s) => (
            <li key={s.slug}>
              <button
                type="button"
                onClick={() => onSelect(s.slug)}
                title={`Abrir ${s.slug}`}
                className="flex min-h-11 items-center gap-1.5 rounded-[var(--radius-md)] border border-[var(--color-border-strong)] px-2.5 text-xs text-[var(--color-text-secondary)] transition-colors hover:border-[var(--accent)] hover:text-[var(--color-text-primary)]"
              >
                <span className="capitalize">{s.slug}</span>
                {s.types.map((t) => (
                  <span
                    key={t}
                    aria-hidden
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: typeInfo(t).color }}
                  />
                ))}
                <span className="sr-only">{s.types.map((t) => typeInfo(t).label).join(' e ')}</span>
              </button>
            </li>
          ))}
        </ul>

        {restam > 0 && (
          <button
            type="button"
            onClick={() => setExpandido(true)}
            className="mt-3 text-xs font-semibold text-[var(--accent)] hover:underline"
          >
            Ver os outros {restam}
          </button>
        )}
      </div>
    </details>
  )
}

export function MatchupModal({
  types,
  speciesName,
  typeIndex,
  open,
  onClose,
  onSelectSpecies,
}: {
  types: string[]
  speciesName: string
  typeIndex: UseTypeIndexResult
  open: boolean
  onClose: () => void
  onSelectSpecies: (slug: string) => void
}) {
  const [lado, setLado] = useState<Lado>('ofensivo')

  // Busca preguiçosa: os 374 KB só saem da rede quando o modal abre. O hook
  // segura a trava de "uma tentativa" — este efeito redispara a cada render.
  const carregar = typeIndex.load
  useEffect(() => {
    if (open) carregar()
  }, [open, carregar])

  const buckets = useMemo(() => {
    const index: SpeciesTypes[] = typeIndex.index ?? []
    if (index.length === 0) return []
    return lado === 'ofensivo' ? offensiveBuckets(types, index) : defensiveBuckets(types, index)
  }, [typeIndex.index, types, lado])

  const escolher = (slug: string) => {
    onClose()
    onSelectSpecies(slug)
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      labelledBy="matchup-title"
      testId="matchup-modal"
      variant="centered"
    >
      <div className="flex h-full flex-col">
        <header className="flex items-start justify-between gap-4 border-b border-[var(--color-border-default)] px-4 py-4 sm:px-6 sm:py-5">
          <div className="min-w-0">
            <h2 id="matchup-title" className="text-lg font-bold text-[var(--color-text-primary)]">
              Mapa de caça · <span className="capitalize">{speciesName}</span>
            </h2>
            <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-[var(--color-text-tertiary)]">
              {types.map((t) => (
                <Badge key={t} color={typeInfo(t).color}>
                  {typeInfo(t).label}
                </Badge>
              ))}
            </p>
          </div>
          <Button variant="ghost" onClick={onClose}>
            Fechar
          </Button>
        </header>

        <div className="flex-1 space-y-4 overflow-y-auto px-4 py-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-6">
          <div role="tablist" aria-label="Lado do confronto" className="flex gap-2">
            {(
              [
                ['ofensivo', 'Quem eu mato fácil'],
                ['defensivo', 'Quem me mata'],
              ] as const
            ).map(([valor, rotulo]) => (
              <button
                key={valor}
                type="button"
                role="tab"
                aria-selected={lado === valor}
                onClick={() => setLado(valor)}
                className={`min-h-11 rounded-[var(--radius-md)] border px-4 text-xs font-semibold transition-colors ${
                  lado === valor
                    ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--color-text-primary)]'
                    : 'border-[var(--color-border-strong)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                }`}
              >
                {rotulo}
              </button>
            ))}
          </div>

          <Callout tone="info">
            Tabela de tipos canônica da série. Ela <strong>não</strong> foi confirmada dentro do
            Poke Idle World — se o jogo divergir, os números aqui divergem junto.
          </Callout>

          {typeIndex.loading && (
            <div data-testid="matchup-loading" className="space-y-3">
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
              <p className="text-xs text-[var(--color-text-tertiary)]">
                Montando o mapa a partir dos 18 tipos. Só na primeira vez.
              </p>
            </div>
          )}

          {typeIndex.error && (
            <div className="space-y-3">
              <Callout tone="error">{typeIndex.error}</Callout>
              <Button variant="ghost" onClick={() => typeIndex.load(true)}>
                Tentar de novo
              </Button>
            </div>
          )}

          {!typeIndex.loading && !typeIndex.error && (
            <div data-testid="matchup-buckets" className="space-y-2">
              {buckets.map((b, i) => (
                <BucketSection
                  key={b.multiplier}
                  bucket={b}
                  /* Só o melhor bucket abre: o ×2 costuma ter mais de 200
                     espécies, e tudo aberto de uma vez vira parede de nomes. */
                  aberto={i === 0}
                  onSelect={escolher}
                />
              ))}
            </div>
          )}

          <p className="text-xs leading-relaxed text-[var(--color-text-tertiary)]">
            Clique num Pokémon para carregá-lo aqui no app. Um Pokémon de tipo duplo ataca com o
            tipo que render mais.
          </p>
        </div>
      </div>
    </Modal>
  )
}
