# Poke IV Calc

Calculadora de IV, Power e tier para o **Poke Idle World**.

O jogo mostra os stats finais e um IV total (`xxx/192`), mas esconde o *growth* (IV individual) de cada stat. Este app inverte a fórmula oficial para descobrir esses growths — e diz se eles caíram nos stats que realmente importam para a espécie.

## Rodando

```bash
npm install
npm run dev      # http://localhost:5173
npm run test     # 47 testes do domínio
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
src/domain/     matemática pura, sem React — 100% coberta por testes
  formula.ts    fórmula direta e Power
  inverse.ts    o inversor (intervalo do round + DP de soma)
  grade.ts      pesos automáticos e bandas D→SS
  calibrate.ts  busca em grade sobre os expoentes
src/config/     constantes ajustáveis (expoentes, bandas, tiers)
src/data/       PokeAPI + cache
src/components/ UI
tests/          Vitest
```

A regra: nenhuma fórmula dentro de componente React. Detalhes em `CLAUDE.md` e nas skills em `.claude/skills/`.
