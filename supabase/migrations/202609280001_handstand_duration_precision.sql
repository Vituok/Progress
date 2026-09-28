alter table public.sets
  alter column duration_seconds type numeric(10,1)
  using duration_seconds::numeric(10,1);

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
      insert into sets(workout_exercise_id,position,reps,weight,duration_seconds) values(new_workout_exercise_id,set_position,(set_item->>'reps')::int,(set_item->>'weight')::numeric,(set_item->>'duration_seconds')::numeric(10,1));
    end loop;
  end loop;
  return new_workout_id;
end $$;

grant execute on function public.create_workout(jsonb) to authenticated;
