import { useCallback, useState } from 'react'
import { TUTORIAL_STEPS } from '../config/tutorial.content'
import { readJson, writeJson } from '../data/storage'

const NAMESPACE = 'onboarding'
const KEY = 'seen'

function alreadySeen(): boolean {
  return readJson<boolean>(NAMESPACE, KEY) === true
}

export interface UseTutorialResult {
  open: boolean
  step: number
  total: number
  isFirst: boolean
  isLast: boolean
  next: () => void
  back: () => void
  goTo: (index: number) => void
  /** Fecha e marca como visto — usado por "Pular", "Começar" e `Esc`. */
  dismiss: () => void
  /** Reabre pelo botão de ajuda, sempre do primeiro passo. */
  reopen: () => void
}

/**
 * Estado do tutorial de primeiro uso.
 *
 * Abre sozinho apenas enquanto `pokeivcalc:onboarding:seen` não existir. O
 * valor inicial é lido no inicializador do `useState` — ler no corpo faria a
 * primeira renderização mostrar o modal e sumir depois, com um flash feio.
 */
export function useTutorial(): UseTutorialResult {
  const [open, setOpen] = useState(() => !alreadySeen())
  const [step, setStep] = useState(0)
  const total = TUTORIAL_STEPS.length

  const dismiss = useCallback(() => {
    setOpen(false)
    // Pular também marca como visto: quem dispensou não quer ver de novo.
    writeJson(NAMESPACE, KEY, true)
  }, [])

  const reopen = useCallback(() => {
    setStep(0)
    setOpen(true)
  }, [])

  const next = useCallback(() => {
    setStep((current) => Math.min(current + 1, total - 1))
  }, [total])

  const back = useCallback(() => {
    setStep((current) => Math.max(current - 1, 0))
  }, [])

  const goTo = useCallback(
    (index: number) => {
      setStep(Math.max(0, Math.min(index, total - 1)))
    },
    [total],
  )

  return {
    open,
    step,
    total,
    isFirst: step === 0,
    isLast: step === total - 1,
    next,
    back,
    goTo,
    dismiss,
    reopen,
  }
}
