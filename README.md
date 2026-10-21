# ⚽ Partida Certa

**Monte os times do seu futebol de forma rápida, com sorteio aleatório ou equilíbrio por nível dos jogadores.**

O Partida Certa é uma aplicação web para quem organiza partidas de futebol amador, society, futsal ou o racha entre amigos. A proposta é simplificar a divisão da turma: informe os participantes, escolha a quantidade de times e compartilhe a escalação com o grupo.

A aplicação funciona diretamente no navegador, sem cadastro. A interface se adapta ao celular e ao computador.

## O que é possível fazer

- Formar **2, 3 ou mais times**, com quantidade personalizada a partir de 4.
- Inserir os participantes em uma lista, com **um nome por linha**.
- Escolher entre **sorteio aleatório** e **sorteio equilibrado por estrelas**.
- Identificar goleiros com **`(GK)`** após o nome.
- Distribuir um goleiro por time ou manter **goleiros fixos fora do sorteio**.
- Refazer o sorteio sem precisar digitar os participantes novamente.
- Copiar os times em um texto formatado para colar no WhatsApp.

## Tipos de sorteio

| Modo                    | Como funciona                                                                                                             | Quando usar                                                                            |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| **Sorteio aleatório**   | Distribui os participantes sem considerar habilidade, respeitando a quantidade de jogadores e a configuração de goleiros. | Para dividir a turma rapidamente ou quando não há avaliação dos jogadores.             |
| **Sorteio equilibrado** | Usa as estrelas atribuídas aos participantes para buscar times com médias de nível próximas.                              | Quando o organizador conhece os jogadores e quer considerar a diferença de habilidade. |

Nos dois modos, cada jogador sorteado aparece uma única vez, e a diferença de quantidade entre os times é de **no máximo uma pessoa**.

### Avaliação por estrelas

No modo equilibrado, cada participante do sorteio recebe uma avaliação de **0 a 5 estrelas**, com opções de meia estrela, como **2,5** ou **3,5 estrelas**.

- Clique na metade esquerda de uma estrela para selecionar meia estrela, ou na metade direita para selecionar a estrela inteira.
- Use a opção **0** quando essa for a avaliação desejada.
- Use **Limpar** para retirar uma avaliação.
- **Sem avaliação é diferente de zero:** todos os jogadores que entram no sorteio equilibrado precisam ser avaliados.
- Avalie cada participante considerando sua habilidade na função em que joga.

As avaliações são mantidas ao alternar o modo de sorteio, mudar a quantidade de times e reordenar a lista. Elas são associadas ao nome, ignorando maiúsculas e espaços extras. Participantes novos ou renomeados começam sem avaliação; os removidos deixam de ter sua avaliação guardada. Alterar um participante preserva as avaliações dos demais.

### Como o equilíbrio é buscado

A aplicação gera diferentes distribuições e testa trocas entre jogadores de linha ou entre goleiros para aproximar as **médias de estrelas dos times**. As regras de quantidade e posição continuam sendo respeitadas.

Com times do mesmo tamanho, aproximar as médias também aproxima a soma das avaliações. Quando os tamanhos são diferentes, a comparação usa as médias; ainda assim, ter uma pessoa a mais pode representar uma vantagem em campo.

O resultado mostra a média de cada time e a diferença entre as médias. O cálculo é uma aproximação baseada nas avaliações informadas, com um limite de tentativas para manter o uso ágil; não garante uma formação matemática perfeita nem prevê o resultado da partida.

## Configuração de goleiros

| Configuração            | Comportamento                                                                                                                                        |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Um goleiro por time** | A lista precisa conter exatamente tantos goleiros quanto times. Cada equipe recebe um deles. No modo equilibrado, suas estrelas entram no cálculo.   |
| **Goleiros fixos**      | Apenas os jogadores de linha são distribuídos. Os goleiros informados ficam em uma lista separada, sem entrar no tamanho nem na avaliação dos times. |

A opção **Goleiros fixos** permite, por exemplo, montar **3 times de linha com 2 goleiros fixos** e revezar apenas os jogadores de linha. Nesse modo, informar os nomes dos goleiros é opcional, e eles não precisam de avaliação. É necessário pelo menos um jogador de linha por time.

Quando os goleiros são informados, seus nomes aparecem separadamente no resultado e no texto compartilhado. A aplicação monta os times; o revezamento durante a partida é organizado pelo grupo.

## Como usar

1. Escolha o **tipo de sorteio**.
2. Selecione a **quantidade de times** e, se necessário, ative **Goleiros fixos**.
3. Informe os participantes, um por linha. Para identificar goleiros, use `(GK)` ao final do nome:

   ```text
   João (GK)
   Leonardo
   Pedro
   Carlos (GK)
   Lucas
   Rafael
   ```

4. Se escolheu o modo equilibrado, atribua as estrelas aos participantes.
5. Clique em **Sortear times** e confira o resultado.
6. Use **Sortear novamente** para buscar outra formação ou **Enviar no WhatsApp** para copiar os times.

O botão **Enviar no WhatsApp** copia o texto e informa quando a cópia foi concluída. Depois, abra a conversa desejada e cole a escalação. **As estrelas individuais e as médias dos times não são incluídas no texto.**

Se a cópia automática não estiver disponível, a aplicação oferece o texto para seleção e cópia manual. Um novo sorteio pode repetir uma formação por acaso ou quando há poucas combinações adequadas.

### Validações da lista

Linhas vazias e espaços no começo ou no fim dos nomes são ignorados. O marcador de goleiro aceita `(GK)` e `(gk)`, mas deve estar acompanhado de um nome. Nomes repetidos são sinalizados: diferencie as pessoas, por exemplo, com `João A` e `João B`.

Alterar os nomes, avaliações ou configurações invalida o resultado anterior, para que o próximo sorteio considere os dados atualizados.

## Dados e privacidade

Os nomes, as avaliações e os times ficam somente na memória da página. A aplicação não os envia a um servidor nem os salva no armazenamento do navegador.

**Recarregar a página ou fechar a aba apaga a lista, as avaliações e o resultado.** A cópia para a área de transferência acontece somente quando solicitada pelo usuário.

## Executar localmente

Use **Node.js 24**, indicado no arquivo `.nvmrc`, e npm. O requisito declarado pelo projeto é **Node.js 22.12.0 ou superior**.

```bash
git clone https://github.com/leonardopenz/partida-certa-js.git
cd partida-certa-js
npm ci
npm run dev
```

Abra **http://127.0.0.1:5173** no navegador.

A aplicação não exige configuração de banco de dados ou variáveis de ambiente. Se a porta 5173 estiver ocupada, encerre a outra instância ou escolha outra porta:

```bash
npm run dev -- --port 5174
```

### Comandos disponíveis

| Comando           | Finalidade                                                                                |
| ----------------- | ----------------------------------------------------------------------------------------- |
| `npm run dev`     | Iniciar o ambiente de desenvolvimento com atualização da interface durante as alterações. |
| `npm run check`   | Verificar os tipos TypeScript.                                                            |
| `npm test`        | Executar os testes das regras de sorteio e das interações da interface.                   |
| `npm run build`   | Verificar os tipos e gerar os arquivos de produção em `dist/`.                            |
| `npm run preview` | Conferir localmente o build de produção.                                                  |

## Publicação

```bash
npm ci
npm run build
```

Publique o conteúdo de **`dist/`** em uma hospedagem de arquivos estáticos com HTTPS. Os caminhos relativos do build permitem hospedar a aplicação também em um subdiretório.

O Node.js é usado nas ferramentas de desenvolvimento, testes e build; a aplicação publicada executa no navegador, sem exigir um processo Node.js no servidor. O comando `npm run preview` serve para conferência local do build.

## Organização do projeto

A estrutura separa os componentes visuais das regras de sorteio. Isso permite testar o cálculo de distribuição sem depender da interface e evoluir as telas sem concentrar todas as regras em um componente.

| Caminho                            | Responsabilidade                                                         |
| ---------------------------------- | ------------------------------------------------------------------------ |
| `src/App.tsx`                      | Estado da página e coordenação do fluxo de sorteio.                      |
| `src/components/DrawForm.tsx`      | Escolha de modo, quantidade de times, goleiros e lista de participantes. |
| `src/components/PlayerRatings.tsx` | Avaliações por estrelas e meias estrelas.                                |
| `src/components/TeamResults.tsx`   | Apresentação dos times, médias, novo sorteio e cópia do resultado.       |
| `src/domain/draw.ts`               | Interpretação dos nomes, validações, avaliações e formatação do texto.   |
| `src/domain/balance.ts`            | Busca de distribuições equilibradas por estrelas.                        |
| `src/domain/random.ts`             | Geração aleatória e embaralhamento.                                      |
| `src/styles.css`                   | Aparência e adaptação da interface aos tamanhos de tela.                 |
| `tests/`                           | Testes automatizados das regras e da interface.                          |
| `.github/workflows/ci.yml`         | Instalação, build e testes no GitHub Actions.                            |

## Tecnologias e motivos das escolhas

As versões das bibliotecas abaixo são as **resolvidas no `package-lock.json`**, e não apenas as faixas permitidas pelo `package.json`. Use `npm ci` para instalar as versões registradas no projeto. A versão de referência do Node.js está no `.nvmrc` e no workflow de CI; npm não tem uma versão específica fixada.

### Interface e ferramentas de desenvolvimento

| Tecnologia               | Versão de referência                 | Papel na aplicação e motivo da escolha                                                                                                                                            |
| ------------------------ | ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **React**                | **19.3.1**                           | Organiza a interface em componentes e mantém formulário, avaliações e resultado sincronizados com o estado da página. Facilita a evolução das interações sem recarregar a página. |
| **React DOM**            | **19.3.1**                           | Renderiza os componentes React no navegador e atualiza os elementos da interface.                                                                                                 |
| **TypeScript**           | **5.9.3**                            | Define os tipos de participantes, times, avaliações e opções de sorteio. Ajuda a detectar inconsistências durante o desenvolvimento e facilita mudanças nas regras.               |
| **Vite**                 | **7.3.7**                            | Fornece o servidor de desenvolvimento e o build de produção. Atende ao formato de uma aplicação React estática com configuração pequena.                                          |
| **Plugin React do Vite** | **5.2.0**                            | Integra React ao Vite, incluindo a atualização dos componentes durante o desenvolvimento.                                                                                         |
| **Node.js**              | **24**; mínimo declarado **22.12.0** | Executa as ferramentas de desenvolvimento, build e testes. A versão 24 mantém o ambiente recomendado alinhado ao CI.                                                              |
| **npm**                  | Sem versão fixada                    | Gerencia dependências e scripts. O arquivo de lock permite reproduzir a instalação com `npm ci`.                                                                                  |
| **HTML e CSS**           | Padrões nativos da web               | Estruturam a página e definem estilos responsivos, controles de estrelas e estados visuais, sem depender de um framework de componentes ou de estilos.                            |

### Testes e integração contínua

| Tecnologia                | Versão de referência                            | Papel e motivo da escolha                                                                                            |
| ------------------------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| **Node.js Test Runner**   | Integrado ao Node.js 24 usado no CI             | Executa a suíte de testes sem exigir um framework adicional de execução.                                             |
| **tsx**                   | **4.23.15**                                     | Permite executar os arquivos de teste TypeScript e TSX diretamente com o test runner do Node.js.                     |
| **React Testing Library** | **16.3.3**                                      | Verifica as interações pela perspectiva do usuário: selecionar opções, avaliar jogadores, sortear e copiar os times. |
| **jsdom**                 | **27.4.0**                                      | Fornece um ambiente de documento HTML para testar os componentes sem abrir um navegador real.                        |
| **GitHub Actions**        | `actions/checkout@v4` e `actions/setup-node@v4` | Automatiza instalação limpa, build e testes a cada push ou pull request, ajudando a identificar regressões.          |

Os testes verificam, entre outros casos, jogadores sem repetição, tamanhos dos times, regras dos goleiros, avaliações válidas, distribuição por estrelas, preservação das avaliações e conteúdo copiado para o WhatsApp.

### Recursos nativos do navegador

| Recurso                                          | Uso e motivo da escolha                                                                                                         |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| **Web Crypto API**                               | Fornece os números aleatórios usados no embaralhamento Fisher–Yates. A amostragem evita favorecer índices por viés de módulo.   |
| **Clipboard API**                                | Copia o resultado para o usuário colar no WhatsApp, com confirmação de sucesso e alternativa manual quando a cópia é bloqueada. |
| **Controles HTML e atributos de acessibilidade** | Permitem identificar campos, navegar nas opções de avaliação por teclado e apresentar mensagens de validação e confirmação.     |

Esses recursos fazem parte do navegador e não têm uma versão de pacote npm no projeto.

### Por que uma aplicação estática?

O escopo atual consiste em receber uma lista, calcular a divisão e apresentar os times. Essas operações podem acontecer inteiramente no navegador. Por isso, a arquitetura usa **frontend estático com regras de domínio separadas dos componentes**, sem backend ou banco de dados.

Essa escolha simplifica a instalação, a hospedagem e a manutenção, além de manter os dados dos participantes na própria página. Recursos futuros que precisem de contas, histórico compartilhado ou persistência poderão exigir uma nova avaliação da arquitetura.
