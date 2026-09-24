-- À exécuter une seule fois dans Supabase (SQL Editor).
-- 1. Ajoute le semestre (1 à 6) à chaque matière.
alter table public.courses
  add column if not exists semester smallint check (semester between 1 and 6);

-- 2. Les matières déjà créées sont rangées dans le 1er semestre de leur niveau
--    (L1 -> S1, L2 -> S3, L3 -> S5). Vous pourrez les déplacer ensuite.
update public.courses
set semester = case level when 'L1' then 1 when 'L2' then 3 when 'L3' then 5 end
where semester is null;
