import type { ReactNode } from 'react'

export function Panel({
  title,
  hint,
  right,
  children,
}: {
  title: string
  hint?: string
  right?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="rounded-2xl border border-[var(--color-edge)] bg-[var(--color-panel)]/80 p-5 shadow-lg shadow-black/30 backdrop-blur">
      <header className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold tracking-wide text-white uppercase">{title}</h2>
          {hint && <p className="mt-1 text-xs text-[var(--color-muted)]">{hint}</p>}
        </div>
        {right}
      </header>
      {children}
    </section>
  )
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-[var(--color-muted)]">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-[var(--color-muted)]">{hint}</span>}
    </label>
  )
}

const inputBase =
  'w-full rounded-lg border bg-[var(--color-panel-2)] px-3 py-2 text-sm text-white outline-none transition focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/30'

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
  return (
    <input
      type="text"
      className={`${inputBase} ${invalid ? 'border-rose-500' : 'border-[var(--color-edge)]'}`}
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
  const border = invalid
    ? 'border-rose-500'
    : highlight
      ? 'border-amber-400'
      : 'border-[var(--color-edge)]'
  return (
    <input
      type="number"
      className={`${inputBase} ${border}`}
      value={value}
      step={step}
      min={min}
      max={max}
      onChange={(e) => onChange(e.target.value)}
    />
  )
}

export function Badge({ children, color }: { children: ReactNode; color?: string }) {
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
      style={{
        color: color ?? '#c9d4ff',
        backgroundColor: `${color ?? '#6ea8fe'}1f`,
        border: `1px solid ${color ?? '#6ea8fe'}55`,
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
    error: 'border-rose-500/40 bg-rose-500/10 text-rose-200',
    warn: 'border-amber-400/40 bg-amber-400/10 text-amber-100',
    info: 'border-sky-400/40 bg-sky-400/10 text-sky-100',
  }
  return <div className={`rounded-lg border px-3 py-2 text-xs ${tones[tone]}`}>{children}</div>
}

export function Button({
  children,
  onClick,
  variant = 'primary',
  disabled,
}: {
  children: ReactNode
  onClick: () => void
  variant?: 'primary' | 'ghost'
  disabled?: boolean
}) {
  const styles =
    variant === 'primary'
      ? 'bg-[var(--color-accent)] text-[#08102a] hover:brightness-110'
      : 'border border-[var(--color-edge)] text-[var(--color-muted)] hover:text-white hover:border-[var(--color-accent)]'
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-lg px-3 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${styles}`}
    >
      {children}
    </button>
  )
}
