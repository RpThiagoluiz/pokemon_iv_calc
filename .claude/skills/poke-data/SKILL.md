---
name: poke-data
description: Busca e normalização de espécies via PokeAPI, cache em localStorage e override manual de base stats. Use ao mexer em src/data/, src/hooks/useSpecies.ts ou no seletor de espécie.
---

# Dados de espécie

## PokeAPI

`GET https://pokeapi.co/api/v2/pokemon/{name-or-id}`

- **Pública, sem token, sem chave, CORS liberado.** Não peça credencial ao usuário.
- Nome precisa ser normalizado: minúsculo, espaços/underscore → hífen, sem acento (`Mr. Mime` → `mr-mime`).
- `404` = espécie inexistente ou forma não suportada → mensagem de erro clara, não crash.

Campos usados da resposta:

```
data.id
data.name
data.stats[] → { base_stat, stat: { name } }
data.sprites.front_default            // pode ser null
data.sprites.other['official-artwork'].front_default
data.types[] → { type: { name } }
```

Mapa de nomes de stat da API para as chaves do domínio:

| PokeAPI | domínio |
|---|---|
| `hp` | `hp` |
| `attack` | `atk` |
| `defense` | `def` |
| `special-attack` | `spa` |
| `special-defense` | `spd` |
| `speed` | `spe` |

## Cache

`localStorage`, uma chave por espécie: `pokeivcalc:species:{slug}`. Guarde a espécie **normalizada** (formato do domínio), não a resposta crua. Inclua `fetchedAt`.

Cache é lido antes de qualquer rede. Não há invalidação por tempo — base stats de Pokémon não mudam. Só o botão "recarregar da API" força refetch.

## Override manual — regra importante

Os base stats da PokeAPI **podem divergir** dos do Poke Idle World. Por isso:

- Os 6 campos de base stat são **sempre editáveis** na UI, pré-preenchidos pela API.
- Um override é salvo em `pokeivcalc:override:{slug}` e tem precedência sobre o valor da API.
- A UI marca visualmente quando um valor está sobrescrito, com botão para reverter.

**Nunca invente ou "corrija" base stats no código.** Se houver suspeita de divergência, a saída é a UI de override, não um hard-code.

## poke.idleworld.online

O site oficial retorna **HTTP 403** para requisições automatizadas. Não tente fetch, curl ou proxy. Dados desse site (ex.: bandas de tier de quality) entram no projeto colados manualmente pelo usuário em `src/config/`.
