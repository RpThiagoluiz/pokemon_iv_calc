---
name: poke-grade
description: Modelo de pesos por stat, bandas de grade D→SS e a comparação de espécimes. Use ao mexer em src/domain/grade.ts, src/domain/compare.ts, src/config/grade.config.ts ou nos cards de grade e no modal de comparação.
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

**Os pesos não são editáveis pelo usuário.** A conta é derivada dos base stats e ponto — deixar ajustar transformaria o grade numa opinião, e o valor dele é justamente ser um critério fixo entre espécimes. `keyStats(weights)` alimenta a frase do painel que diz quais stats pesam para a espécie.

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

## Tag de IVs perfeitos no lugar certo

O score é uma **média ponderada**, e média apaga informação: um "B espalhado" e um "B com dois 32 em SpA/Vel" saem com a mesma nota, mas o segundo é bem melhor na prática. A tag recupera isso.

`perfectKeyRolls(growths, weights, grade)` em `grade.ts`:

- **stat principal** = peso ≥ `KEY_STAT_WEIGHT_THRESHOLD` (0,5). Com γ=3 isso equivale a um base stat de ~79% do maior — pega SpA (1,00) e Vel (0,70) do Alakazam e deixa SpD (0,35) de fora.
- **acende** com ≥ `PERFECT_ROLL_MIN_COUNT` (2) stats principais em growth 32, **e** grade abaixo de SS (em SS a tag seria ruído).
- **só conta 32 confirmado** (`range.min === 32`). Um stat ainda ambíguo vai para `possible` e não acende a tag — nunca prometa um roll perfeito que pode não existir.

O texto do tooltip mora em `explainPerfectRolls` (`src/domain/explain.ts`), compartilhado entre o `GradeCard` e o modal de comparação.

Números de referência para calibrar (Alakazam, γ=3):

| IVs | score | grade |
|---|---|---|
| 32 em tudo | 100% | SS |
| 32 em SpA/SpD/Vel, 16 no resto | 96,4% | SS |
| 32 em SpA/Vel, 24 no resto | 94,1% | S |
| 32 em SpA/Vel, 16 no resto | 88,2% | S |
| 32 em SpA/Vel, 1 no resto | 77,2% | A ← **tag acende** |
| 32 nos irrelevantes, 4 em SpA/Vel | 30,3% | D |

Ou seja: **SS não exige 32 em tudo** — exige 32 nos stats pesados.

## Comparação

O grade é também o eixo do comparador (`src/domain/compare.ts`): `rankEntries` ordena por grade e desempata por score; `groupByGrade` monta o "por tier" do modal. `bestPerStat` compara pelo **piso** da faixa (`min`) — um espécime ambíguo não ganha destaque por um teto que talvez não exista.

## Regras

1. **O grade ignora quality.** Decisão de produto: quality e Power são mostrados em card separado. Não some quality ao score.
2. **Ambiguidade.** Quando a inversão devolve faixas em vez de valores exatos, calcule o score no mínimo e no máximo e apresente **um intervalo de grade** (ex.: "B–A"). Não escolha o meio da faixa e finja precisão.
3. Bandas e γ são calibráveis. Mudou algum? Rode `npm run test` — há testes de caracterização que fixam o comportamento esperado em casos-âncora (all-32 ⇒ SS, all-1 ⇒ D, o caso Alakazam invertido ⇒ D/C).
4. `Σ w_i` nunca é zero na prática (o stat máximo sempre tem peso 1), mas `gradeScore` guarda contra divisão por zero mesmo assim.
