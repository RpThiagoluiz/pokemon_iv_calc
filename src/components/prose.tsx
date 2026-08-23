import type { ReactNode } from 'react'

/** Trecho de fórmula ou valor literal dentro de um texto corrido. */
export function Formula({ children }: { children: ReactNode }) {
  return (
    <code className="tabular rounded-[var(--radius-sm)] bg-[var(--color-surface-inset)] px-1.5 py-0.5 text-[var(--color-text-primary)]">
      {children}
    </code>
  )
}

/** Termo do domínio que merece destaque na primeira aparição. */
export function Term({ children }: { children: ReactNode }) {
  return <strong className="font-semibold text-[var(--color-text-primary)]">{children}</strong>
}
