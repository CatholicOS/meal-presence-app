-- Community language and time zone (Impostazioni). The language is only a default: each visitor
-- can pick their own from the menu (a cookie). The time zone decides "today" and the cutoffs.
insert into settings (key, value) values
  ('default_locale', '"it"'),
  ('time_zone',      '"Europe/Rome"')
on conflict (key) do nothing;

-- Same as before, but in the configured time zone instead of a hardcoded Europe/Rome.
-- A name Postgres does not know falls back to Europe/Rome rather than failing every save.
create or replace function is_locked(p_date date, p_meal meal_t, p_now timestamptz default now()) returns boolean
language plpgsql stable as $$
declare
  v_tz     text := coalesce((select value #>> '{}' from settings where key = 'time_zone'), 'Europe/Rome');
  v_local  timestamp;
  v_today  date;
  v_cutoff time;
begin
  begin
    v_local := p_now at time zone v_tz;
  exception when invalid_parameter_value then
    v_local := p_now at time zone 'Europe/Rome';
  end;
  v_today := v_local::date;
  select (value #>> '{}')::time into v_cutoff
    from settings
   where key = case when p_meal = 'lunch' then 'lunch_cutoff' else 'dinner_cutoff' end;
  if v_cutoff is null then v_cutoff := time '10:00'; end if;
  return p_date < v_today or (p_date = v_today and v_local::time >= v_cutoff);
end $$;
