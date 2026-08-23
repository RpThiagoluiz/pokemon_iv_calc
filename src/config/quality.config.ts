/**
 * Bandas de tier de quality.
 *
 * ⚠️ PROVISÓRIO — VALORES NÃO CONFIRMADOS.
 *
 * A tabela oficial está em https://poke.idleworld.online/pokepedia/systems/quality,
 * que retorna HTTP 403 para requisições automatizadas (ver .claude/skills/poke-data).
 * Os limiares abaixo são um palpite estruturado a partir do que é público:
 *
 *  - capturas selvagens vão de 1.000 até no máximo 1.800;
 *  - 1.600–1.700 é uma lacuna intencional: menos de 1% passa de 1.700;
 *  - 1.800 é a quality PERFEITA (0,28846% dos nascimentos);
 *  - Mythic / Ancient / Divine ficam em 2.0+ e NÃO saem de captura selvagem —
 *    só shiny e breeding chegam lá.
 *
 * AÇÃO: abra a página no navegador, cole a tabela, e substitua QUALITY_TIERS.
 * Enquanto isso a UI marca o tier como "estimado".
 */
export const QUALITY_TIERS_ARE_CONFIRMED = false

export interface QualityTier {
  name: string
  /** Limite inferior inclusivo. */
  min: number
  color: string
  /** Alcançável em captura selvagem? */
  wild: boolean
}

/** Ordenado do maior para o menor limiar. */
export const QUALITY_TIERS: readonly QualityTier[] = [
  { name: 'Divine', min: 3.0, color: '#f0abfc', wild: false },
  { name: 'Ancient', min: 2.5, color: '#c084fc', wild: false },
  { name: 'Mythic', min: 2.0, color: '#a78bfa', wild: false },
  { name: 'Legendary', min: 1.6, color: '#fbbf24', wild: true },
  { name: 'Epic', min: 1.4, color: '#f472b6', wild: true },
  { name: 'Rare', min: 1.25, color: '#38bdf8', wild: true },
  { name: 'Uncommon', min: 1.1, color: '#34d399', wild: true },
  { name: 'Common', min: 0, color: '#94a3b8', wild: true },
]

/** Quality máxima obtida em captura selvagem. */
export const WILD_QUALITY_CAP = 1.8

export const DEFAULT_QUALITY = 1.0
