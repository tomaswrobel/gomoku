create table profiles (
	id uuid primary key references auth.users (id) on delete cascade,
	discord_id text unique not null,
	display_name text not null,
	avatar_url text,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
	insert into profiles (id, discord_id, display_name, avatar_url)
	values (
		new.id,
		coalesce(new.raw_user_meta_data ->> 'provider_id', new.raw_user_meta_data ->> 'sub'),
		coalesce(
			new.raw_user_meta_data ->> 'full_name',
			new.raw_user_meta_data ->> 'name',
			'Player'
		),
		new.raw_user_meta_data ->> 'avatar_url'
	)
	on conflict (id) do update set
		display_name = excluded.display_name,
		avatar_url = excluded.avatar_url,
		updated_at = now();
	return new;
end;
$$;

create trigger on_auth_user_created
after insert or update on auth.users
for each row execute function handle_new_user();
