import { WILD_QUALITY_CAP } from '../config/quality.config'
import { isAboveWildCap, isTierEstimated, qualityTier } from '../domain/quality'
import { Badge, Callout, Panel } from './ui'

export function PowerCard({
  power,
  statSum,
  quality,
}: {
  power: number
  statSum: number
  quality: number
}) {
  const tier = qualityTier(quality)

  return (
    <Panel title="Power e tier de captura" hint="Independente do grade de IV.">
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-[var(--color-edge)] bg-[var(--color-panel-2)]/60 p-4">
          <div className="text-xs text-[var(--color-muted)]">Power</div>
          <div className="mt-1 font-mono text-2xl font-bold text-white">
            {power.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}
          </div>
          <div className="mt-1 text-[11px] text-[var(--color-muted)]">
            {statSum} × {quality}
          </div>
        </div>
        <div
          className="rounded-xl border p-4"
          style={{ borderColor: `${tier.color}55`, backgroundColor: `${tier.color}12` }}
        >
          <div className="text-xs text-[var(--color-muted)]">Tier de quality</div>
          <div className="mt-1 text-2xl font-bold" style={{ color: tier.color }}>
            {tier.name}
          </div>
          <div className="mt-1 flex gap-1">
            <Badge color={tier.color}>quality {quality}</Badge>
            {isTierEstimated() && <Badge color="#fbbf24">estimado</Badge>}
          </div>
        </div>
      </div>

      {isAboveWildCap(quality) && (
        <div className="mt-3">
          <Callout tone="info">
            Quality acima de {WILD_QUALITY_CAP} não sai de captura selvagem — só shiny ou
            breeding chega aqui.
          </Callout>
        </div>
      )}

      {isTierEstimated() && (
        <div className="mt-3">
          <Callout tone="warn">
            As faixas de tier ainda são uma estimativa. A tabela oficial está em
            pokepedia/systems/quality, que bloqueia acesso automatizado — cole o conteúdo e
            atualize <code>src/config/quality.config.ts</code> para fixar os valores reais.
          </Callout>
        </div>
      )}
    </Panel>
  )
}
