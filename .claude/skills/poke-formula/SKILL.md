---
name: poke-formula
description: Fórmula de stat/Power do Poke Idle World e a inversão que descobre os growths (IVs) individuais. Use ao mexer em src/domain/formula.ts, src/domain/inverse.ts, src/config/formula.config.ts ou em qualquer teste de cálculo.
---

# Fórmula e inversão

## Direta

```
k    = (level / 100) × quality^exp[stat]
stat = round( (base + 2·growth) × k )
Power = Σ stats × quality
```

`growth` ∈ inteiros `[1, 32]`. `Σ growth` ∈ `[6, 192]` — é o `xxx/192` do jogo.

Expoentes (`EXPONENTS` em `src/config/formula.config.ts`):

| hp | atk | def | spa | spd | spe |
|---|---|---|---|---|---|
| 0.95 | 0.80 | 0.80 | 0.80 | 0.80 | 0.95 |

A fórmula publicada em `pokepedia/systems/power` **não divulga o expoente**. Estes valores vêm de simulações da comunidade e reproduzem os stats observados no jogo — mas continuam sendo hipótese. **Nunca trate como fato oficial** e não os altere sem validar contra espécimes reais.

## Inversa (o núcleo do produto)

Dado `S` (stat exibido), `base`, `level`, `quality`, `exp`:

```
round(x) = S  ⟹  x ∈ [S − 0.5, S + 0.5)
(base + 2g) ∈ [ (S−0.5)/k , (S+0.5)/k )
g ∈ [ ((S−0.5)/k − base)/2 , ((S+0.5)/k − base)/2 )
```

Depois: interseção com inteiros `[1, 32]` → conjunto candidato por stat.

### Armadilhas

1. **Intervalo semi-aberto.** O limite superior é *exclusivo*. Usar `<=` dos dois lados inclui candidatos que reconstroem para `S+1`.
2. **Sempre valide por reconstrução.** Depois de derivar cada candidato `g`, rode a fórmula direta e confirme `calcStat(...) === S`. Isso elimina erro de ponto flutuante nas bordas de forma barata e definitiva — mais confiável que epsilon.
3. **Ambiguidade cresce quando `k` é pequeno.** Level baixo → intervalos largos → muitas soluções. Isso é matemático, não é bug. Reporte a ambiguidade em vez de escolher um valor arbitrário.
4. **Nunca compare floats com `===`.** Só o resultado de `round` é comparado por igualdade.

### Restrição global: Σ growth = ivTotal

**Não use produto cartesiano** (32^6 no pior caso). Use DP de soma sobre os 6 stats:

- `forward[i][s]` = existe atribuição dos stats `0..i-1` somando `s`?
- `backward[i][s]` = existe atribuição dos stats `i..5` somando `s`?
- O valor `g` do stat `i` é viável ⟺ `∃ s: forward[i][s] && backward[i+1][ivTotal − s − g]`.

Resultados possíveis: `exact` (1 solução), `ambiguous` (>1, retorna faixa por stat), `noSolution` (inputs inconsistentes — stat digitado errado, quality errada ou base stat divergente).

## Explicar o resultado

Toda tag de status precisa se justificar para *aquele* espécime. `explainSolution` em `src/domain/explain.ts` monta o texto do tooltip citando o level, a quality e o IV total que o usuário digitou. Uma tag "exato" sem explicação vira fé — o usuário não tem como saber se confia no número.

Mudou a mensagem? Atualize `tests/explain.test.ts` junto: os testes cobram que o texto cite os valores reais, não um genérico.

## Validação

O teste de round-trip (property test em `tests/inverse.test.ts`) gera growths aleatórios → calcula stats → inverte → confirma que os growths originais estão no conjunto de candidatos. Esse teste nunca pode falhar.
