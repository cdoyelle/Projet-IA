# TaskFlow mobile — Story 1.1

This Expo application is separate from the repository's Next.js starter.

## Configuration

Copy `.env.example` to `.env` and set the Supabase project URL and publishable (or anon) key. The mobile app only uses this public key; never add a service-role key to the app.

Install dependencies and start Expo from this directory:

```sh
npm install
npm run start
```

## Supabase setup

1. Apply `supabase/migrations/202611090001_story_1_1_demo_accounts.sql`.
2. Provision the first administrator in Supabase Auth, then set that profile's role to `admin` from the Supabase SQL editor. For example, replace the address below with the provisioned administrator's address:

   ```sql
   update public.profiles
   set role = 'admin'
   where id = (select id from auth.users where lower(email) = lower('admin@example.test'));
   ```

3. Configure the `SUPABASE_SERVICE_ROLE_KEY` Edge Function secret and deploy `supabase/functions/admin-accounts`.

The migration creates profiles for Auth users that already exist and gives new Auth users a member profile. Role changes are server-side administration only. Account creation uses the Auth admin API with email confirmation and sends no email.
