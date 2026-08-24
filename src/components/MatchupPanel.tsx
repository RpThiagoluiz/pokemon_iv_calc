import { typeInfo } from '../config/types.config'
import { Badge, Button, Panel } from './ui'

export function MatchupPanel({
  types,
  onOpen,
}: {
  types: string[]
  onOpen: () => void
}) {
  return (
    <Panel
      testId="matchup-panel"
      title="Mapa de caça"
      hint="Contra quem este Pokémon bate forte e quem bate forte nele — considerando tipo duplo e imunidade."
      right={<Button onClick={onOpen}>Ver mapa</Button>}
    >
      <p className="flex flex-wrap items-center gap-1.5 text-xs text-[var(--color-text-secondary)]">
        <span>Atacando como</span>
        {types.map((t) => {
          const info = typeInfo(t)
          return (
            <Badge key={t} color={info.color}>
              {info.label}
            </Badge>
          )
        })}
        <span>— o mapa lista as espécies por vantagem.</span>
      </p>
    </Panel>
  )
}
