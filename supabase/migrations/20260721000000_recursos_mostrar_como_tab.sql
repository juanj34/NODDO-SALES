-- Resources flagged as tabs get their own nav entry on the microsite (viewer tab).
alter table recursos add column if not exists mostrar_como_tab boolean not null default false;
