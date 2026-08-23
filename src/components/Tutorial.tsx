import { TUTORIAL_STEPS } from '../config/tutorial.content'
import type { UseTutorialResult } from '../hooks/useTutorial'
import { Button, Modal } from './ui'

export function Tutorial({ tutorial: t }: { tutorial: UseTutorialResult }) {
  const step = TUTORIAL_STEPS[t.step]

  return (
    <Modal
      open={t.open}
      onClose={t.dismiss}
      labelledBy="tutorial-title"
      testId="tutorial-modal"
      variant="centered"
    >
      {/* As setas navegam sem precisar acertar o botão — o foco fica preso aqui dentro. */}
      <div
        className="flex h-full flex-col"
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight' && !t.isLast) t.next()
          if (e.key === 'ArrowLeft' && !t.isFirst) t.back()
        }}
      >
        <header className="flex items-center justify-between gap-4 px-5 pt-5 sm:px-7 sm:pt-6">
          <span className="tabular text-xs text-[var(--color-text-tertiary)]">
            Passo {t.step + 1} de {t.total}
          </span>
          <Button variant="ghost" onClick={t.dismiss}>
            Pular
          </Button>
        </header>

        <div
          data-testid="tutorial-body"
          className="flex-1 overflow-y-auto px-5 py-6 sm:px-7 sm:min-h-72"
        >
          <h2
            id="tutorial-title"
            data-testid="tutorial-title"
            className="text-xl font-bold text-balance text-[var(--color-text-primary)] sm:text-2xl"
          >
            {step.title}
          </h2>
          <div className="mt-4 space-y-3 text-sm leading-relaxed text-[var(--color-text-secondary)]">
            {step.body}
          </div>
        </div>

        <footer className="border-t border-[var(--color-border-default)] px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-7">
          <ol data-testid="tutorial-progress" className="mb-4 flex items-center justify-center gap-2">
            {TUTORIAL_STEPS.map((s, i) => {
              const current = i === t.step
              return (
                <li key={s.short}>
                  <button
                    type="button"
                    aria-label={`Passo ${i + 1}: ${s.short}`}
                    aria-current={current ? 'step' : undefined}
                    onClick={() => t.goTo(i)}
                    className="flex h-11 w-6 items-center justify-center"
                  >
                    <span
                      className={`block h-1.5 rounded-full transition-all duration-[var(--motion-base)] ${
                        current
                          ? 'w-6 bg-[var(--accent)]'
                          : 'w-1.5 bg-[var(--color-border-strong)]'
                      }`}
                    />
                  </button>
                </li>
              )
            })}
          </ol>

          <div className="flex items-center justify-between gap-3">
            <Button variant="ghost" onClick={t.back} disabled={t.isFirst}>
              Voltar
            </Button>
            {t.isLast ? (
              <Button onClick={t.dismiss}>Começar</Button>
            ) : (
              <Button onClick={t.next}>Avançar</Button>
            )}
          </div>
        </footer>
      </div>
    </Modal>
  )
}

export function HelpIcon() {
  return (
    <svg viewBox="0 0 20 20" width="19" height="19" fill="none" aria-hidden>
      <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M8 7.8a2 2 0 1 1 2.6 1.9c-.4.15-.6.5-.6.9v.6"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <circle cx="10" cy="13.8" r="0.85" fill="currentColor" />
    </svg>
  )
}
