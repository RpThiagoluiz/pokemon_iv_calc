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

A fórmula publicada em `pokepedia/systems/power` **não divulga o expoente**. Estes valores vêm de simulações da comunidade. **Nunca trate como fato oficial.**

> ### ✅ Confirmado em campo — 2026-08-23
>
> Dois Pokémon reais (em `tests/fixtures/specimens.json`) **confirmam** estes expoentes. Mas quase pareceram refutá-los, e a armadilha vale ser conhecida:
>
> | espécime | level | quality exibida | parecia impossível em |
> |---|---|---|---|
> | Cloyster | 119 | 1.56 | HP, Def, SpA, Vel |
> | Vileplume | 70 | 1.51 | Def, SpA |
>
> **A causa era a quality arredondada.** O jogo mostra `1.56`, mas o valor real do Cloyster está entre `1,5638` e `1,5650`. Como a quality é elevada a um expoente, 0,3% de erro nela desloca os stats em ±1 — e um stat off-by-one não tem growth inteiro que o explique.
>
> Cravar o valor exibido tornava espécimes perfeitamente válidos "impossíveis". Com a janela de arredondamento, os dois fecham:
>
> | espécime | growths | IV total |
> |---|---|---|
> | Cloyster | 28/24/16/17/16/19 | 120 |
> | Vileplume | 14/28/5/11/9/25 | 92 |
>
> Os base stats do jogo foram conferidos contra o `pokepedia` e **batem com a PokeAPI** — não eram o problema.
>
> Lição para a próxima investigação: **antes de suspeitar da fórmula, suspeite da precisão dos números de entrada.** Todo valor exibido por um jogo é arredondado.

## A janela de quality

`solveGrowths` recebe `qualityDecimals` e trata a quality como **intervalo**, não como ponto: `1.56` com 2 casas significa `[1.555, 1.565)`.

A varredura usa **sub-intervalos exatos**, não amostragem: `qualityBreakpoints` calcula os `q` onde algum stat troca de growth viável (`q = ((S ± 0.5)/corpo)^(1/e)`) e resolve uma vez entre cada par de fronteiras. Amostrar num passo fixo perderia faixas estreitas — e são justamente elas o caso comum (a do Cloyster tem 0,0012 de largura).

O resultado devolve `qualityRange`: a faixa que de fato explica os stats, quase sempre **mais precisa que a que o jogo mostra**. A UI exibe isso no card de Power.

`QUALITY_CASAS_MIN = 2` no `App.tsx` é o piso de precisão, porque é assim que o jogo exibe. Sem ele, digitar `1` viraria `±0,5` e tudo ficaria ambíguo.

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

Só que ele prova **consistência interna**, não correção: ele usa a mesma fórmula na ida e na volta, então passa mesmo com o expoente errado. Quem valida a fórmula de verdade é `tests/fixtures/specimens.json` — espécimes reais do jogo.

### Como investigar um espécime que não fecha

1. Confirme os base stats **no `pokepedia` do jogo**, não na PokeAPI. É a divergência mais provável.
2. Para cada stat, inverta procurando o expoente em vez do growth: `exp = ln(stat / ((base + 2g) · level/100)) / ln(quality)`, varrendo `g` de 1 a 32. Isso mostra quais pares (growth, expoente) são possíveis.
3. Cruze **dois ou mais espécimes com levels e qualities diferentes**. Um só admite quase qualquer expoente; dois já eliminam a maior parte.
4. Teste a estrutura antes dos valores: exija só que um grupo de stats compartilhe o mesmo multiplicador `k`, com `k` livre. Se nem assim fecha, o problema é o modelo ou os dados de entrada — não a calibração.
