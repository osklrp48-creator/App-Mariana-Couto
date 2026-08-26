# Mariana Couto Podologia

PWA pessoal (um único usuário) para gerenciar agenda, prontuário e financeiro de
atendimentos de podologia em domicílio. Instalável no celular, com dados
guardados apenas no aparelho (IndexedDB) e trava de PIN local.

## Stack

- React + TypeScript + Vite
- `vite-plugin-pwa` (estratégia `injectManifest`) para o service worker e o manifest
- Dexie (IndexedDB) para persistência local
- React Router (`HashRouter`) para navegação
- jsPDF para o relatório mensal exportável/compartilhável

## Rodando localmente

```bash
npm install
npm run dev       # ambiente de desenvolvimento
npm run build     # build de produção em dist/
npm run preview   # serve o build de produção
```

## Notificações em segundo plano — limitações importantes

O app tenta lembrar cada consulta agendada **1 hora** e **30 minutos** antes do
horário, mesmo em segundo plano. Como este é um app sem servidor (sem Web
Push), a entrega em segundo plano é **melhor esforço**, não garantida:

- **Com o app aberto** (mesmo em outra aba/minimizado, mas processo do
  navegador vivo): confiável — um verificador roda a cada minuto.
- **Android/Chrome, app instalado**: usa `periodicSync` quando o navegador
  concede a permissão (depende de engajamento de uso; o Chrome decide o
  intervalo real).
- **iOS/Safari**: não há suporte a notificações em segundo plano para PWAs
  sem servidor push — os lembretes só chegam com o app aberto ou
  recentemente em uso.

Isso está documentado também dentro do app, na tela Configurações.

## PIN de acesso

- Criado obrigatoriamente no primeiro uso (4 dígitos).
- Pedido novamente sempre que o app é reaberto do zero (cold start); não é
  pedido ao apenas voltar de segundo plano.
- Pode ser trocado ou removido em Configurações sem precisar do PIN atual.
- Não há recuperação de PIN esquecido — a única saída é apagar todos os
  dados do aparelho (fluxo com confirmação explícita).

## Estrutura

```
src/
  db/            Schema Dexie (IndexedDB) e tipos
  lib/           Formatação, PIN, telefone, período, PDF, notificações
  contexts/      PIN/lock e toasts
  components/    Ícones e primitivos de UI compartilhados
  screens/       Painel, Pacientes, Tratamentos, Agenda, Financeiro,
                 Relatório, Configurações
  sw.ts          Service worker (precache + verificação de lembretes)
```
