import { describe, expect, it } from 'vitest'
import { normalizeName } from '../src/data/pokeapi'

describe('normalizeName', () => {
  it('normaliza para o slug da PokeAPI', () => {
    expect(normalizeName('Vulpix')).toBe('vulpix')
    expect(normalizeName('  Mr. Mime ')).toBe('mr-mime')
    expect(normalizeName('Farfetch’d'.replace('’', "'"))).toBe('farfetchd')
    expect(normalizeName('Type: Null')).toBe('type-null')
    expect(normalizeName('Ho_Oh')).toBe('ho-oh')
  })

  it('trata acentos e símbolos de gênero', () => {
    expect(normalizeName('Flabébé')).toBe('flabebe')
    expect(normalizeName('Nidoran♀')).toBe('nidoran-f')
    expect(normalizeName('Nidoran♂')).toBe('nidoran-m')
  })

  it('entrada vazia vira string vazia', () => {
    expect(normalizeName('   ')).toBe('')
    expect(normalizeName('---')).toBe('')
  })
})
