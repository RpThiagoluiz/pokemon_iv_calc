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

export function GithubIcon() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden>
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.4 7.4 0 0 1 2-.27c.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8" />
    </svg>
  )
}

/**
 * Link para fora. `rel="noreferrer"` fecha o `window.opener`, e o texto entre
 * parênteses avisa quem usa leitor de tela que a aba é nova.
 */
export function ExternalLink({
  href,
  children,
  testId,
}: {
  href: string
  children: ReactNode
  testId?: string
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      data-testid={testId}
      className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border-strong)] px-3 text-xs font-semibold text-[var(--color-text-secondary)] transition-colors hover:border-[var(--accent)] hover:text-[var(--color-text-primary)]"
    >
      {children}
      <span className="sr-only">(abre em nova aba)</span>
    </a>
  )
}
