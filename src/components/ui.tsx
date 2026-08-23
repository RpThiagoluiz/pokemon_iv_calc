import { createContext, useContext, useEffect, useId, useRef, type ReactNode } from 'react'

/* ------------------------------------------------------------------ layout */

export function Panel({
  title,
  hint,
  right,
  children,
  testId,
}: {
  title: string
  hint?: string
  right?: ReactNode
  children: ReactNode
  /** Âncora estável para os testes e2e — evita depender do texto do painel. */
  testId?: string
}) {
  return (
    <section
      data-testid={testId}
      className="rounded-[var(--radius-xl)] border border-[var(--color-border-default)] bg-[var(--color-surface-raised)]/85 p-4 shadow-xl shadow-black/25 backdrop-blur-sm sm:p-5"
    >
      {/* Sem `flex-wrap`: com ele, uma dica longa empurrava a ação para uma
          linha própria e ela ficava órfã no meio do painel. */}
      <header className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold tracking-wide text-[var(--color-text-primary)]">
            {title}
          </h2>
          {hint && (
            <p className="mt-1 text-xs leading-relaxed text-[var(--color-text-tertiary)]">{hint}</p>
          )}
        </div>
        {right && <div className="flex shrink-0 gap-2">{right}</div>}
      </header>
      {children}
    </section>
  )
}

/**
 * O `Field` gera o par id/aria-describedby e os inputs consomem daqui.
 *
 * Antes o `<label>` embrulhava rótulo, controle E dica — o que fazia a dica
 * virar parte do **nome** acessível ("Quality ex.: 1.42"). Dica descreve, não
 * nomeia: mesma lição do tooltip.
 */
const FieldContext = createContext<{ id: string; describedBy?: string } | null>(null)

export function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: ReactNode
}) {
  const id = useId()
  const hintId = hint ? `${id}-hint` : undefined

  return (
    <div className="block">
      <label
        htmlFor={id}
        className="mb-1.5 block text-xs font-medium text-[var(--color-text-secondary)]"
      >
        {label}
      </label>
      <FieldContext.Provider value={{ id, describedBy: hintId }}>{children}</FieldContext.Provider>
      {hint && (
        <span id={hintId} className="mt-1 block text-xs text-[var(--color-text-tertiary)]">
          {hint}
        </span>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ inputs */

/** `min-h-11` = 44px: alvo de toque mínimo no celular. */
const inputBase =
  'w-full min-h-11 rounded-[var(--radius-md)] border bg-[var(--color-surface-inset)] px-3 text-sm text-[var(--color-text-primary)] outline-none transition-colors placeholder:text-[var(--color-text-tertiary)] focus:border-[var(--color-focus)]'

function borderFor(invalid?: boolean, highlight?: boolean): string {
  if (invalid) return 'border-[var(--color-danger)]'
  if (highlight) return 'border-[var(--color-warn)]'
  return 'border-[var(--color-border-strong)]'
}

export function TextInput({
  value,
  onChange,
  placeholder,
  onEnter,
  invalid,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  onEnter?: () => void
  invalid?: boolean
}) {
  const field = useContext(FieldContext)
  return (
    <input
      type="text"
      id={field?.id}
      aria-describedby={field?.describedBy}
      aria-invalid={invalid || undefined}
      className={`${inputBase} ${borderFor(invalid)}`}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && onEnter) onEnter()
      }}
    />
  )
}

/**
 * Campo numérico que guarda o texto cru enquanto o usuário digita.
 * Sem isso, apagar o conteúdo para redigitar vira `0` no meio da edição.
 *
 * `inputMode="decimal"` abre o teclado numérico no celular.
 */
export function NumberInput({
  value,
  onChange,
  step = 1,
  min,
  max,
  invalid,
  highlight,
}: {
  value: string
  onChange: (v: string) => void
  step?: number
  min?: number
  max?: number
  invalid?: boolean
  highlight?: boolean
}) {
  const field = useContext(FieldContext)
  return (
    <input
      type="number"
      inputMode="decimal"
      id={field?.id}
      aria-describedby={field?.describedBy}
      aria-invalid={invalid || undefined}
      className={`${inputBase} tabular ${borderFor(invalid, highlight)}`}
      value={value}
      step={step}
      min={min}
      max={max}
      onChange={(e) => onChange(e.target.value)}
    />
  )
}

/* ----------------------------------------------------------------- actions */

const buttonBase =
  'inline-flex min-h-11 items-center justify-center gap-1.5 rounded-[var(--radius-md)] px-4 text-sm font-semibold whitespace-nowrap transition-colors disabled:cursor-not-allowed disabled:opacity-40'

const buttonVariants = {
  primary: 'bg-[var(--accent)] text-[var(--color-surface-base)] hover:brightness-110',
  ghost:
    'border border-[var(--color-border-strong)] text-[var(--color-text-secondary)] hover:border-[var(--accent)] hover:text-[var(--color-text-primary)]',
  danger:
    'border border-[var(--color-danger)]/50 text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10',
} as const

export function Button({
  children,
  onClick,
  variant = 'primary',
  disabled,
  type = 'button',
}: {
  children: ReactNode
  onClick?: () => void
  variant?: keyof typeof buttonVariants
  disabled?: boolean
  type?: 'button' | 'submit'
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${buttonBase} ${buttonVariants[variant]}`}
    >
      {children}
    </button>
  )
}

/**
 * Ação sem texto. `label` é obrigatório: vira o nome acessível e o tooltip
 * nativo — um ícone sozinho não diz nada a quem usa leitor de tela.
 */
export function IconButton({
  label,
  onClick,
  children,
  active,
}: {
  label: string
  onClick: () => void
  children: ReactNode
  active?: boolean
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-md)] border transition-colors ${
        active
          ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--color-text-primary)]'
          : 'border-[var(--color-border-strong)] text-[var(--color-text-secondary)] hover:border-[var(--accent)] hover:text-[var(--color-text-primary)]'
      }`}
    >
      {children}
    </button>
  )
}

/* ------------------------------------------------------------------ status */

export function Badge({ children, color }: { children: ReactNode; color?: string }) {
  const c = color ?? 'var(--accent)'
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold"
      style={{
        color: c,
        backgroundColor: `color-mix(in srgb, ${c} 14%, transparent)`,
        border: `1px solid color-mix(in srgb, ${c} 45%, transparent)`,
      }}
    >
      {children}
    </span>
  )
}

export function Callout({
  tone,
  children,
}: {
  tone: 'error' | 'warn' | 'info'
  children: ReactNode
}) {
  const tones = {
    error: 'border-[var(--color-danger)]/40 bg-[var(--color-danger)]/10 text-[var(--color-danger)]',
    warn: 'border-[var(--color-warn)]/40 bg-[var(--color-warn)]/10 text-[var(--color-warn)]',
    info: 'border-[var(--color-focus)]/40 bg-[var(--color-focus)]/10 text-[var(--color-focus)]',
  }
  return (
    <div className={`rounded-[var(--radius-md)] border px-3 py-2.5 text-xs leading-relaxed ${tones[tone]}`}>
      {children}
    </div>
  )
}

/** Carregamento com a forma do conteúdo que vem — evita o salto de layout. */
export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`animate-pulse rounded-[var(--radius-md)] bg-[var(--color-border-default)] ${className}`}
    />
  )
}

/**
 * Tooltip em hover e foco.
 *
 * Usa `aria-describedby` e não `aria-label`: um tooltip *descreve* o elemento,
 * não o renomeia. Com `aria-label` o texto virava o nome acessível do gatilho —
 * o que, além de errado, fazia buscas por label baterem no tooltip.
 */
export function Tooltip({
  content,
  children,
  testId,
  align = 'center',
}: {
  content: string
  children: ReactNode
  testId?: string
  /** `end` alinha o balão à direita do gatilho — use perto da borda da tela. */
  align?: 'center' | 'end'
}) {
  const id = useId()
  return (
    <span className="group relative inline-flex">
      <span tabIndex={0} aria-describedby={id} data-testid={testId} className="cursor-help">
        {children}
      </span>
      <span
        id={id}
        role="tooltip"
        data-testid={testId ? `${testId}-content` : undefined}
        /*
         * `hidden` e não `invisible`: `visibility:hidden` continua ocupando
         * espaço, e um balão de 288px num gatilho perto da borda esticava a
         * página em 80px de rolagem horizontal — mesmo fechado.
         *
         * `max-w` prende o balão dentro da viewport no celular.
         */
        className={`pointer-events-none absolute bottom-full z-30 mb-2 hidden w-60 max-w-[calc(100vw-1.5rem)] rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface-overlay)] px-3 py-2 text-xs leading-relaxed font-normal text-[var(--color-text-primary)] shadow-2xl shadow-black/60 group-focus-within:block group-hover:block sm:w-72 ${
          align === 'end' ? 'right-0' : 'left-1/2 -translate-x-1/2'
        }`}
      >
        {content}
      </span>
    </span>
  )
}

/* ------------------------------------------------------------------- modal */

/**
 * Base de modal sobre o `<dialog>` nativo.
 *
 * `showModal()` entrega foco preso, fechar no `Esc` e backdrop inerte de
 * graça. Uma `div role="dialog"` só ganha isso com bastante código, e
 * costuma ganhar errado.
 */
export function Modal({
  open,
  onClose,
  labelledBy,
  testId,
  variant = 'full',
  children,
}: {
  open: boolean
  onClose: () => void
  /** id do título do modal — vira o nome acessível do diálogo. */
  labelledBy: string
  testId?: string
  /**
   * `full` para conteúdo que precisa da tela toda (tabela de comparação).
   * `centered` vira cartão a partir de `sm` — conteúdo curto numa tela cheia
   * de 1440px deixa um vazio enorme no meio.
   */
  variant?: 'full' | 'centered'
  children: ReactNode
}) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  const shape =
    variant === 'full'
      ? 'm-0 h-dvh max-h-none w-screen max-w-none'
      : 'm-0 h-dvh max-h-none w-screen max-w-none sm:m-auto sm:h-auto sm:max-h-[min(90dvh,44rem)] sm:w-[min(42rem,calc(100vw-3rem))] sm:rounded-[var(--radius-xl)] sm:border sm:border-[var(--color-border-default)] sm:shadow-2xl sm:shadow-black/60'

  return (
    <dialog
      ref={ref}
      aria-labelledby={labelledBy}
      data-testid={testId}
      onClose={onClose}
      className={`bg-[var(--color-surface-base)] p-0 text-[var(--color-text-primary)] ${shape}`}
    >
      {children}
    </dialog>
  )
}
