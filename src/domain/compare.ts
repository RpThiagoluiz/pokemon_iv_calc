import type { Grade } from '../config/grade.config'
import { GRADE_ORDER } from '../config/grade.config'
import { gradeRank, type GradeResult } from './grade'
import { STAT_KEYS, type GrowthRange, type StatKey, type Stats } from './types'

/** Comparar um espécime consigo mesmo não diz nada; acima de cinco a tabela fica ilegível. */
export const COMPARE_MIN = 2
export const COMPARE_MAX = 5

export interface CompareEntry {
  id: string
  /** Apelido dado pelo usuário, ou um rótulo gerado quando ele não deu nome. */
  nickname: string
  level: number
  quality: number
  /** Os seis stats como o jogo exibe. */
  stats: Stats
  growths: Stats<GrowthRange>
  ivTotal: { min: number; max: number }
  grade: GradeResult
  power: number
  /** `false` quando a inversão ficou ambígua — o modal precisa avisar. */
  isExact: boolean
}

export function defaultNickname(index: number): string {
  return `Pokémon ${index + 1}`
}

/**
 * Ordena do melhor para o pior: primeiro pelo grade, depois pelo score dentro
 * do mesmo grade. Empate real mantém a ordem de inserção (sort estável).
 */
export function rankEntries(entries: CompareEntry[]): CompareEntry[] {
  return [...entries].sort((a, b) => {
    const byGrade = gradeRank(b.grade.maxGrade) - gradeRank(a.grade.maxGrade)
    if (byGrade !== 0) return byGrade
    return b.grade.maxScore - a.grade.maxScore
  })
}

export interface GradeGroup {
  grade: Grade
  entries: CompareEntry[]
}

/**
 * Agrupa por grade, do melhor para o pior, pulando os grades sem ninguém.
 * É o "exibir por tier" da comparação.
 */
export function groupByGrade(entries: CompareEntry[]): GradeGroup[] {
  const ranked = rankEntries(entries)
  const groups: GradeGroup[] = []
  for (const grade of [...GRADE_ORDER].reverse()) {
    const inGrade = ranked.filter((entry) => entry.grade.maxGrade === grade)
    if (inGrade.length > 0) groups.push({ grade, entries: inGrade })
  }
  return groups
}

/**
 * Quem vence cada stat, por id. Devolve lista porque empate é comum — em
 * empate ninguém deve ser destacado como único vencedor.
 *
 * Compara pelo piso da faixa (`min`): é o que está garantido. Um espécime
 * ambíguo não ganha destaque com base num teto que talvez não exista.
 */
export function bestPerStat(entries: CompareEntry[]): Record<StatKey, string[]> {
  const out = {} as Record<StatKey, string[]>
  for (const key of STAT_KEYS) {
    if (entries.length === 0) {
      out[key] = []
      continue
    }
    const best = Math.max(...entries.map((entry) => entry.growths[key].min))
    out[key] = entries.filter((entry) => entry.growths[key].min === best).map((entry) => entry.id)
  }
  return out
}

/** `true` quando alguma entrada ficou ambígua — a comparação vira aproximada. */
export function hasAmbiguity(entries: CompareEntry[]): boolean {
  return entries.some((entry) => !entry.isExact)
}
