-- Filtr rozpoczętych konfiguracji po dniu (strefa Europe/Warsaw)

drop function if exists public.admin_configurator_analytics();

create or replace function public.admin_configurator_analytics(p_started_day date default null)
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

  if p_started_day is null then
    select count(*) into v_started from public.configurator_sessions;
  else
    select count(*) into v_started
    from public.configurator_sessions
    where (started_at at time zone 'Europe/Warsaw')::date = p_started_day;
  end if;

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

revoke all on function public.admin_configurator_analytics(date) from public;
grant execute on function public.admin_configurator_analytics(date) to authenticated;
