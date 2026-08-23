import type { StatKey } from '../domain/types'

/** Estado cru do formulário: strings, para não atropelar o usuário no meio da digitação. */
export interface SpecimenForm {
  /** Apelido opcional, usado para identificar o espécime na comparação. */
  nickname: string
  level: string
  quality: string
  ivTotal: string
  stats: Record<StatKey, string>
}

export const EMPTY_FORM: SpecimenForm = {
  nickname: '',
  level: '',
  quality: '',
  ivTotal: '',
  stats: { hp: '', atk: '', def: '', spa: '', spd: '', spe: '' },
}
