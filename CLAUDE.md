# Poke IV Calc

Calculadora de IV / Power / Tier para o jogo **Poke Idle World**. Front-end puro (Vite + React + TS + Tailwind v4), sem backend.

O problema: o jogo mostra os stats finais e um IV total (`xxx/192`), mas **não** mostra o *growth* (IV individual) de cada stat. O app inverte a fórmula oficial para descobrir esses growths e emite um grade interno D→SS baseado em *onde* os IVs caíram.

## Comandos

- `npm run dev` — servidor de desenvolvimento
- `npm run test` — Vitest (obrigatório verde antes de qualquer entrega)
- `npm run build` — `tsc -b && vite build`
- `npm run lint` — oxlint

## Fórmulas canônicas

```
stat  = round( (base + 2·growth) × (level / 100) × quality^exp )
Power = (HP + Atk + Def + SpA + SpD + Vel) × quality
```

- `growth` é inteiro em `[1, 32]`; a soma dos 6 é o `xxx/192` exibido no jogo.
- `exp` tem duas hipóteses, ambas suportadas via `FormulaMode`:
  - `official` — `exp = 1` para todos os stats (fórmula publicada em `pokepedia/systems/power`)
  - `discord` — `0.95` para HP e Vel, `0.80` para Atk/Def/SpA/SpD (hipótese de um dev na comunidade)

## Regras de arquitetura

1. **`src/domain/` é matemática pura.** Zero import de React, zero acesso a rede, zero `localStorage`. Tudo ali é testado em `tests/`.
2. **Nunca escreva fórmula dentro de componente React.** Constantes vão em `src/config/`, lógica em `src/domain/`. Se um número mágico aparecer em `src/components/`, está no lugar errado.
3. Os expoentes do modo `discord` são **hipótese não confirmada**. Qualquer alteração neles exige validação contra espécimes reais em `tests/fixtures/specimens.json` — não ajuste "no olho".
4. **Nunca invente base stats.** Eles vêm da PokeAPI ou de input manual do usuário. Se a PokeAPI divergir do jogo, a UI permite corrigir e o override é persistido.
5. Cuidado com arredondamento na inversão: `round(x) = S ⟹ x ∈ [S−0.5, S+0.5)`. O intervalo é **fechado à esquerda e aberto à direita**; usar `<=` nos dois lados gera falsos candidatos.

## Convenções

- UI em **pt-BR**. Nomes de stat no padrão do jogo: `HP, Atk, Def, SpA, SpD, Vel`.
- A chave interna dos stats é a do domínio: `hp, atk, def, spa, spd, spe` (`STAT_KEYS` em `src/domain/types.ts`). `spe` ↔ label `Vel`.
- Tailwind v4 — configuração via `@import "tailwindcss"` no CSS, sem `tailwind.config.js`.
- Testes ficam em `tests/*.test.ts` (fora de `src/`), conforme `vite.config.ts`.

## API externa

**PokeAPI** (`https://pokeapi.co/api/v2/pokemon/{name}`) — pública, sem token, CORS liberado. Resultados são cacheados em `localStorage`.

`poke.idleworld.online` **bloqueia requisições automatizadas (HTTP 403)** — não tente raspar. Dados desse site entram no projeto colados manualmente pelo usuário.

## Skills do projeto

Antes de mexer em cálculo, dados ou grade, leia a skill correspondente em `.claude/skills/`:
`poke-formula` (fórmula e inversão), `poke-data` (PokeAPI e cache), `poke-grade` (pesos e bandas D→SS).
