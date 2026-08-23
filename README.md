# Poke IV Calc

Calculadora de IV, Power e tier para o **Poke Idle World**.

O jogo mostra os stats finais e um IV total (`xxx/192`), mas esconde o *growth* (IV individual) de cada stat. Este app inverte a fórmula oficial para descobrir esses growths — e diz se eles caíram nos stats que realmente importam para a espécie.

## Rodando

```bash
npm install
npx playwright install chromium   # só na primeira vez, para o e2e
npm run dev        # http://localhost:5173
npm run test       # 56 testes de domínio (Vitest)
npm run test:e2e   # 34 testes de ponta a ponta (Playwright)
npm run build
```

## Como usar

1. **Espécie** — digite o nome (`vulpix`, `alakazam`, `mr-mime`). Os base stats vêm da PokeAPI e ficam editáveis: se divergirem do jogo, corrija e a correção fica salva.
2. **Seu espécime** — level, quality (o multiplicador) e os seis stats exatamente como a tela do jogo mostra. O IV total é opcional, mas é ele que elimina a ambiguidade.
3. O app devolve o **growth de cada stat**, o **grade D→SS** da distribuição e o **Power / tier de quality**.

Level alto normalmente dá solução única. Level baixo devolve faixas — isso é matemático, não é bug: com o fator `(level/100) × quality^exp` pequeno, vários growths arredondam para o mesmo stat exibido. Suba de level ou informe o IV total.

## Grade D → SS

Mede **onde** os IVs caíram, não quantos são. Um Alakazam com 32 em Atk/Def e 4 em SpA/Vel tem IV total alto e é ruim — o grade reflete isso.

Os pesos saem dos próprios base stats (`w = (base / maior_base)^3`), então a espécie declara seu papel pela distribuição. Dá para ajustar os seis pesos nos sliders, e o preset fica salvo por espécie. O grade **não** considera quality — ela aparece em card separado.

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

A tag só conta 32 **confirmado**: se a inversão ficou ambígua e o stat *pode* ser 32, ela não acende — nada de prometer roll perfeito que talvez não exista.

## Os dois modos de fórmula

```
stat = round( (base + 2·growth) × (level/100) × quality^exp )
```

| modo | expoente |
|---|---|
| **Oficial** | `1` em todos os stats — a fórmula publicada no pokepedia |
| **Discord** | `0,95` em HP/Vel e `0,80` nos demais — hipótese da comunidade |

As duas estão implementadas porque não há confirmação de qual vale. A aba **Calibrar expoentes** resolve isso empiricamente: cadastre Pokémon reais seus e cada um elimina os expoentes que não explicam os stats observados. Espécimes com quality alta e variada estreitam rápido — quality 1,0 não informa nada, já que qualquer expoente vale 1 ali.

## Dados e limitações

- **PokeAPI** — pública, sem token, cacheada em `localStorage`. Se algum base stat divergir do jogo, edite na UI.
- **Faixas de tier de quality** — ainda são uma **estimativa**. A tabela oficial está em `pokepedia/systems/quality`, que bloqueia acesso automatizado (HTTP 403). Abra no navegador, copie a tabela e atualize `src/config/quality.config.ts` (e ponha `QUALITY_TIERS_ARE_CONFIRMED = true`) para fixar os valores reais.

## Estrutura

```
src/domain/       matemática pura, sem React — 100% coberta por testes
  formula.ts      fórmula direta e Power
  inverse.ts      o inversor (intervalo do round + DP de soma)
  grade.ts        pesos automáticos, bandas D→SS e a tag de IVs perfeitos
  calibrate.ts    busca em grade sobre os expoentes
src/config/       constantes ajustáveis (expoentes, bandas, tiers)
src/data/         PokeAPI + cache
src/components/   UI
tests/            Vitest — o domínio
e2e/
  fixtures/       stub da PokeAPI + espécies congeladas + o `test` do projeto
  pages/          Page Object: todo seletor vive aqui
  support/        fórmula reimplementada de propósito (round-trip honesto)
  specs/          os testes
```

O e2e nunca importa de `src/` e nunca toca a rede: a PokeAPI é interceptada e as espécies são fixtures locais. Detalhes em `CLAUDE.md`.

A regra: nenhuma fórmula dentro de componente React. Detalhes em `CLAUDE.md` e nas skills em `.claude/skills/`.
