---
name: poke-grade
description: Modelo de pesos por stat e bandas de grade D→SS que avaliam a distribuição de IVs de um espécime. Use ao mexer em src/domain/grade.ts, src/config/grade.config.ts ou nos sliders de peso da UI.
---

# Grade interno D → SS

## Por que existe

IV total alto não significa Pokémon bom. Um Alakazam com 32 em Atk/Def e 4 em SpA/Vel tem IV total decente e é inútil. O grade mede **onde** os IVs caíram, relativo ao papel da espécie.

## Pesos automáticos

Derivados dos próprios base stats — a espécie declara seu papel pelo formato da distribuição:

```
w_i = (base_i / max(base))^γ        γ = 3 (default, em grade.config.ts)
```

γ alto concentra o peso nos stats dominantes. Com γ=3, um stat com metade do base do maior pesa 1/8 — que é exatamente a intenção (Atk do Alakazam vira ruído).

O usuário pode sobrescrever os 6 pesos por sliders; o preset é persistido por espécie em `pokeivcalc:weights:{slug}`.

## Score e bandas

```
score = Σ w_i · (growth_i − 1) / 31   ÷   Σ w_i        ∈ [0, 1]
```

Normalização `(g−1)/31` porque o range real de growth é `[1, 32]`, não `[0, 32]` — um growth 1 é o piso, e deve pontuar 0.

Bandas default (editáveis em `src/config/grade.config.ts`):

| score ≥ | grade |
|---|---|
| 0.95 | SS |
| 0.88 | S |
| 0.80 | A+ |
| 0.70 | A |
| 0.55 | B |
| 0.35 | C |
| — | D |

## Regras

1. **O grade ignora quality.** Decisão de produto: quality e Power são mostrados em cards separados. Não some quality ao score.
2. **Ambiguidade.** Quando a inversão devolve faixas em vez de valores exatos, calcule o score no mínimo e no máximo e apresente **um intervalo de grade** (ex.: "B–A"). Não escolha o meio da faixa e finja precisão.
3. Bandas e γ são calibráveis. Mudou algum? Rode `npm run test` — há testes de caracterização que fixam o comportamento esperado em casos-âncora (all-32 ⇒ SS, all-1 ⇒ D, o caso Alakazam invertido ⇒ D/C).
4. `Σ w_i` nunca é zero na prática (o stat máximo sempre tem peso 1), mas o código guarda contra divisão por zero se o usuário zerar todos os sliders.
