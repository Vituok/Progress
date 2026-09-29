create policy "Users update own workout exercises"
on public.workout_exercises for update
using (
  exists (
    select 1 from public.workouts w
    where w.id = workout_id and w.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.workouts w
    where w.id = workout_id and w.user_id = auth.uid()
  )
  and exists (
    select 1 from public.exercises e
    where e.id = exercise_id and e.user_id = auth.uid()
  )
);

create policy "Users delete own workout exercises"
on public.workout_exercises for delete
using (
  exists (
    select 1 from public.workouts w
    where w.id = workout_id and w.user_id = auth.uid()
  )
);

create policy "Users update own sets"
on public.sets for update
using (
  exists (
    select 1
    from public.workout_exercises we
    join public.workouts w on w.id = we.workout_id
    where we.id = workout_exercise_id and w.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.workout_exercises we
    join public.workouts w on w.id = we.workout_id
    where we.id = workout_exercise_id and w.user_id = auth.uid()
  )
);

create policy "Users delete own sets"
on public.sets for delete
using (
  exists (
    select 1
    from public.workout_exercises we
    join public.workouts w on w.id = we.workout_id
    where we.id = workout_exercise_id and w.user_id = auth.uid()
  )
);
