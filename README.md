# Mariana Couto Podologia

PWA para gerenciar agenda, prontuário e financeiro de atendimentos de
podologia em domicílio. Instalável no celular, com os dados sincronizados na
nuvem (Supabase) — a mesma conta (e-mail/senha) mostra os mesmos dados em
qualquer aparelho, em tempo real — e uma trava de PIN local por aparelho.

## Stack

- React + TypeScript + Vite
- `vite-plugin-pwa` (estratégia `injectManifest`) para o service worker e o manifest
- Supabase (Postgres + Auth + Realtime) como banco de dados na nuvem
- Dexie (IndexedDB) usado só como cache local: guarda o PIN/configurações do
  aparelho e um espelho de pacientes/consultas para o service worker
  conseguir checar lembretes sem depender de rede
- React Router (`HashRouter`) para navegação
- jsPDF para o relatório mensal exportável/compartilhável

## Configurando o banco de dados (Supabase) — necessário antes de usar

1. Crie uma conta gratuita em [supabase.com](https://supabase.com) e um novo
   projeto.
2. No painel do projeto, vá em **SQL Editor > New query**, cole todo o
   conteúdo de [`supabase/schema.sql`](./supabase/schema.sql) e clique em
   **Run**. Isso cria as tabelas, as regras de segurança (cada conta só vê os
   próprios dados) e habilita a sincronização em tempo real.
3. (Recomendado) Em **Authentication > Providers > Email**, desative
   "Confirm email" — como é um app de uso pessoal, isso evita o passo extra
   de confirmar por e-mail ao criar a conta pelo próprio app.
4. Em **Project Settings > Data API**, copie a **Project URL**. Em
   **Project Settings > API Keys**, copie a chave **anon public**.
5. Configure essas duas variáveis de ambiente:
   - Localmente: copie `.env.example` para `.env` e preencha.
   - Em produção (Vercel): **Project Settings > Environment Variables**,
     adicione `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` e faça um novo
     deploy.

Sem essas variáveis configuradas, o app mostra uma tela avisando que o banco
de dados não foi configurado, em vez de travar silenciosamente.

## Primeiro acesso

No primeiro aparelho, use a opção **"Criar conta"** na tela de entrada (só
e-mail e senha). Nos demais aparelhos, use **"Entrar"** com esse mesmo
e-mail e senha — os dados aparecem sincronizados automaticamente.

## Rodando localmente

```bash
npm install
npm run dev       # ambiente de desenvolvimento
npm run build     # build de produção em dist/
npm run preview   # serve o build de produção
```

## Notificações em segundo plano — limitações importantes

O app tenta lembrar cada consulta agendada **1 hora** e **30 minutos** antes do
horário, mesmo em segundo plano. Como não há servidor de Web Push, a entrega
em segundo plano é **melhor esforço**, não garantida:

- **Com o app aberto** (mesmo em outra aba/minimizado, mas processo do
  navegador vivo): confiável — um verificador roda a cada minuto e sincroniza
  o "já notificado" com a nuvem, para não repetir o aviso em outro aparelho.
- **Android/Chrome, app instalado**: usa `periodicSync` quando o navegador
  concede a permissão (depende de engajamento de uso; o Chrome decide o
  intervalo real).
- **iOS/Safari**: não há suporte a notificações em segundo plano para PWAs
  sem servidor push — os lembretes só chegam com o app aberto ou
  recentemente em uso.

Isso está documentado também dentro do app, na tela Configurações.

## PIN de acesso

- Criado obrigatoriamente no primeiro uso de cada aparelho (4 dígitos) — é
  uma trava de conveniência local, independente por aparelho.
- Pedido novamente sempre que o app é reaberto do zero (cold start) naquele
  aparelho; não é pedido ao apenas voltar de segundo plano.
- Pode ser trocado ou removido em Configurações sem precisar do PIN atual.
- "Esqueci meu PIN" não apaga dados: como eles vivem na conta na nuvem, essa
  opção apenas sai do aparelho e volta para a tela de entrar — é só logar de
  novo com e-mail e senha para recuperar tudo e criar um novo PIN.
- Apagar todos os dados de verdade (irreversível, em todos os aparelhos) só é
  possível autenticado, em Configurações > "Apagar todos os dados", com
  confirmação explícita.

## Estrutura

```
supabase/schema.sql  Tabelas, RLS e realtime — rode uma vez no SQL Editor do Supabase

src/
  db/            Schema Dexie (cache/PIN local) e tipos compartilhados
  lib/
    supabaseClient.ts     Cliente Supabase
    cloudRepo.ts           CRUD por entidade (Supabase) + espelho local
    useCloudCollection.ts  Hook genérico: fetch + realtime + espelho
    entityHooks.ts         usePatients/useTreatments/useAppointments/...
    localMigration.ts      Migra dados locais antigos para a nuvem (1x por aparelho)
    accountReset.ts        Sair da conta / apagar tudo
    notificationCheck.ts   Lógica dos lembretes (roda no app e no service worker)
  contexts/      Autenticação (Supabase), PIN/lock, toasts
  components/    Ícones e primitivos de UI compartilhados
  screens/       Entrar/Criar conta, Painel, Pacientes, Tratamentos, Agenda,
                 Financeiro, Relatório, Configurações
  sw.ts          Service worker (precache + verificação de lembretes)
```
