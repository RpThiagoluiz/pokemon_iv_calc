import {
  QUALITY_TIERS,
  QUALITY_TIERS_ARE_CONFIRMED,
  WILD_QUALITY_CAP,
  type QualityTier,
} from '../config/quality.config'

/** Devolve o tier correspondente a uma quality. Nunca retorna null: a última banda é o piso. */
export function qualityTier(quality: number): QualityTier {
  for (const tier of QUALITY_TIERS) {
    if (quality >= tier.min) return tier
  }
  return QUALITY_TIERS[QUALITY_TIERS.length - 1]
}

/** `true` enquanto as bandas forem o palpite provisório de quality.config.ts. */
export function isTierEstimated(): boolean {
  return !QUALITY_TIERS_ARE_CONFIRMED
}

/** Quality acima do teto selvagem só vem de shiny ou breeding. */
export function isAboveWildCap(quality: number): boolean {
  return quality > WILD_QUALITY_CAP
}
