create type opening_rule as enum ('swap2', 'standard');
create type seat_color as enum ('Black', 'White');
create type game_status as enum ('waiting', 'active', 'finished', 'aborted');
create type game_result as enum ('win', 'draw');
create type time_control as enum ('15', '30', '60');
create type game_kind as enum ('1v1', 'room');
