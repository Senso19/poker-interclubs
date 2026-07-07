-- À exécuter dans Supabase : Project > SQL Editor > New query

create extension if not exists "pgcrypto";

-- Clubs -----------------------------------------------------------------
create table if not exists clubs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  logo_url text
);

insert into clubs (name, slug, logo_url) values
  ('HPCL', 'hpcl', '/logos/hpcl.jpg'),
  ('19PokerClub', '19pokerclub', '/logos/19pokerclub.png'),
  ('OPC', 'opc', '/logos/opc.png'),
  ('Les Lottois', 'les-lottois', '/logos/les-lottois.jpg')
on conflict (slug) do nothing;

-- Si les clubs existaient déjà (installation précédente), exécutez aussi :
-- update clubs set logo_url = '/logos/hpcl.jpg' where slug = 'hpcl';
-- update clubs set logo_url = '/logos/19pokerclub.png' where slug = '19pokerclub';
-- update clubs set logo_url = '/logos/opc.png' where slug = 'opc';
-- update clubs set logo_url = '/logos/les-lottois.jpg' where slug = 'les-lottois';

-- Comptes administrateurs -------------------------------------------------
-- role: 'main' (administrateur principal, club_id = null) ou 'secondary' (rattaché à un club)
create table if not exists admins (
  id uuid primary key default gen_random_uuid(),
  username text unique not null,
  password text not null,
  role text not null check (role in ('main', 'secondary')),
  club_id uuid references clubs(id) on delete cascade
);

-- Compte principal par défaut : à changer immédiatement après la première connexion.
insert into admins (username, password, role, club_id) values
  ('frederic', 'changez-moi', 'main', null)
on conflict (username) do nothing;

-- Joueurs -----------------------------------------------------------------
create table if not exists players (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  pseudo text,
  club_id uuid references clubs(id) on delete cascade
);

-- Si la table existait déjà (installation précédente), exécutez aussi :
-- alter table players add column if not exists pseudo text;

-- Tournois (étapes) --------------------------------------------------------
create table if not exists tournaments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  date date not null,
  location text,
  status text not null default 'a_venir' check (status in ('a_venir', 'en_cours', 'termine')),
  blindvalet_tourn_id text
);

-- Si la table existait déjà (installation précédente), exécutez aussi :
-- alter table tournaments add column if not exists blindvalet_tourn_id text;

-- Inscriptions : les 10 joueurs d'un club pour un tournoi donné --------------
create table if not exists registrations (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid references tournaments(id) on delete cascade,
  club_id uuid references clubs(id) on delete cascade,
  player_id uuid references players(id) on delete cascade,
  unique (tournament_id, player_id)
);

-- Résultats par étape : position + nombre de KO -----------------------------
create table if not exists results (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid references tournaments(id) on delete cascade,
  player_id uuid references players(id) on delete cascade,
  position int not null,
  ko_count int not null default 0,
  unique (tournament_id, player_id)
);

-- Barème de points, une seule ligne éditable depuis la page Classements -----
create table if not exists points_formula (
  id uuid primary key default '00000000-0000-0000-0000-000000000001',
  config jsonb not null
);

-- Tirage des tables/sièges par étape --------------------------------------
create table if not exists seatings (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid references tournaments(id) on delete cascade,
  player_id uuid references players(id) on delete cascade,
  table_number int not null,
  seat_number int,
  unique (tournament_id, player_id)
);

-- Si votre base existait déjà, ce bloc suffit à lui seul pour ajouter la
-- fonctionnalité de tirage des tables (pas besoin de rejouer tout le script) :
-- create table if not exists seatings (
--   id uuid primary key default gen_random_uuid(),
--   tournament_id uuid references tournaments(id) on delete cascade,
--   player_id uuid references players(id) on delete cascade,
--   table_number int not null,
--   seat_number int,
--   unique (tournament_id, player_id)
-- );
-- alter table seatings enable row level security;
-- create policy "public read seatings" on seatings for select using (true);
-- create policy "public write seatings" on seatings for all using (true) with check (true);

insert into points_formula (id, config) values (
  '00000000-0000-0000-0000-000000000001',
  '{
    "positions": [
      {"position":1,"points":20},{"position":2,"points":16},{"position":3,"points":14},
      {"position":4,"points":12},{"position":5,"points":10},{"position":6,"points":8},
      {"position":7,"points":6},{"position":8,"points":4},{"position":9,"points":2},{"position":10,"points":1}
    ],
    "pointsParKO": 1,
    "koExponent": 1,
    "pointsParticipation": 0
  }'::jsonb
) on conflict (id) do nothing;

-- Si la ligne existait déjà (installation précédente), exécutez aussi pour ajouter l'exposant KO :
-- update points_formula set config = config || '{"koExponent": 1}'::jsonb
--   where id = '00000000-0000-0000-0000-000000000001';

-- Row Level Security --------------------------------------------------------
-- Le site utilise une authentification applicative simple (table `admins`),
-- pas l'authentification Supabase native. On ouvre donc l'accès via la clé
-- anonyme et on gère les permissions dans l'interface (comme vos autres apps
-- Mission Agglo / Trombinoscope). Si vous exposez ce site publiquement et
-- souhaitez davantage de rigueur, envisagez des policies plus fines ou de
-- migrer vers Supabase Auth.
alter table clubs enable row level security;
alter table admins enable row level security;
alter table players enable row level security;
alter table tournaments enable row level security;
alter table registrations enable row level security;
alter table results enable row level security;
alter table points_formula enable row level security;
alter table seatings enable row level security;

create policy "public read clubs" on clubs for select using (true);
create policy "public read admins" on admins for select using (true);
create policy "public write admins" on admins for all using (true) with check (true);
create policy "public read players" on players for select using (true);
create policy "public write players" on players for all using (true) with check (true);
create policy "public read tournaments" on tournaments for select using (true);
create policy "public write tournaments" on tournaments for all using (true) with check (true);
create policy "public read registrations" on registrations for select using (true);
create policy "public write registrations" on registrations for all using (true) with check (true);
create policy "public read results" on results for select using (true);
create policy "public write results" on results for all using (true) with check (true);
create policy "public read points_formula" on points_formula for select using (true);
create policy "public write points_formula" on points_formula for all using (true) with check (true);
create policy "public read seatings" on seatings for select using (true);
create policy "public write seatings" on seatings for all using (true) with check (true);
