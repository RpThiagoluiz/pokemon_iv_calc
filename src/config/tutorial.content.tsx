import type { ReactNode } from 'react'
import { Formula, Term } from '../components/prose'

export interface TutorialStep {
  /** Rótulo curto para o indicador de progresso. */
  short: string
  title: string
  body: ReactNode
}

/**
 * Conteúdo do tutorial, separado do componente.
 *
 * O passo 3 é o coração: sem entender que o app INVERTE a fórmula, o usuário
 * não sabe por que às vezes o resultado é exato e às vezes é uma faixa.
 */
export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    short: 'O problema',
    title: 'O jogo esconde metade da informação',
    body: (
      <>
        <p>
          No Poke Idle World cada Pokémon nasce com um <Term>growth</Term> — o IV individual de cada
          stat, um número fixo de 1 a 32 sorteado na captura.
        </p>
        <p>
          O jogo mostra só a <Term>soma</Term> deles, aquele <Formula>xxx/192</Formula>. Você nunca
          descobre se os 32 caíram no stat que importa ou se foram parar no Ataque de um Pokémon
          especial.
        </p>
        <p>Esta ferramenta descobre os seis growths a partir do que a tela já te mostra.</p>
      </>
    ),
  },
  {
    short: 'Os dados',
    title: 'O que copiar do jogo',
    body: (
      <>
        <p>Abra o Pokémon no jogo e traga cinco coisas:</p>
        <ul className="ml-4 list-disc space-y-1.5">
          <li>
            <Term>A espécie</Term> — para buscar os base stats.
          </li>
          <li>
            <Term>Level</Term> e <Term>quality</Term> (o multiplicador de raridade, ex.{' '}
            <Formula>1.42</Formula>).
          </li>
          <li>
            <Term>Os seis stats</Term> exibidos: HP, Atk, Def, SpA, SpD e Vel.
          </li>
          <li>
            <Term>O IV total</Term> <Formula>xxx/192</Formula> — opcional, mas é ele que fecha a
            conta.
          </li>
        </ul>
        <p>Copie exatamente como aparece. Um número errado e a conta não fecha.</p>
      </>
    ),
  },
  {
    short: 'O cálculo',
    title: 'Como a conta é feita',
    body: (
      <>
        <p>O jogo calcula cada stat assim:</p>
        <p className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-inset)] p-3">
          <Formula>stat = round((base + 2 × growth) × level/100 × quality^exp)</Formula>
        </p>
        <p>
          Você conhece o <Term>stat</Term>, o <Term>base</Term>, o <Term>level</Term> e a{' '}
          <Term>quality</Term>. O único desconhecido é o <Term>growth</Term> — então dá para
          inverter a fórmula e isolá-lo.
        </p>
        <p>
          O <Formula>round</Formula> é o detalhe importante: como o jogo arredonda, às vezes mais de
          um growth produz o mesmo número na tela. Aí o app mostra uma <Term>faixa</Term> em vez de
          um valor, e diz <Term>ambíguo</Term>. Level alto e o IV total informado deixam o resultado{' '}
          <Term>exato</Term>.
        </p>
      </>
    ),
  },
  {
    short: 'O grade',
    title: 'Por que IV total alto não basta',
    body: (
      <>
        <p>
          Um Alakazam vive de SpA e Velocidade. Se os 32 caírem em Ataque e Defesa, o{' '}
          <Formula>xxx/192</Formula> fica lindo e o Pokémon é ruim.
        </p>
        <p>
          O grade <Term>D → SS</Term> mede <Term>onde</Term> os IVs caíram. Os pesos saem dos
          próprios base stats da espécie, então cada Pokémon é julgado pelo papel dele. Os stats que
          mais pesam aparecem marcados com <Term>★</Term>.
        </p>
        <p>
          Por isso <Term>SS não exige 32 em tudo</Term> — exige 32 no que importa.
        </p>
      </>
    ),
  },
  {
    short: 'O futuro',
    title: 'Vale a pena subir este?',
    body: (
      <>
        <p>
          No card de Power tem <Term>Ver evolução</Term>. Ele abre uma projeção: como os stats e o
          Power ficam conforme o Pokémon sobe de level, até o <Term>1000</Term>.
        </p>
        <p>
          Aparecem três marcos de leitura rápida — agora, <Formula>+20</Formula> e{' '}
          <Formula>+40</Formula> — e você pode digitar qualquer level alvo para ver o número exato.
        </p>
        <p>
          Como o level entra linear na fórmula, <Term>dobrar o level dobra os stats</Term>. O que
          muda entre dois Pokémon é de onde eles partem — e é isso que a projeção deixa ver.
        </p>
      </>
    ),
  },
  {
    short: 'Comparar',
    title: 'Escolha entre os seus',
    body: (
      <>
        <p>
          Achou quatro Vulpix e não sabe qual fica? Preencha um, dê um apelido, clique em{' '}
          <Term>+ Comparar</Term>. Troque os dados e adicione o próximo — até cinco da mesma
          espécie.
        </p>
        <p>
          <Term>Validar comparação</Term> abre um painel com todos lado a lado: ranking, tier e o
          melhor growth de cada stat destacado.
        </p>
        <p className="text-[var(--color-text-tertiary)]">
          Pode rever este tutorial quando quiser, no botão <Term>?</Term> no topo.
        </p>
      </>
    ),
  },
]
