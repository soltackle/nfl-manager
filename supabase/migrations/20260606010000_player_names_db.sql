CREATE TABLE IF NOT EXISTS public.player_names (
    id SERIAL PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL
);

-- Turn on RLS
ALTER TABLE public.player_names ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON public.player_names FOR SELECT USING (true);

-- Insert 100 sample names (combinations of first/last will yield 1000s)
INSERT INTO public.player_names (first_name, last_name) VALUES
('John', 'Smith'), ('Michael', 'Johnson'), ('David', 'Williams'), ('James', 'Brown'),
('Robert', 'Jones'), ('William', 'Garcia'), ('Joseph', 'Miller'), ('Richard', 'Davis'),
('Thomas', 'Rodriguez'), ('Charles', 'Martinez'), ('Daniel', 'Hernandez'), ('Matthew', 'Lopez'),
('Anthony', 'Gonzalez'), ('Mark', 'Wilson'), ('Donald', 'Anderson'), ('Steven', 'Thomas'),
('Paul', 'Taylor'), ('Andrew', 'Moore'), ('Joshua', 'Jackson'), ('Kenneth', 'Martin'),
('Kevin', 'Lee'), ('Brian', 'Perez'), ('George', 'Thompson'), ('Timothy', 'White'),
('Ronald', 'Harris'), ('Edward', 'Sanchez'), ('Jason', 'Clark'), ('Jeffrey', 'Ramirez'),
('Ryan', 'Lewis'), ('Jacob', 'Robinson'), ('Gary', 'Walker'), ('Nicholas', 'Young'),
('Eric', 'Allen'), ('Jonathan', 'King'), ('Stephen', 'Wright'), ('Larry', 'Scott'),
('Justin', 'Torres'), ('Scott', 'Nguyen'), ('Brandon', 'Hill'), ('Benjamin', 'Flores'),
('Samuel', 'Green'), ('Gregory', 'Adams'), ('Frank', 'Nelson'), ('Alexander', 'Baker'),
('Raymond', 'Hall'), ('Patrick', 'Rivera'), ('Jack', 'Campbell'), ('Dennis', 'Mitchell'),
('Jerry', 'Carter'), ('Tyler', 'Roberts'), ('Aaron', 'Gomez'), ('Jose', 'Phillips'),
('Adam', 'Evans'), ('Henry', 'Turner'), ('Nathan', 'Diaz'), ('Douglas', 'Parker'),
('Zachary', 'Cruz'), ('Peter', 'Edwards'), ('Kyle', 'Collins'), ('Walter', 'Reyes'),
('Ethan', 'Stewart'), ('Jeremy', 'Morris'), ('Harold', 'Morales'), ('Keith', 'Murphy'),
('Christian', 'Cook'), ('Roger', 'Rogers'), ('Noah', 'Gutierrez'), ('Gerald', 'Ortiz'),
('Carl', 'Morgan'), ('Terry', 'Cooper'), ('Sean', 'Peterson'), ('Austin', 'Bailey'),
('Arthur', 'Reed'), ('Lawrence', 'Kelly'), ('Jesse', 'Howard'), ('Dylan', 'Ramos'),
('Bryan', 'Kim'), ('Joe', 'Cox'), ('Jordan', 'Ward'), ('Billy', 'Richardson'),
('Bruce', 'Watson'), ('Albert', 'Brooks'), ('Willie', 'Chavez'), ('Gabriel', 'Wood'),
('Logan', 'James'), ('Alan', 'Bennett'), ('Juan', 'Gray'), ('Wayne', 'Mendoza'),
('Roy', 'Ruiz'), ('Ralph', 'Hughes'), ('Randy', 'Price'), ('Eugene', 'Alvarez'),
('Vincent', 'Castillo'), ('Russell', 'Sanders'), ('Elijah', 'Patel'), ('Louis', 'Myers'),
('Bobby', 'Long'), ('Philip', 'Ross'), ('Johnny', 'Foster'), ('Bradley', 'Jimenez');

-- Delete all existing players
DELETE FROM public.players;

-- Delete tactics as their player references are now invalid
DELETE FROM public.tactics;
