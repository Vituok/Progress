create extension if not exists pgcrypto;

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
create table public.exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  metric_type text not null check (metric_type in ('reps','weight_reps','duration')),
  created_at timestamptz not null default now(),
  unique(user_id,name)
);
create table public.workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  performed_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.workout_exercises (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid not null references public.workouts(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id),
  position integer not null check (position > 0),
  created_at timestamptz not null default now(),
  unique(workout_id,position)
);
create table public.sets (
  id uuid primary key default gen_random_uuid(),
  workout_exercise_id uuid not null references public.workout_exercises(id) on delete cascade,
  position integer not null check (position > 0),
  reps integer check (reps >= 0),
  weight numeric(8,2) check (weight >= 0),
  duration_seconds integer check (duration_seconds >= 0),
  created_at timestamptz not null default now(),
  unique(workout_exercise_id,position)
);

create index workouts_user_id_idx on public.workouts(user_id);
create index workouts_performed_at_idx on public.workouts(performed_at desc);
create index workout_exercises_workout_id_idx on public.workout_exercises(workout_id);
create index workout_exercises_exercise_id_idx on public.workout_exercises(exercise_id);
create index sets_workout_exercise_id_idx on public.sets(workout_exercise_id);

create function public.handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$
begin insert into public.users(id) values(new.id) on conflict do nothing; return new; end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();
insert into public.users(id) select id from auth.users on conflict do nothing;

create function public.touch_updated_at() returns trigger language plpgsql as $$ begin new.updated_at=now(); return new; end $$;
create trigger workouts_updated_at before update on public.workouts for each row execute function public.touch_updated_at();

alter table public.users enable row level security;
alter table public.exercises enable row level security;
alter table public.workouts enable row level security;
alter table public.workout_exercises enable row level security;
alter table public.sets enable row level security;

create policy "Users read self" on public.users for select using(id=auth.uid());
create policy "Users read own exercises" on public.exercises for select using(user_id=auth.uid());
create policy "Users create own exercises" on public.exercises for insert with check(user_id=auth.uid());
create policy "Users update own exercises" on public.exercises for update using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy "Users delete own exercises" on public.exercises for delete using(user_id=auth.uid());
create policy "Users read own workouts" on public.workouts for select using(user_id=auth.uid());
create policy "Users create own workouts" on public.workouts for insert with check(user_id=auth.uid());
create policy "Users update own workouts" on public.workouts for update using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy "Users delete own workouts" on public.workouts for delete using(user_id=auth.uid());
create policy "Users read own workout exercises" on public.workout_exercises for select using(exists(select 1 from public.workouts w where w.id=workout_id and w.user_id=auth.uid()));
create policy "Users create own workout exercises" on public.workout_exercises for insert with check(exists(select 1 from public.workouts w where w.id=workout_id and w.user_id=auth.uid()) and exists(select 1 from public.exercises e where e.id=exercise_id and e.user_id=auth.uid()));
create policy "Users read own sets" on public.sets for select using(exists(select 1 from public.workout_exercises we join public.workouts w on w.id=we.workout_id where we.id=workout_exercise_id and w.user_id=auth.uid()));
create policy "Users create own sets" on public.sets for insert with check(exists(select 1 from public.workout_exercises we join public.workouts w on w.id=we.workout_id where we.id=workout_exercise_id and w.user_id=auth.uid()));

create or replace function public.create_workout(payload jsonb) returns uuid
language plpgsql security invoker set search_path=public as $$
declare new_workout_id uuid; new_workout_exercise_id uuid; exercise_item jsonb; set_item jsonb; exercise_position int:=0; set_position int;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if jsonb_array_length(payload->'exercises')=0 then raise exception 'Workout needs at least one exercise'; end if;
  insert into workouts(user_id,performed_at) values(auth.uid(),(payload->>'performed_at')::timestamptz) returning id into new_workout_id;
  for exercise_item in select value from jsonb_array_elements(payload->'exercises') loop
    exercise_position:=exercise_position+1; set_position:=0;
    if jsonb_array_length(exercise_item->'sets')=0 then raise exception 'Exercise needs at least one set'; end if;
    insert into workout_exercises(workout_id,exercise_id,position) values(new_workout_id,(exercise_item->>'exercise_id')::uuid,exercise_position) returning id into new_workout_exercise_id;
    for set_item in select value from jsonb_array_elements(exercise_item->'sets') loop
      set_position:=set_position+1;
      insert into sets(workout_exercise_id,position,reps,weight,duration_seconds) values(new_workout_exercise_id,set_position,(set_item->>'reps')::int,(set_item->>'weight')::numeric,(set_item->>'duration_seconds')::int);
    end loop;
  end loop;
  return new_workout_id;
end $$;
grant execute on function public.create_workout(jsonb) to authenticated;
