# Progress

A focused workout logger built with React, Vite, and Supabase.

## Setup

1. Create a Supabase project.
2. In Supabase Authentication settings, enable **Anonymous Sign-Ins**.
3. Run `supabase/migrations/202609260001_initial_schema.sql` in the Supabase SQL editor.
4. Copy `.env.example` to `.env.local` and add the project URL and anon key.
5. Run `npm install` and `npm run dev`.

The first session automatically creates Pull-ups, Push-ups, Seated Cable Row, and Handstand for the anonymous user. Workout drafts stay in React state and the `create_workout` database function saves the workout, exercises, and sets in one transaction.
