---
name: poke-ui
description: Sistema de design do Poke IV Calc — tokens, componentes, responsivo, acessibilidade e microtexto. Use ao criar ou alterar QUALQUER coisa em src/components/, src/index.css, index.html ou ao mexer em layout, cor, tipografia e espaçamento.
---

# Design system do Poke IV Calc

App público (Netlify), pt-BR, tema escuro único, mobile-first. Nada aqui é opinião solta: os números de contraste abaixo foram medidos, e o checklist final é o critério de "pronto".

## A regra que governa tudo

**Nenhuma cor crua em componente.** Se um `#hex` aparecer em `src/components/`, está no lugar errado — vai para `src/index.css` (token) ou `src/config/*.config.ts` (mapa de dados, como grade e tipo). Componente consome `var(--...)` ou lê do config.

Exceção única: cor **vinda de dados** (grade, tipo do Pokémon) chega como valor via props/config e entra num `style={{}}` — porque é dinâmica. Nunca literal.

## Tokens

Definidos em `src/index.css`, nomeados por **função**, não por aparência (`--surface-raised`, não `--azul-escuro-2`).

### Superfícies

| token | hex | uso |
|---|---|---|
| `--surface-base` | `#0A0E1A` | fundo da página |
| `--surface-raised` | `#121829` | painéis |
| `--surface-overlay` | `#182034` | modal, tooltip, popover |
| `--surface-inset` | `#0D1322` | campos, poços, barras |

Elas se distinguem por 1.04–1.19:1 — **profundidade não é acessibilidade**. Quem separa painel de fundo é a borda, não só a cor. Nunca use diferença de superfície como único indicador de estado.

### Texto — todos AA sobre as quatro superfícies

| token | hex | pior caso |
|---|---|---|
| `--text-primary` | `#F0F3FA` | 14.60:1 |
| `--text-secondary` | `#A8B3CF` | 7.73:1 |
| `--text-tertiary` | `#7C89AB` | 4.65:1 |

`--text-tertiary` é o **piso**: 4.65:1 no overlay não deixa margem. Não invente um tom mais apagado.

### Bordas

| token | hex | nota |
|---|---|---|
| `--border-subtle` | `#1E2740` | separadores internos, decorativo |
| `--border-default` | `#2A3550` | contorno de painel, decorativo |
| `--border-strong` | `#55658C` | **3.05:1** — obrigatório onde a borda é o limite do controle (inputs) |

Borda decorativa pode ser fraca. Borda que **delimita um controle** precisa de 3:1 (WCAG 1.4.11) — daí o `--border-strong`.

### Feedback e foco

`--ok #6EE7B7` (11.59:1) · `--warn #FCD34D` (12.26:1) · `--danger #FCA5A5` (9.31:1) · `--focus-ring #8AB4FF` (8.46:1)

O acento de botão primário usa `--focus-ring` como fundo com `--surface-base` por cima: **9.22:1**.

### Escala de texto

`--text-xs: 0.75rem` (12px) é o **mínimo**. Os `text-[11px]` do código antigo eram pequenos demais — não voltem. Acima: `sm .875rem`, `base 1rem`, `lg 1.125rem`, `xl 1.5rem`, `2xl 2rem`.

### Raio, motion, tipografia

`--radius-sm|md|lg|xl` · `--motion-fast 120ms` / `--motion-base 200ms` · `--font-sans` (Inter) / `--font-mono` (JetBrains Mono).

**Todo número lido em coluna usa `--font-mono` com `tabular-nums`** — stats, IVs, Power, score. Número que dança entre linhas é ruído.

`prefers-reduced-motion: reduce` zera as durações em `index.css`. Não escreva duração literal em componente.

## Acento por tipo

`src/config/types.config.ts` mapeia os 18 tipos → cor + rótulo pt-BR. Ao carregar a espécie, `App.tsx` seta `--accent` no container; sem espécie, um neutro.

Todas as 18 cores foram escolhidas para passar AA sobre `raised` e `inset` — **pior caso 6.51:1** (fighting). Se adicionar ou trocar uma, meça antes.

**A cor do tipo nunca carrega significado sozinha.** O badge sempre mostra o nome do tipo escrito. Quem não distingue laranja de vermelho continua lendo "Fogo".

## Grades D→SS

Rampa perceptual em `src/config/grade.config.ts`, todas AA (pior caso **6.32:1**, o `D`):

`D #94A3B8` → `C #7DD3FC` → `B #5EEAD4` → `A #86EFAC` → `A+ #BEF264` → `S #FCD34D` → `SS #F0ABFC`

A letra do grade é **sempre** exibida junto da cor.

## Componentes — `src/components/ui.tsx`

| componente | quando |
|---|---|
| `Panel` | qualquer bloco de conteúdo. Tem `title`, `hint`, `right`, `testId`. |
| `Field` | rótulo + controle. **Todo input passa por aqui** — é o que garante o `<label>` associado. |
| `TextInput` / `NumberInput` | `NumberInput` guarda o texto cru enquanto digita; sem isso apagar o campo vira `0` no meio da edição. |
| `Button` | ações. Variantes `primary` / `ghost` / `danger`. Sempre `whitespace-nowrap`. |
| `IconButton` | ação sem texto. **Exige `label`** (vira `aria-label` + tooltip). Alvo mínimo 44×44. |
| `Badge` | rótulo curto de estado. |
| `Tooltip` | explicação de uma tag. Abre em hover **e** foco. |
| `Callout` | mensagem em bloco: `error` / `warn` / `info`. |
| `Modal` | base de `<dialog>`: foco preso, `Esc`, backdrop. |
| `Skeleton` | carregamento com forma conhecida. |

**Não crie um botão/campo/painel por fora.** Se falta uma variante, adicione ao componente — não improvise um `<button className="...">` na tela.

`Modal` usa `<dialog>` nativo com `showModal()` de propósito: foco preso, `Esc` e backdrop inerte de graça. Uma `div role="dialog"` só ganha isso com bastante código, e normalmente ganha errado.

## Gráficos

Regras da skill `dataviz` que já custaram correção aqui:

- **Nunca dois eixos y.** Power (milhares) e stats (centenas) são **dois gráficos**. Um eixo só com duas escalas inventa correlação que não existe — é o anti-padrão nº 1.
- **A paleta das séries é medida, não escolhida.** `SERIES_COLORS` em `src/config/chart.config.ts` passou nas seis checagens do `validate_palette.js` contra `#121829`. Ordem fixa, um stat sempre na mesma cor. Trocou? Rode o validador de novo.
- **Legenda sempre com 2+ séries.** Cor nunca é o único sinal.
- **O SVG mede o container.** `viewBox` fixo faz o texto escalar junto: 11 px viram ~6 px em 360 e ~16 px num desktop largo. `useMeasuredWidth` mantém 1 unidade = 1 pixel.
- **Eixo y arredonda o passo, não o máximo.** `niceTop(max, linhas)`: arredondar o máximo joga 6.980 para 10.000 e desperdiça metade da altura.
- **Rótulo do eixo abrevia; tooltip não.** `formatAxis` vs `formatValue` — no eixo cabe "7 mil", no tooltip o usuário quer 6.980.
- **Não deixe dois pontos colados no fim.** Um marco a 2 levels do alvo desenha um trecho achatado que se lê como "parou de crescer".
- **Tabela junto do gráfico.** É a visão acessível que a `dataviz` exige.

## Layout e responsivo

Mobile-first. Breakpoints reais testados: **360 / 768 / 1024 / 1440**.

- Página: coluna única até `lg`, duas colunas a partir dali.
- Os seis stats: **2 colunas** no celular, 3 no tablet, 6 no desktop. Seis campos lado a lado em 360px é ilegível.
- Conteúdo largo (tabela de comparação) rola **dentro do próprio container** com `overflow-x-auto`. O `<body>` nunca rola na horizontal.
- Tabela de comparação com **primeira coluna fixa** — sem ela, rolar faz perder qual linha é qual.
- **Alvo de toque ≥ 44×44px** em tudo que é clicável no celular. Texto-link de 12px não é alvo: vira `IconButton`.
- Modal em tela cheia precisa de respiro seguro; as ações não podem ficar sob a barra do navegador.

## Acessibilidade — obrigatório, não desejável

1. **Contraste** 4.5:1 texto / 3:1 controle. Cor nova? Meça antes de usar.
2. **Foco visível** em todo interativo, via `:focus-visible` com `--focus-ring`. Nunca `outline: none` sem substituto.
3. **Landmarks**: `<header>`, `<main>`, `<footer>` + skip link.
4. **Resultado que muda sozinho** enquanto o usuário digita vive em `aria-live="polite"`, com `aria-busy` durante a busca.
5. **Nunca só cor.** Grade tem letra, tipo tem nome, stat que importa tem marcação textual, vencedor de coluna tem símbolo além do verde.
6. **`prefers-reduced-motion`** respeitado.
7. **Teclado**: tudo alcançável e operável. Modal fecha no `Esc`, tutorial navega nas setas.

## Microtexto pt-BR

- **"Pokémon", nunca "espécime".** É jargão nosso, não do jogador.
- Erro diz **o que fazer**: "Pokémon 'x' não encontrado. Confira o nome e tente de novo." — não "erro 404".
- Estado vazio explica o próximo passo, não só constata o vazio.
- Números em pt-BR (`toLocaleString('pt-BR')`), decimal com vírgula.
- Tom direto, sem exclamação e sem "ops".

## Anti-padrões — todos já custaram caro aqui

| não faça | por quê |
|---|---|
| `aria-label` em gatilho de tooltip | **renomeia** o elemento em vez de descrever. Quebrou `getByLabel('Level')`, que passou a casar com a tag de status. Use `aria-describedby`. |
| esconder só com `opacity-0` | o elemento segue na árvore de acessibilidade e clicável. Some `invisible` junto. |
| `Button` sem `whitespace-nowrap` | "+ Comparar" quebrou em duas linhas quando o painel apertou. |
| seletor por placeholder no e2e | `getByPlaceholder('vulpix')` casou também com o campo Apelido ("ex.: Vulpix do hunt"). Use label exato ou `data-testid`. |
| `?` de dica dentro do `<label>` | o texto do tooltip entra no **nome acessível** do campo e `getByLabel('Level')` para de casar. O `HintMark` fica ao lado do `<label>`, nunca dentro. |
| tooltip centrado perto da borda | o balão de 288px sai da tela e o texto é cortado. `Tooltip` tem `align="start"` / `"end"` para isso. |
| `getByLabel` sem `exact` | `getByLabel('Level')` passou a casar com "Level alvo" e com o `<title>` dos gráficos quando a projeção entrou — 19 testes caíram de uma vez. Todo label de campo é exato. |
| `flex-1` em elemento que não encolhe | `<input type="range">` vazou da célula sem `min-w-0`. |
| cor como único sinal | reprova a11y e some para daltônicos. |
| `text-[11px]` / cores cruas na tela | fura a escala e o sistema de tokens. |

## Checklist de entrega

Antes de dizer "pronto":

- [ ] `npm run test` · `npm run test:e2e` · `npm run build` · `npm run lint` limpos
- [ ] Aberto em **360, 768 e 1440** — sem rolagem horizontal do `body`, sem texto cortado
- [ ] Navegado só com **Tab**: foco sempre visível e em ordem lógica
- [ ] Cor nova? contraste medido e anotado aqui
- [ ] Nenhum `#hex` novo em `src/components/`
- [ ] Estado vazio, carregando e erro conferidos — não só o caminho feliz
- [ ] Capturas de tela olhadas de verdade, não só "o teste passou"
