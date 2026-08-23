import { DEFAULT_FORMULA_MODE } from '../config/formula.config'
import type { FormulaMode, StatKey } from '../domain/types'

/** Estado cru do formulário: strings, para não atropelar o usuário no meio da digitação. */
export interface SpecimenForm {
  level: string
  quality: string
  ivTotal: string
  stats: Record<StatKey, string>
  mode: FormulaMode
}

export const EMPTY_FORM: SpecimenForm = {
  level: '',
  quality: '',
  ivTotal: '',
  stats: { hp: '', atk: '', def: '', spa: '', spd: '', spe: '' },
  mode: DEFAULT_FORMULA_MODE,
}
