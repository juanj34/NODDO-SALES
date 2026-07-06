-- Per-etapa delivery date + payment plan params for the delivery calculator.
alter table torres
  add column if not exists fecha_entrega date,
  add column if not exists plan_pct_inicial numeric,
  add column if not exists plan_separacion_tipo text check (plan_separacion_tipo in ('porcentaje','fijo')),
  add column if not exists plan_separacion_valor numeric;
