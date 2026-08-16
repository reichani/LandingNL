-- Bootstrap a LandingNL profile whenever a new Supabase Auth user is created.
-- Keep this trigger minimal: onboarding owns collection of student profile fields.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, first_name)
  values (
    new.id,
    nullif(coalesce(new.raw_user_meta_data ->> 'given_name', new.raw_user_meta_data ->> 'full_name'), '')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();
