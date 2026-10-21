# ⚽ Partida Certa — Sorteador de times

Uma página pública para dividir sua turma em times de futebol, com **exatamente um goleiro por time**, e copiar a escalação para o WhatsApp. Sem cadastro, backend ou banco de dados.

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

Se o navegador negar acesso à área de transferência, o resultado aparece em um campo de texto com a opção **Selecionar texto** para cópia manual. A cópia automática funciona em HTTPS e em ambientes locais que permitam Clipboard API.

## Regras

- Linhas vazias e espaços no começo/fim são ignorados.
- `(GK)` e `(gk)` no fim do nome identificam goleiros.
- Um marcador sem nome é inválido.
- Nomes repetidos, desconsiderando maiúsculas e espaços extras, são informados. Diferencie as pessoas, por exemplo, `João A` e `João B`; ninguém é removido silenciosamente.
- A quantidade de goleiros deve ser **igual** à quantidade de times. Faltas e excessos impedem o sorteio e mostram o ajuste necessário.
- Cada pessoa aparece uma única vez, com um goleiro por time e diferença máxima de um jogador entre os times.
- Os times que recebem jogadores excedentes também são escolhidos aleatoriamente.
- A distribuição é equilibrada por quantidade, sem avaliação de habilidade.
- Uma nova tentativa pode produzir a mesma formação por acaso.
- Editar os nomes ou a quantidade de times invalida o resultado anterior.

Todos os dados ficam somente na memória da página. Recarregar ou fechar a aba apaga a lista e o resultado. A aplicação não envia os nomes ao servidor nem os persiste no navegador.

## Estrutura

| Caminho                          | Responsabilidade                                                |
| -------------------------------- | --------------------------------------------------------------- |
| `src/App.tsx`                    | Estado da página e fluxo de sorteio                             |
| `src/components/DrawForm.tsx`    | Quantidade de times, lista e mensagens de validação             |
| `src/components/TeamResults.tsx` | Times apresentados, novo sorteio e cópia com alternativa manual |
| `src/domain/draw.ts`             | Interpretação, validação, embaralhamento e formatação do texto  |
| `src/styles.css`                 | Interface responsiva                                            |
| `tests/`                         | Testes de domínio e interação com a interface                   |

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
