# ⚽ Partida Certa JS

Organização de futebol amador com **React + TypeScript**, **Node.js/Express + TypeScript** e **PostgreSQL + Prisma ORM**, em um **monólito MVC**.

Esta é a primeira versão funcional da reimplementação do [partida-certa](https://github.com/leonardopenz/partida-certa). O projeto original usa Laravel e Vue/Inertia; este repositório implementa o núcleo do domínio em JavaScript/TypeScript. Não é uma cópia completa de todos os módulos.

## O que já funciona

- Cadastro, login e logout com senha protegida por scrypt e sessões persistidas no banco.
- Grupos com administrador e membros; convite por link para usuários autenticados.
- Agenda de partidas de society, futsal e campo, com local, data, limites e valor por jogador.
- Confirmação e cancelamento de presença de membros e convidados.
- Link público de presença, compartilhável manualmente no WhatsApp ou outro canal.
- Cancelamento até 30 minutos antes da partida; proibição de alterações após início/cancelamento.
- Controle transacional de lotação com bloqueio por partida no PostgreSQL.
- Sorteio aleatório de 2 a 8 times, equilibrado por quantidade e salvo no banco.
- Invalidação do sorteio quando a lista de jogadores muda.
- Interface responsiva em português, testes automatizados e workflow de CI.

PostgreSQL é o **banco de dados**. Prisma é o **ORM** que acessa esse banco.

## Executar localmente

Requisitos: Node.js 24 (ou >=22.12), npm e PostgreSQL 17+. Docker é opcional.

```bash
git clone https://github.com/leonardopenz/partida-certa-js.git
cd partida-certa-js
cp .env.example .env
npm ci

# Opcional: subir somente o banco com Docker
docker compose up -d db

npm run generate
npm run db:deploy
npm run dev
```

Abra **http://localhost:5173** e crie sua conta. Não há usuários ou senhas de aplicação pré-cadastrados. Se usar PostgreSQL instalado diretamente, crie o usuário/banco e ajuste `DATABASE_URL` no `.env` antes de aplicar as migrations.

As credenciais do `compose.yaml` são apenas para desenvolvimento local. O banco é exposto somente em `127.0.0.1`. Para trocar a senha local no primeiro provisionamento, configure `POSTGRES_PASSWORD` e atualize `DATABASE_URL`.

### Fluxo de uso

1. Crie uma conta e um grupo.
2. Copie o convite do grupo para que outros usuários se tornem membros.
3. Agende uma partida dentro do grupo.
4. Confirme presença ou compartilhe o link público para convidados avulsos.
5. Com pelo menos um jogador por time, sorteie os times na página da partida.

Quem recebe o link público vê o nome dos confirmados e os dados básicos da partida. Para convidados, o acesso de cancelamento é guardado no navegador que confirmou a presença; ele não é divulgado na lista pública. Se limpar os dados do navegador, esse acesso será perdido. A primeira versão não impede uma pessoa de se cadastrar várias vezes como convidado com nomes diferentes.

## Arquitetura MVC

Um repositório, um banco e **um único processo/deploy em produção**. O Express serve `/api` e o React compilado. No desenvolvimento, Vite oferece hot reload e encaminha `/api` ao Express.

| Camada              | Diretório                                        | Responsabilidade                                          |
| ------------------- | ------------------------------------------------ | --------------------------------------------------------- |
| Model               | `prisma/`, `src/server/models/`                  | Entidades, relações, migrations, consultas e persistência |
| View                | `src/client/`                                    | React, formulários e interação com usuário                |
| Controller          | `src/server/controllers/`                        | Validação de entrada, autorização e respostas HTTP        |
| Services            | `src/server/services/`                           | Regras de presença, transações, sorteio e segurança       |
| Middleware / Routes | `src/server/middleware/`, `src/server/routes.ts` | Sessão, roteamento e proteção de acesso                   |

A API JSON é uma interface interna do mesmo monólito; não há microsserviços. As transações de confirmação, cancelamento e sorteio usam o mesmo bloqueio de partida (`SELECT ... FOR UPDATE`) para evitar lotação excedida e sorteios inconsistentes. Valores monetários são armazenados em centavos; datas são transportadas com fuso e exibidas no horário local do navegador.

## Comandos

| Comando                             | Uso                                        |
| ----------------------------------- | ------------------------------------------ |
| `npm run dev`                       | Express + React/Vite em desenvolvimento    |
| `npm run check`                     | Gerar Prisma Client e verificar TypeScript |
| `npm run build`                     | Compilar frontend e backend                |
| `npm start`                         | Iniciar o backend compilado                |
| `npm test`                          | Testar regras e hashes de senha sem banco  |
| `npm run test:integration`          | Testar a API com PostgreSQL dedicado       |
| `npm run db:deploy`                 | Aplicar migrations existentes              |
| `npm run db:migrate -- --name nome` | Criar migration durante desenvolvimento    |
| `npm run db:studio`                 | Explorar dados localmente                  |

Prisma Client é gerado em `src/server/generated/` e não é versionado. Execute `npm run generate` após instalar dependências e antes de iniciar o desenvolvimento. `npm run build` também faz a geração automaticamente.

### Testes de integração

Crie um banco separado chamado `partida_certa_test`; nunca use o banco com dados reais. Os testes exigem um nome terminado em `_test`, criam seus próprios registros e removem apenas esses registros ao finalizar.

```bash
export TEST_DATABASE_URL='postgresql://partida:partida_local@localhost:5432/partida_certa_test'
DATABASE_URL="$TEST_DATABASE_URL" npm run db:deploy
npm run test:integration
```

O workflow em `.github/workflows/ci.yml` sobe PostgreSQL, aplica migrations e executa build e testes.

## Produção

```bash
npm ci
npm run build
npm run db:deploy
NODE_ENV=production APP_URL=https://seu-dominio.example npm start
```

Configure `DATABASE_URL`, `APP_URL` e `PORT` no ambiente. Use proxy reverso com HTTPS na frente do Express. Em produção, o frontend compilado e a API são servidos na mesma origem. `APP_URL` deve corresponder exatamente à origem externa: mutações exigem esse cabeçalho `Origin` e `Content-Type: application/json`. Scripts que consumirem a API também precisam enviar esses cabeçalhos e a sessão.

As sessões usam cookies HttpOnly, SameSite=Strict e Secure em produção; os tokens são armazenados somente como hash no banco. Há validação Zod, limitação de tentativas de autenticação/inscrição de convidados, Helmet e verificação de vínculo com grupo em cada operação protegida. Somente administradores agendam/cancelam partidas, compartilham convites e salvam sorteios. Não há configuração automática de `trust proxy`; ajuste-a para a topologia real antes de depender de limites por IP atrás de proxy. Sessões expiradas são recusadas imediatamente e removidas ao abrir novas sessões.

## Próximos módulos do original

- Caixa do grupo, despesas, mensalistas e marcação de pagamentos.
- Planos, assinaturas e integração Stripe.
- Relatórios e administração do sistema.
- Edição/exclusão de grupos e partidas e gerenciamento de papéis dos membros.
- Recuperação de senha, verificação de e-mail e edição de perfil.
- Partidas recorrentes, notificações, filas e uploads.
- Rotação/expiração dos convites e recuperação do acesso de cancelamento de convidados.

Nenhuma dessas integrações é simulada como se estivesse funcionando. Esta versão não importa dados do banco Laravel e não contém credenciais do projeto original.
