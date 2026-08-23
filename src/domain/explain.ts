import type { GradeResult } from './grade'
import {
  GROWTH_MAX,
  GROWTH_MIN,
  IV_TOTAL_MAX,
  STAT_LABELS,
  type SolveResult,
  type SpecimenInput,
  type StatKey,
} from './types'

const nf = new Intl.NumberFormat('pt-BR')

/** "SpA e Vel" — lista em português, com "e" antes do último. */
export function listStats(stats: StatKey[]): string {
  const labels = stats.map((key) => STAT_LABELS[key])
  if (labels.length <= 1) return labels.join('')
  return `${labels.slice(0, -1).join(', ')} e ${labels[labels.length - 1]}`
}

/** Por que a tag de IVs perfeitos acendeu para este espécime. */
export function explainPerfectRolls(grade: GradeResult): string {
  const { stats } = grade.perfectRolls
  return (
    `Tier ${grade.label}, mas com ${stats.length} IVs perfeitos no lugar certo: ` +
    `${listStats(stats)} em ${GROWTH_MAX}/${GROWTH_MAX}. ` +
    'O grade é uma média de todos os stats, então ele dilui esse acerto — ' +
    'na prática este Pokémon vale mais que outro do mesmo tier com os IVs espalhados.'
  )
}

/**
 * Explica, para ESTE espécime, por que a inversão saiu exata ou ambígua.
 *
 * Uma tag "exato" sem explicação vira fé: o usuário não tem como saber se
 * confia no número. O texto cita os valores que ele digitou, então dá para
 * conferir o raciocínio e agir (subir de level, informar o IV total).
 */
export function explainSolution(result: SolveResult, input: SpecimenInput): string {
  const { level, quality, ivTotal } = input

  if (result.status === 'noSolution') {
    return (
      result.reason ??
      'Os valores informados não fecham com nenhuma combinação de growths válida.'
    )
  }

  const cenario = `com level ${level} e quality ${quality}`

  if (result.status === 'exact') {
    const base =
      `Solução única: ${cenario}, só uma combinação de growths de ${GROWTH_MIN} a ` +
      `${GROWTH_MAX} reproduz exatamente esses seis stats.`
    return ivTotal === null
      ? `${base} O level é alto o bastante para não restar ambiguidade, mesmo sem o IV total.`
      : `${base} O IV total ${ivTotal}/${IV_TOTAL_MAX} fecha a conta.`
  }

  const quantas = `${nf.format(result.solutionCount)} combinações de growths reproduzem esses mesmos stats`
  const causa =
    `${cenario} o fator de escala é pequeno, então growths vizinhos arredondam para o ` +
    'mesmo valor exibido — a ambiguidade é matemática, não é erro de digitação.'
  const saida =
    ivTotal === null
      ? 'Informe o IV total do jogo ou suba de level e recalcule para fechar.'
      : 'Suba de level e recalcule para fechar; o IV total sozinho não bastou aqui.'

  return `${quantas}: ${causa} ${saida}`
}
