insert into tables (id, label) values
	(1, 'Table 1'),
	(2, 'Table 2'),
	(3, 'Table 3'),
	(4, 'Table 4'),
	(5, 'Table 5')
on conflict (id) do nothing;
