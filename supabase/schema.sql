-- Forge Master veritabanı şeması (Supabase → SQL Editor → New query → hepsini yapıştır → Run).
-- Birden fazla kez çalıştırılabilir.
--
-- players: her hesap için bir satır (takma ad, güç puanı, oyun kaydı)
-- scores:  dönemlik puanlar ('W2026-42' hafta, 'M2026-10' ay, 'Y2026' yıl, 'all' genel)
-- İstemci tablolara doğrudan yazmaz; aşağıdaki fonksiyonları (RPC) çağırır.

create table if not exists public.players (
  id uuid primary key references auth.users (id) on delete cascade,
  nickname text check (nickname is null or char_length(nickname) between 3 and 16),
  power bigint not null default 0,
  save jsonb,
  save_rev bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists players_nickname_lower on public.players (lower(nickname));

create table if not exists public.scores (
  player_id uuid not null references public.players (id) on delete cascade,
  period text not null,
  points bigint not null default 0,
  updated_at timestamptz not null default now(),
  primary key (player_id, period)
);
create index if not exists scores_period_points on public.scores (period, points desc);

alter table public.players enable row level security;
alter table public.scores enable row level security;

-- oyuncu yalnız kendi satırını okuyabilir; yazma yalnız fonksiyonlarla
drop policy if exists players_own_read on public.players;
create policy players_own_read on public.players for select to authenticated using (auth.uid() = id);
drop policy if exists scores_own_read on public.scores;
create policy scores_own_read on public.scores for select to authenticated using (auth.uid() = player_id);

-- dönem anahtarı (UTC; hafta pazartesi başlar)
create or replace function public.period_key(p text, t timestamptz default now())
returns text language sql stable as $$
  select case p
    when 'week'  then to_char(t at time zone 'utc', 'IYYY') || '-W' || to_char(t at time zone 'utc', 'IW')
    when 'month' then 'M' || to_char(t at time zone 'utc', 'YYYY-MM')
    when 'year'  then 'Y' || to_char(t at time zone 'utc', 'YYYY')
    else 'all' end
$$;

-- Kaydı yükler ve güç artışını dönem puanlarına ekler.
-- p_rev: istemcinin kayıt sayacı. Sunucudaki daha yeniyse kayıt ezilmez ve {ok:false} döner.
create or replace function public.sync_player(p_save jsonb, p_rev bigint, p_power bigint)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  cur public.players;
  delta bigint;
begin
  if uid is null then raise exception 'not signed in'; end if;
  insert into public.players (id) values (uid) on conflict (id) do nothing;
  select * into cur from public.players where id = uid for update;
  if p_rev < cur.save_rev then
    return jsonb_build_object('ok', false, 'rev', cur.save_rev);
  end if;
  -- tek seferde makul olmayan sıçramalar sayılmaz
  delta := least(greatest(p_power - cur.power, 0), 5000000);
  -- güç yalnız artar (eski bir kayıt gelirse aynı artış dönem puanına iki kez eklenmesin);
  -- ilerleme sıfırlanınca (kayıt boş) baştan başlar
  update public.players
     set save = p_save, save_rev = p_rev, updated_at = now(),
         power = case when p_save is null then greatest(p_power, 0) else greatest(cur.power, p_power) end
   where id = uid;
  if delta > 0 then
    insert into public.scores (player_id, period, points)
    select uid, k, delta from unnest(array[period_key('week'), period_key('month'), period_key('year'), 'all']) as k
    on conflict (player_id, period) do update set points = scores.points + excluded.points, updated_at = now();
  end if;
  return jsonb_build_object('ok', true, 'rev', p_rev);
end $$;

-- Hesabın kaydını getirir (yoksa boş)
create or replace function public.load_player()
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object('save', save, 'rev', save_rev, 'nickname', nickname, 'power', power)
    from public.players where id = auth.uid()
$$;

-- Takma ad: 3-16 karakter, harf/rakam/boşluk/_-. ; başkası aldıysa 'taken'
create or replace function public.set_nickname(n text)
returns text language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  v text := btrim(regexp_replace(n, '\s+', ' ', 'g'));
begin
  if uid is null then raise exception 'not signed in'; end if;
  if char_length(v) < 3 or char_length(v) > 16 or v !~ '^[[:alnum:] _.-]+$' then return 'invalid'; end if;
  insert into public.players (id) values (uid) on conflict (id) do nothing;
  begin
    update public.players set nickname = v, updated_at = now() where id = uid;
  exception when unique_violation then
    return 'taken';
  end;
  return 'ok';
end $$;

-- Sıralama: p = 'week' | 'month' | 'year' | 'all'
create or replace function public.leaderboard(p text, lim int default 50)
returns table (rank bigint, nickname text, points bigint, me boolean)
language sql stable security definer set search_path = public as $$
  select rank() over (order by s.points desc), pl.nickname, s.points, s.player_id = auth.uid()
    from public.scores s join public.players pl on pl.id = s.player_id
   where s.period = period_key(p) and s.points > 0 and pl.nickname is not null
   order by s.points desc
   limit least(greatest(lim, 1), 100)
$$;

-- Oyuncunun kendi sırası
create or replace function public.my_rank(p text)
returns table (rank bigint, points bigint)
language sql stable security definer set search_path = public as $$
  select (select count(*) from public.scores s2 join public.players p2 on p2.id = s2.player_id
           where s2.period = s.period and s2.points > s.points and p2.nickname is not null) + 1,
         s.points
    from public.scores s
   where s.player_id = auth.uid() and s.period = period_key(p)
$$;

-- Hesabı ve bütün verilerini siler (Google Play hesap silme şartı)
create or replace function public.delete_account()
returns void language sql security definer set search_path = public, auth as $$
  delete from auth.users where id = auth.uid();
$$;

revoke all on function public.sync_player(jsonb, bigint, bigint) from public, anon;
revoke all on function public.load_player() from public, anon;
revoke all on function public.set_nickname(text) from public, anon;
revoke all on function public.leaderboard(text, int) from public, anon;
revoke all on function public.my_rank(text) from public, anon;
revoke all on function public.delete_account() from public, anon;
grant execute on function public.sync_player(jsonb, bigint, bigint) to authenticated;
grant execute on function public.load_player() to authenticated;
grant execute on function public.set_nickname(text) to authenticated;
grant execute on function public.leaderboard(text, int) to authenticated;
grant execute on function public.my_rank(text) to authenticated;
grant execute on function public.delete_account() to authenticated;
