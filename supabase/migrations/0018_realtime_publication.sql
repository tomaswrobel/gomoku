-- Postgres Changes only broadcasts for tables added to the supabase_realtime publication;
-- subscribeToGame.ts's channel connects fine either way, but silently receives nothing without
-- this, so moves/game-status updates only ever showed up after a manual page refresh.
alter publication supabase_realtime add table games;
alter publication supabase_realtime add table moves;
