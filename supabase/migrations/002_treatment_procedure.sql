-- Migração: tratamentos deixam de ter um valor fixo e passam a ter um
-- campo de texto "Procedimento". Rode isso uma vez no SQL Editor do
-- Supabase (Projeto > SQL Editor > New query), caso seu banco já exista
-- de antes dessa mudança (criado com o supabase/schema.sql original).
--
-- Não é destrutivo: a coluna antiga "default_value" continua no banco,
-- só deixa de ser usada pelo app.

alter table public.treatments
  add column if not exists procedure text not null default '';
