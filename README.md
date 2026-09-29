# Progress

A focused workout logger built with React, Vite, and Supabase.

## Setup

1. Create a Supabase project.
2. In Supabase Authentication settings, enable **Anonymous Sign-Ins**, **Email**, and **Google**. Configure the Google client ID and secret in Supabase.
3. Add `http://localhost:5173/**` and the production Vercel URL (for example `https://your-app.vercel.app/**`) to the Supabase Auth redirect allow-list. The app sends users back to the current origin automatically.
4. Run every SQL file in `supabase/migrations` in filename order.
5. Copy `.env.example` to `.env.local` and add the project URL and anon key.
6. Run `npm install` and `npm run dev`.

Users can continue with Google, an email magic link, or an explicitly requested anonymous account. Supabase persists and restores the session. Anonymous users can link Google or add an email from Profile without changing their user UUID, so existing workout ownership remains intact. Workout drafts stay in React state and the `create_workout` database function saves the workout, exercises, and sets in one transaction.
 .
