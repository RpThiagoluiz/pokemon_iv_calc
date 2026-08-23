# O que muda

<!-- Uma ou duas frases. O que passa a acontecer que antes não acontecia? -->

## Por quê

<!-- O problema que isso resolve. Se houver issue, referencie com "Closes #123". -->

## Como testar

<!--
Passo a passo para quem revisa reproduzir na mão.
Ex.: buscar `alakazam`, level 100, quality 1, stats 119/114/109/199/159/184 → grade SS.
-->

1.
2.

## Checklist

- [ ] `npm run test` e `npm run test:e2e` verdes localmente
- [ ] `npm run lint` e `npm run build` limpos
- [ ] Cobri o comportamento novo com teste (domínio no Vitest, fluxo no Playwright)
- [ ] Estado vazio, carregando e erro conferidos — não só o caminho feliz

### Se mexeu na interface

- [ ] Li a skill `poke-ui` antes de mexer
- [ ] Abri em **360, 768 e 1440** — sem rolagem horizontal, sem texto cortado
- [ ] Naveguei só com **Tab**: foco visível e em ordem lógica
- [ ] Nenhum `#hex` novo em `src/components/` (cor vai para token ou config)
- [ ] Cor nova? contraste medido e anotado na skill
- [ ] Nada depende só de cor para ser entendido

### Se mexeu no cálculo

- [ ] Li a skill `poke-formula`
- [ ] O property test de round-trip continua verde
- [ ] Se mudei expoente ou banda de grade, validei contra Pokémon reais

## Capturas

<!-- Obrigatório quando muda algo visual. Antes/depois ajuda muito. -->

## Riscos e o que ficou de fora

<!--
O que pode quebrar, o que você conscientemente não fez, o que ficou para depois.
Escrever "nada" também é resposta.
-->
