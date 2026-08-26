-- Supabase installs pgcrypto into the `extensions` schema, not `public`; nanoid() had no
-- search_path set, so gen_random_bytes() didn't resolve (error 42883). Fixes 0002_id_generation.sql.

create or replace function nanoid(size int default 12)
returns text
language plpgsql
volatile
set search_path = public, extensions
as $$
declare
	alphabet text := '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
	alphabet_length int := length(alphabet);
	id text := '';
	bytes bytea;
	i int;
begin
	bytes := gen_random_bytes(size);
	for i in 0..size - 1 loop
		id := id || substr(alphabet, (get_byte(bytes, i) % alphabet_length) + 1, 1);
	end loop;
	return id;
end;
$$;
