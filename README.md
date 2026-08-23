# Poke IV Calc

### ▶ [pokeidleivcalc.netlify.app](https://pokeidleivcalc.netlify.app/)

Calculadora de IV, Power e grade para o **Poke Idle World**.

O jogo mostra os stats finais e um IV total (`xxx/192`), mas esconde o *growth* (IV individual) de cada stat. Este app inverte a fórmula do jogo para descobrir esses growths — e diz se eles caíram nos stats que realmente importam para a espécie.

Se te ajudou, **deixe uma ⭐ no repositório** — é o que mostra que vale continuar melhorando.

## Rodando

```bash
npm install
npx playwright install chromium   # só na primeira vez, para o e2e
npm run dev        # http://localhost:5173
npm run test       # 72 testes de domínio (Vitest)
npm run test:e2e   # 73 testes de ponta a ponta (Playwright)
npm run build
```

## Como usar

Na primeira visita um **tutorial em 5 passos** abre sozinho e explica o problema, os dados a copiar, como o cálculo é feito, o grade e a comparação. Dá para pular a qualquer momento, e o botão **?** no topo reabre quando quiser.

1. **Pokémon** — digite o nome da espécie (`vulpix`, `alakazam`, `mr-mime`). Os base stats vêm da PokeAPI e ficam editáveis: se divergirem do jogo, corrija e a correção fica salva.
2. **Seu Pokémon** — apelido (opcional), level, quality e os seis stats exatamente como a tela do jogo mostra. O IV total é opcional, mas é ele que elimina a ambiguidade.
3. O app devolve o **growth de cada stat**, o **grade D→SS** da distribuição e o **Power**.

Level alto normalmente dá solução única. Level baixo devolve faixas — isso é matemático, não é bug: com o fator `(level/100) × quality^exp` pequeno, vários growths arredondam para o mesmo stat exibido. A tag **exato** / **ambíguo** tem um tooltip que explica o que aconteceu com o *seu* Pokémon e o que fazer.

## Comparar Pokémon

Serve para responder "qual dos meus quatro Vulpix eu fico?".

Preencha um Pokémon, dê um apelido e clique em **+ Comparar**. Troque os dados, adicione o próximo — de 2 a 5. **Validar comparação** abre um painel em tela cheia com:

- **Ranking** — do melhor grade para o pior, com score e IV total.
- **Por tier** — agrupados por grade (SS, S, A+…), pulando os vazios.
- **Detalhe** — uma coluna por Pokémon com level, quality, Power, IV total e os seis growths. Em verde, o melhor de cada stat.

A comparação é travada na espécie atual: trocar de Pokémon a limpa. A lista vale só para a sessão — recarregar a página zera.

Se algum Pokémon ficou ambíguo, o painel avisa que a comparação é aproximada. Nesse caso o "melhor por stat" usa o **piso** da faixa, não o teto — ninguém ganha destaque por um valor que talvez não exista.

## Grade D → SS

Mede **onde** os IVs caíram, não quantos são. Um Alakazam com 32 em Atk/Def e 4 em SpA/Vel tem IV total alto e é ruim — o grade reflete isso.

Os pesos saem dos próprios base stats (`w = (base / maior_base)^3`), então a espécie declara seu papel pela distribuição. **Não são ajustáveis**: o valor do grade é ser um critério fixo, igual para todo Pokémon.

**SS não exige 32 em tudo** — exige 32 nos stats que pesam. Um Alakazam com 32 em SpA/SpD/Vel e 16 no resto é SS com IV total de apenas 144/192:

| IVs (Alakazam) | IV total | score | grade |
|---|---|---|---|
| 32 em tudo | 192 | 100% | SS |
| 32 em SpA/SpD/Vel, 16 no resto | 144 | 96,4% | SS |
| 32 em SpA/Vel, 16 no resto | 128 | 88,2% | S |
| 32 em SpA/Vel, 1 no resto | 68 | 77,2% | A |
| 32 nos irrelevantes, 4 em SpA/Vel | 136 | 30,3% | D |

### Tag "IVs perfeitos no lugar certo"

O score é uma média ponderada, e média apaga informação: um "B espalhado" e um "B com dois 32 em SpA/Vel" saem com a mesma nota, mas o segundo vale bem mais. Quando um Pokémon abaixo de SS tem **2 ou mais IVs em 32 nos stats principais da espécie**, aparece uma tag ao lado do grade, com tooltip nomeando quais stats são.

A tag só conta 32 **confirmado**: se a inversão ficou ambígua e o stat *pode* ser 32, ela não acende.

## A fórmula

```
stat  = round( (base + 2·growth) × (level/100) × quality^exp )
Power = (HP + Atk + Def + SpA + SpD + Vel) × quality
```

`exp` é `0,95` para HP e Vel e `0,80` para os demais. A fórmula publicada em `pokepedia/systems/power` **não divulga o expoente** — esses valores vêm de simulações da comunidade e reproduzem os stats observados no jogo, mas seguem sendo uma hipótese.

## Dados e limitações

- **PokeAPI** — pública, sem token, cacheada em `localStorage`. Se algum base stat divergir do jogo, edite na UI.
- **Tier de quality** (Common/Rare/Epic…) **não é exibido.** As faixas oficiais estão em `pokepedia/systems/quality`, que bloqueia acesso automatizado, e mostrar um palpite seria pior do que não mostrar nada. O app exibe o multiplicador cru.

## Estrutura

```
src/domain/       matemática pura, sem React — coberta por testes
  formula.ts      fórmula direta e Power
  inverse.ts      o inversor (intervalo do round + DP de soma)
  grade.ts        pesos automáticos, bandas D→SS e a tag de IVs perfeitos
  compare.ts      ranking, agrupamento por tier e melhor-por-stat
  explain.ts      os textos dos tooltips, como funções puras
src/config/       constantes ajustáveis (expoentes, bandas, tipos, tutorial)
src/data/         PokeAPI + cache
src/components/   UI sobre os tokens de src/index.css
tests/            Vitest — o domínio
e2e/
  fixtures/       stub da PokeAPI + espécies congeladas + o `test` do projeto
  pages/          Page Object: todo seletor vive aqui
  support/        fórmula reimplementada de propósito (round-trip honesto)
  specs/          os testes
```

O e2e nunca importa de `src/` e nunca toca a rede: a PokeAPI é interceptada e as espécies são fixtures locais. Detalhes em `CLAUDE.md`.

## Design

Tema escuro único, mobile-first, com o **acento derivado do tipo do Pokémon** — Vulpix deixa a tela laranja, Alakazam deixa rosa. Tipografia Inter + JetBrains Mono (números com `tabular-nums`, para alinharem em coluna).

Todos os pares de cor foram medidos contra WCAG AA: pior caso **4,65:1** no texto terciário e **6,32:1** nas cores de grade. Cor nunca é o único sinal — grade mostra a letra, tipo mostra o nome, stat que pesa leva ★, melhor da coluna leva ▲.

As regras completas — tokens, componentes, breakpoints, checklist de a11y e anti-padrões — estão em [`.claude/skills/poke-ui/SKILL.md`](.claude/skills/poke-ui/SKILL.md).

## Deploy

Publicado em **[pokeidleivcalc.netlify.app](https://pokeidleivcalc.netlify.app/)**.

`npm run build` gera `dist/`. No Netlify: build command `npm run build`, publish directory `dist`.

## Contribuindo

Abra uma issue ou PR em [RpThiagoluiz/pokemon_iv_calc](https://github.com/RpThiagoluiz/pokemon_iv_calc). O template de PR e o CI (lint, tipos, 72 testes de domínio e 73 de ponta a ponta) rodam sozinhos a cada abertura.

E se a ferramenta te poupou tempo, **[deixe uma ⭐](https://github.com/RpThiagoluiz/pokemon_iv_calc)**.
