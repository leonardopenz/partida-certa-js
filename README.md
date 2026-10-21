# ⚽ Partida Certa — Sorteador de times

Uma página pública para dividir sua turma em times de futebol com **sorteio aleatório ou equilibrado por estrelas**, **um goleiro por time ou goleiros fixos fora do sorteio**, e copiar a escalação para o WhatsApp. Sem cadastro, backend ou banco de dados.

## Executar

Requisitos: Node.js 24 (ou >=22.12) e npm.

```bash
git clone https://github.com/leonardopenz/partida-certa-js.git
cd partida-certa-js
npm ci
npm run dev
```

Abra **http://127.0.0.1:5173**. O Vite usa uma porta fixa: se 5173 já estiver ocupada, encerre a outra instância ou informe outra porta com `npm run dev -- --port 5174`.

Não é necessário configurar `.env`, `APP_URL`, PostgreSQL, Prisma ou migrations. Arquivos `.env` locais antigos não são usados pela aplicação. A remodelação remove os arquivos de backend do código ativo; nenhum banco ou dado externo é apagado.

## Usar o sorteador

Escolha primeiro o **tipo de sorteio**. O **Sorteio aleatório** mantém a distribuição sem considerar habilidade. O **Sorteio equilibrado** revela a avaliação dos participantes após a lista de nomes.

1. Escolha **2 times**, **3 times** ou **Preciso de mais times**. A última opção revela um campo obrigatório para informar 4 ou mais times.
2. Digite uma pessoa por linha e identifique cada goleiro com `(GK)` no final do nome:

```text
João (GK)
Pedro
Leonardo
Carlos (GK)
Lucas
Rafael
```

3. Clique em **Sortear times**.
4. Use **Sortear novamente** para um novo sorteio com a mesma lista.
5. Use **Enviar no WhatsApp** para copiar o texto. A página confirma a cópia; abra a conversa desejada e cole. O botão não envia mensagens nem abre conversas automaticamente.

### Sorteio equilibrado e estrelas

Avalie cada participante de **0 a 5 estrelas**, com incrementos de meia estrela. Clique na metade esquerda da estrela para selecionar metade e na direita para uma estrela inteira. Há uma opção explícita de **zero** e um botão para **Limpar** a avaliação. Os controles também são acessíveis por teclado como grupos de opções.

**Sem avaliação não é zero.** O sorteio equilibrado exige uma avaliação válida de todos os jogadores que serão distribuídos. Avalie goleiros pela habilidade na função: quando um goleiro vai para cada time, suas estrelas entram no cálculo. Goleiros fixos não precisam ser avaliados e ficam fora do cálculo.

As avaliações permanecem ao alternar o tipo de sorteio, a quantidade de times, o modo de goleiros e ao reordenar a lista. São associadas ao nome, ignorando maiúsculas e espaços extras. Adicionar ou corrigir o nome de outro participante preserva as demais avaliações. Um nome novo ou renomeado começa sem avaliação; remover um participante apaga a sua avaliação, mesmo se ele for adicionado novamente. Não há identificação de pessoas além dos nomes informados.

O algoritmo tenta diferentes distribuições, organiza níveis altos e baixos e testa trocas entre jogadores da mesma posição para aproximar a **média de estrelas** dos times. Com quantidades iguais isso também equilibra os totais; quando os tamanhos diferem, as médias permitem comparar os times sem exigir somas iguais. Um jogador a mais ainda pode ser uma vantagem. Os tamanhos continuam diferindo em no máximo uma pessoa, e a regra dos goleiros é preservada.

É uma heurística com tentativas e orçamento de comparações limitado, não uma garantia de solução matemática perfeita. O resultado depende das avaliações subjetivas. A ordem de jogadores empatados, goleiros e times com vagas extras varia aleatoriamente. **Sortear novamente** busca outra composição bem equilibrada, mas pode repetir uma formação por acaso ou quando há poucas alternativas boas.

O resultado mostra a média por time e a diferença entre médias. **Nem as avaliações individuais nem as médias são incluídas no texto para WhatsApp.** Apenas os nomes, times e goleiros são copiados.

### Goleiros fixos e times de linha

Após escolher a quantidade de times, ative o botão **Goleiros fixos**. Nesse modo, somente jogadores de linha são sorteados. Você pode montar, por exemplo, **3 times de linha com 2 goleiros fixos**, revezando apenas os times de linha.

Os nomes com `(GK)` ficam em uma lista separada e não contam no tamanho dos times. A quantidade de goleiros é livre e seus nomes são opcionais: também é possível informar somente os jogadores de linha. Quando informados, os goleiros aparecem em uma seção própria no resultado e no texto copiado para o WhatsApp. Não há distribuição ou revezamento automático de goleiros.

É necessário pelo menos um jogador de linha por time. O novo sorteio mantém os goleiros fora dos times; desativar a opção restaura a exigência de exatamente um goleiro por time. Mudar o modo invalida o resultado anterior.

Se o navegador negar acesso à área de transferência, o resultado aparece em um campo de texto com a opção **Selecionar texto** para cópia manual. A cópia automática funciona em HTTPS e em ambientes locais que permitam Clipboard API.

## Regras

- Linhas vazias e espaços no começo/fim são ignorados.
- `(GK)` e `(gk)` no fim do nome identificam goleiros.
- Um marcador sem nome é inválido.
- Nomes repetidos, desconsiderando maiúsculas e espaços extras, são informados. Diferencie as pessoas, por exemplo, `João A` e `João B`; ninguém é removido silenciosamente.
- No modo normal, a quantidade de goleiros deve ser **igual** à quantidade de times. Faltas e excessos impedem o sorteio e mostram o ajuste necessário.
- No modo normal, cada pessoa aparece uma única vez, com um goleiro por time. No modo de goleiros fixos, apenas os jogadores de linha são distribuídos; goleiros informados aparecem separadamente.
- A diferença de quantidade entre os times é de no máximo um jogador nos dois modos.
- Os times que recebem jogadores excedentes também são escolhidos aleatoriamente.
- Os dois modos equilibram a quantidade; somente o sorteio equilibrado considera as estrelas.
- Uma nova tentativa pode produzir a mesma formação por acaso.
- Editar nomes, avaliações, quantidade de times, tipo de sorteio ou modo de goleiros invalida o resultado anterior.

Todos os dados ficam somente na memória da página. Recarregar ou fechar a aba apaga a lista e o resultado. A aplicação não envia os nomes ao servidor nem os persiste no navegador.

## Estrutura

| Caminho                            | Responsabilidade                                                      |
| ---------------------------------- | --------------------------------------------------------------------- |
| `src/App.tsx`                      | Estado da página e fluxo de sorteio                                   |
| `src/components/DrawForm.tsx`      | Quantidade de times, lista e mensagens de validação                   |
| `src/components/TeamResults.tsx`   | Times apresentados, novo sorteio e cópia com alternativa manual       |
| `src/domain/draw.ts`               | Interpretação, validação e formatação do texto                        |
| `src/domain/balance.ts`            | Distribuição por estrelas e melhoria por trocas com regras de posição |
| `src/domain/random.ts`             | Embaralhamento e números aleatórios sem viés de módulo                |
| `src/components/PlayerRatings.tsx` | Avaliação acessível por estrelas e meias estrelas                     |
| `src/styles.css`                   | Interface responsiva                                                  |
| `tests/`                           | Testes de domínio e interação com a interface                         |

React + TypeScript + Vite. O sorteio usa Fisher–Yates com números gerados pela Web Crypto API e amostragem sem viés de módulo. As funções de domínio não dependem de React. Não há rotas de API, login ou chamadas ao banco na versão atual.

## Comandos e validação

| Comando           | Função                                                              |
| ----------------- | ------------------------------------------------------------------- |
| `npm run dev`     | Iniciar desenvolvimento                                             |
| `npm run check`   | Verificar TypeScript                                                |
| `npm test`        | Testar regras e interface, inclusive cópia e falha da Clipboard API |
| `npm run build`   | Verificar tipos e gerar `dist/`                                     |
| `npm run preview` | Conferir o build localmente                                         |

O CI executa instalação limpa, build e testes sem serviço de PostgreSQL.

## Publicar

```bash
npm ci
npm run build
```

Publique o conteúdo de **`dist/`** em uma hospedagem de arquivos estáticos com HTTPS. O build usa caminhos relativos para funcionar também em subdiretórios. `npm run preview` é destinado à conferência local, não a servir a aplicação em produção. Nenhuma hospedagem é criada automaticamente por este repositório.

## Versão anterior

A implementação MVC com Express, Prisma e PostgreSQL foi preservada na branch **`archive/mvc-v0.1`**, no commit `be4f1d226cf90eb2c5f30631809a7942f62d04fd`. A linha atual é a versão 0.2.0, focada exclusivamente no sorteador. Para futuras expansões, o histórico da versão anterior permanece disponível.
