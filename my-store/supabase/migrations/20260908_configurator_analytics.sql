-- PetTagi — analityka konfiguratora (lejek kroków, czasy, wybory)

create table if not exists public.configurator_sessions (
  id uuid primary key default gen_random_uuid(),
  client_session_id text not null unique,
  product_slug text not null,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  converted_at timestamptz,
  total_duration_ms integer
);

create table if not exists public.configurator_step_events (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.configurator_sessions(id) on delete cascade,
  step_key text not null,
  step_label text not null,
  step_index integer not null,
  entered_at timestamptz not null default now(),
  duration_ms integer
);

create index if not exists configurator_step_events_session_idx
  on public.configurator_step_events (session_id);

create index if not exists configurator_step_events_step_key_idx
  on public.configurator_step_events (step_key);

create table if not exists public.configurator_choice_events (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.configurator_sessions(id) on delete cascade,
  step_key text not null,
  step_label text not null,
  choice_key text not null,
  choice_value text not null,
  created_at timestamptz not null default now()
);

create index if not exists configurator_choice_events_step_idx
  on public.configurator_choice_events (step_key, choice_key);

alter table public.configurator_sessions enable row level security;
alter table public.configurator_step_events enable row level security;
alter table public.configurator_choice_events enable row level security;

create or replace function public.track_configurator_event(p_payload jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_client_session_id text;
  v_event_type text;
  v_session_id uuid;
  v_choice jsonb;
begin
  v_client_session_id := nullif(trim(p_payload->>'clientSessionId'), '');
  v_event_type := nullif(trim(p_payload->>'eventType'), '');
  if v_client_session_id is null or v_event_type is null then
    return;
  end if;

  if v_event_type = 'session_start' then
    insert into public.configurator_sessions (client_session_id, product_slug)
    values (v_client_session_id, coalesce(nullif(trim(p_payload->>'productSlug'), ''), 'unknown'))
    on conflict (client_session_id) do update
      set product_slug = excluded.product_slug;
    return;
  end if;

  select id into v_session_id
  from public.configurator_sessions
  where client_session_id = v_client_session_id;

  if v_session_id is null then
    insert into public.configurator_sessions (client_session_id, product_slug)
    values (v_client_session_id, coalesce(nullif(trim(p_payload->>'productSlug'), ''), 'unknown'))
    returning id into v_session_id;
  end if;

  if v_event_type = 'step_enter' then
    insert into public.configurator_step_events (session_id, step_key, step_label, step_index)
    values (
      v_session_id,
      coalesce(nullif(trim(p_payload->>'stepKey'), ''), 'unknown'),
      coalesce(nullif(trim(p_payload->>'stepLabel'), ''), 'Krok'),
      coalesce((p_payload->>'stepIndex')::integer, 0)
    );
    return;
  end if;

  if v_event_type = 'step_leave' then
    insert into public.configurator_step_events (
      session_id,
      step_key,
      step_label,
      step_index,
      duration_ms
    )
    values (
      v_session_id,
      coalesce(nullif(trim(p_payload->>'stepKey'), ''), 'unknown'),
      coalesce(nullif(trim(p_payload->>'stepLabel'), ''), 'Krok'),
      coalesce((p_payload->>'stepIndex')::integer, 0),
      greatest(coalesce((p_payload->>'durationMs')::integer, 0), 0)
    );

    for v_choice in
      select * from jsonb_array_elements(coalesce(p_payload->'choices', '[]'::jsonb))
    loop
      insert into public.configurator_choice_events (
        session_id,
        step_key,
        step_label,
        choice_key,
        choice_value
      )
      values (
        v_session_id,
        coalesce(nullif(trim(p_payload->>'stepKey'), ''), 'unknown'),
        coalesce(nullif(trim(p_payload->>'stepLabel'), ''), 'Krok'),
        coalesce(nullif(trim(v_choice->>'choiceKey'), ''), 'wybor'),
        left(coalesce(nullif(trim(v_choice->>'choiceValue'), ''), '—'), 240)
      );
    end loop;
    return;
  end if;

  if v_event_type = 'cart_add' then
    update public.configurator_sessions
    set completed_at = coalesce(completed_at, now())
    where id = v_session_id;
    return;
  end if;

  if v_event_type = 'order_placed' then
    update public.configurator_sessions
    set
      converted_at = coalesce(converted_at, now()),
      completed_at = coalesce(completed_at, now()),
      total_duration_ms = coalesce(
        total_duration_ms,
        greatest(
          floor(extract(epoch from (now() - started_at)) * 1000)::integer,
          0
        )
      )
    where id = v_session_id;
  end if;
end;
$$;

create or replace function public.admin_configurator_analytics()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_started integer;
  v_converted integer;
  v_avg_completion_ms numeric;
  v_conversion_rate numeric;
begin
  perform public.assert_admin();

  select count(*) into v_started from public.configurator_sessions;
  select count(*) into v_converted from public.configurator_sessions where converted_at is not null;

  select coalesce(avg(total_duration_ms), 0)
  into v_avg_completion_ms
  from public.configurator_sessions
  where converted_at is not null and total_duration_ms is not null;

  v_conversion_rate := case
    when v_started > 0 then round((v_converted::numeric / v_started::numeric) * 100, 1)
    else 0
  end;

  return jsonb_build_object(
    'startedSessions', v_started,
    'convertedSessions', v_converted,
    'avgCompletionMs', coalesce(v_avg_completion_ms, 0),
    'conversionRate', v_conversion_rate,
    'funnel', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'stepKey', step_key,
          'stepLabel', step_label,
          'stepIndex', step_index,
          'users', users,
          'avgDurationMs', avg_duration_ms,
          'dropOffRate', drop_off_rate
        )
        order by step_index
      )
      from (
        select
          e.step_key,
          max(e.step_label) as step_label,
          min(e.step_index) as step_index,
          count(distinct e.session_id) as users,
          coalesce(round(avg(nullif(e.duration_ms, 0))), 0) as avg_duration_ms,
          case
            when lag(count(distinct e.session_id)) over (order by min(e.step_index)) is null then null
            when lag(count(distinct e.session_id)) over (order by min(e.step_index)) = 0 then null
            else round(
              (
                (
                  lag(count(distinct e.session_id)) over (order by min(e.step_index))
                  - count(distinct e.session_id)
                )::numeric
                / lag(count(distinct e.session_id)) over (order by min(e.step_index))::numeric
              ) * 100,
              1
            )
          end as drop_off_rate
        from public.configurator_step_events e
        group by e.step_key
      ) funnel_rows
    ), '[]'::jsonb),
    'choices', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'stepKey', step_key,
          'stepLabel', step_label,
          'choiceKey', choice_key,
          'choiceValue', choice_value,
          'count', choice_count
        )
        order by step_key, choice_count desc, choice_key, choice_value
      )
      from (
        select
          step_key,
          max(step_label) as step_label,
          choice_key,
          choice_value,
          count(*) as choice_count
        from public.configurator_choice_events
        group by step_key, choice_key, choice_value
      ) choice_rows
    ), '[]'::jsonb)
  );
end;
$$;

revoke all on function public.track_configurator_event(jsonb) from public;
grant execute on function public.track_configurator_event(jsonb) to anon, authenticated;

revoke all on function public.admin_configurator_analytics() from public;
grant execute on function public.admin_configurator_analytics() to authenticated;
