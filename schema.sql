create table projects (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users (id) on delete cascade not null,
  name text not null,
  form_data jsonb not null,
  results jsonb not null,
  created_at timestamptz default now()
); 