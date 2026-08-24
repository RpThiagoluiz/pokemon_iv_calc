import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { CHART } from '../../config/chart.config'

export interface Serie {
  key: string
  label: string
  color: string
  /** Valor central por ponto — mesmo comprimento de `levels`. */
  values: number[]
  /** Faixa de incerteza. Ausente quando o valor é cravado. */
  band?: { min: number[]; max: number[] }
}

export interface LineChartProps {
  /** Eixo x: os levels, em ordem crescente. */
  levels: number[]
  series: Serie[]
  /** Rótulo acessível do gráfico inteiro. */
  title: string
  /** Rótulo do eixo y — abreviado, porque o espaço é curto. */
  formatAxis: (v: number) => string
  /** Valor no tooltip — exato, porque é ali que se lê o número de verdade. */
  formatValue: (v: number) => string
  /**
   * `always` desenha a faixa de todas as séries — só use com UMA série.
   * `hover` mostra apenas a da série sob o cursor, que é o que salva a
   * legibilidade quando são seis linhas.
   */
  bandMode?: 'always' | 'hover'
  testId?: string
}

/**
 * Topo do eixo y: arredonda o PASSO de cada linha de grade, não o máximo.
 *
 * Arredondar o máximo direto joga 6.980 para 10.000 e desperdiça metade da
 * altura. Escolhendo o passo (1, 2, 2,5 ou 5 vezes uma potência de 10) o topo
 * fica em 8.000 e a curva ocupa o espaço que tem.
 */
function niceTop(max: number, linhas: number): number {
  if (max <= 0) return 1
  const bruto = max / linhas
  const exp = Math.pow(10, Math.floor(Math.log10(bruto)))
  const n = bruto / exp
  const passo =
    (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 3 ? 3 : n <= 4 ? 4 : n <= 5 ? 5 : 10) * exp
  return passo * linhas
}

/**
 * Largura real do container, em pixels.
 *
 * O `viewBox` precisa casar com a largura renderizada: com um `viewBox` fixo o
 * SVG inteiro escala, e o texto de 11px vira ~6px num celular de 360 e ~16px
 * num desktop largo. Medindo, 1 unidade do `viewBox` é 1 pixel e o rótulo tem
 * o tamanho que foi pedido em qualquer tela.
 */
function useMeasuredWidth(fallback: number) {
  const ref = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(fallback)

  const medir = useCallback(() => {
    const w = ref.current?.clientWidth
    if (w && w > 0) setWidth(w)
  }, [])

  useEffect(() => {
    medir()
    const el = ref.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(medir)
    ro.observe(el)
    return () => ro.disconnect()
  }, [medir])

  return { ref, width }
}

export function LineChart({
  levels,
  series,
  title,
  formatAxis,
  formatValue,
  bandMode = 'hover',
  testId,
}: LineChartProps) {
  const id = useId()
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)
  const [hoverSerie, setHoverSerie] = useState<string | null>(null)

  const { plotHeight, axisHeight, gutter, paddingRight, paddingTop, gridLines } = CHART
  const { ref, width } = useMeasuredWidth(640)
  const innerWidth = Math.max(80, width - gutter - paddingRight)
  const height = plotHeight + axisHeight + paddingTop

  const yMax = useMemo(() => {
    const todos = series.flatMap((s) => [...s.values, ...(s.band?.max ?? [])])
    return niceTop(Math.max(1, ...todos), gridLines)
  }, [series, gridLines])

  const x = (i: number) =>
    gutter + (levels.length <= 1 ? innerWidth / 2 : (i / (levels.length - 1)) * innerWidth)
  const y = (v: number) => paddingTop + plotHeight - (v / yMax) * plotHeight

  const linha = (vals: number[]) => vals.map((v, i) => `${x(i)},${y(v)}`).join(' ')
  const area = (band: { min: number[]; max: number[] }) =>
    [
      ...band.max.map((v, i) => `${x(i)},${y(v)}`),
      ...band.min.map((v, i) => `${x(i)},${y(v)}`).reverse(),
    ].join(' ')

  // No máximo 6 rótulos no eixo x: mais que isso colide.
  const passoRotulo = Math.max(1, Math.ceil(levels.length / 6))

  /*
   * O índice do hover é preso ao tamanho atual da série: encolher o level alvo
   * deixa um índice velho apontando para fora do array, e aí `values[i]` é
   * `undefined` — o SVG recebe `cy="NaN"` e o React reclama no console.
   */
  const ativo = hoverIndex !== null && hoverIndex < levels.length ? hoverIndex : null

  return (
    <div ref={ref} className="relative" data-testid={testId}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width={width}
        height={height}
        role="img"
        aria-labelledby={`${id}-t`}
        onMouseLeave={() => setHoverIndex(null)}
      >
        <title id={`${id}-t`}>{title}</title>

        {/* grade recessiva — nunca compete com os dados */}
        {Array.from({ length: gridLines + 1 }, (_, i) => {
          const v = (yMax / gridLines) * i
          return (
            <g key={i}>
              <line
                x1={gutter}
                x2={width - paddingRight}
                y1={y(v)}
                y2={y(v)}
                stroke="var(--color-border-subtle)"
                strokeWidth="1"
              />
              <text
                x={gutter - 8}
                y={y(v) + 4}
                textAnchor="end"
                className="fill-[var(--color-text-tertiary)] text-[11px]"
              >
                {formatAxis(v)}
              </text>
            </g>
          )
        })}

        {/* faixas de incerteza, atrás das linhas */}
        {series.map((s) => {
          if (!s.band) return null
          const mostrar = bandMode === 'always' || hoverSerie === s.key
          if (!mostrar) return null
          return (
            <polygon key={`b-${s.key}`} points={area(s.band)} fill={s.color} opacity={0.16} />
          )
        })}

        {series.map((s) => (
          <polyline
            key={s.key}
            points={linha(s.values)}
            fill="none"
            stroke={s.color}
            strokeWidth={CHART.strokeWidth}
            strokeLinejoin="round"
            strokeLinecap="round"
            opacity={hoverSerie && hoverSerie !== s.key ? 0.25 : 1}
          />
        ))}

        {/* crosshair + marcadores do ponto sob o cursor */}
        {ativo !== null && (
          <g pointerEvents="none">
            <line
              x1={x(ativo)}
              x2={x(ativo)}
              y1={paddingTop}
              y2={paddingTop + plotHeight}
              stroke="var(--color-border-strong)"
              strokeWidth="1"
            />
            {series.map((s) => (
              <circle
                key={`m-${s.key}`}
                cx={x(ativo)}
                cy={y(s.values[ativo])}
                r="4.5"
                fill={s.color}
                stroke="var(--color-surface-raised)"
                strokeWidth="2"
              />
            ))}
          </g>
        )}

        {/* eixo x */}
        {levels.map((lvl, i) => {
          const ultimo = levels.length - 1
          // O alvo é sempre rotulado; um rótulo periódico colado nele sai de
          // cena, senão os dois se sobrepõem na borda direita.
          const periodico = i % passoRotulo === 0 && ultimo - i >= passoRotulo / 2
          return periodico || i === ultimo ? (
            <text
              key={lvl}
              x={x(i)}
              y={paddingTop + plotHeight + 18}
              textAnchor={i === 0 ? 'start' : i === ultimo ? 'end' : 'middle'}
              className="fill-[var(--color-text-tertiary)] text-[11px]"
            >
              {lvl}
            </text>
          ) : null
        })}

        {/* alvos de hover: fatias largas, bem maiores que a marca */}
        {levels.map((lvl, i) => (
          <rect
            key={`h-${lvl}`}
            x={x(i) - innerWidth / Math.max(1, levels.length - 1) / 2}
            y={paddingTop}
            width={innerWidth / Math.max(1, levels.length - 1)}
            height={plotHeight}
            fill="transparent"
            onMouseEnter={() => setHoverIndex(i)}
          />
        ))}
      </svg>

      {ativo !== null && (
        <div
          data-testid={testId ? `${testId}-tooltip` : undefined}
          className="pointer-events-none absolute top-0 right-0 rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface-overlay)] px-3 py-2 text-xs shadow-xl"
        >
          <div className="tabular mb-1 font-semibold text-[var(--color-text-primary)]">
            Level {levels[ativo]}
          </div>
          {series.map((s) => (
            <div key={s.key} className="flex items-center gap-2">
              <span
                aria-hidden
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: s.color }}
              />
              <span className="text-[var(--color-text-secondary)]">{s.label}</span>
              <span className="tabular ml-auto text-[var(--color-text-primary)]">
                {formatValue(s.values[ativo])}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Legenda: obrigatória com 2+ séries. Passar o mouse isola a série. */}
      {series.length > 1 && (
        <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5">
          {series.map((s) => (
            <li key={s.key}>
              <button
                type="button"
                onMouseEnter={() => setHoverSerie(s.key)}
                onMouseLeave={() => setHoverSerie(null)}
                onFocus={() => setHoverSerie(s.key)}
                onBlur={() => setHoverSerie(null)}
                className="flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
              >
                <span
                  aria-hidden
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: s.color }}
                />
                {s.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
