insert into public.exercises (user_id, name, metric_type)
select users.id, exercise.name, 'weight_reps'
from public.users
cross join (values
  ('Leg Extension'),
  ('Leg Curl'),
  ('Chest Decline')
) as exercise(name)
on conflict (user_id, name) do nothing;
