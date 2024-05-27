DROP TYPE IF EXISTS gen_carti;
DROP TYPE IF EXISTS editura_carti;

CREATE TYPE gen_carti AS ENUM('fantasy', 'sf', 'fictiune', 'romance', 'mystery', 'crima', 'horror', 'beletristica', 'scoala');
CREATE TYPE editura_carti AS ENUM( 'leda edge', 'nemira', 'paralela 45','TREI', 'arthur');


CREATE TABLE IF NOT EXISTS carti (
   id serial PRIMARY KEY,
   titlu VARCHAR(50) UNIQUE NOT NULL,
   descriere TEXT,
   pret NUMERIC(8,2) NOT NULL,
   nr_pagini INT NOT NULL CHECK(nr_pagini >= 0),  
   gen gen_carti DEFAULT 'fantasy',
   editura editura_carti DEFAULT 'leda edge',
   autor VARCHAR(50),
   cuvinte_cheie VARCHAR[],
   coperta_cartonata BOOLEAN NOT NULL DEFAULT FALSE,
   imagine VARCHAR(300),
   data_adaugare TIMESTAMP DEFAULT current_timestamp
);

INSERT INTO carti (titlu, descriere, pret, nr_pagini, gen, editura, autor, cuvinte_cheie, coperta_cartonata, imagine) VALUES 
('Jocurile foamei', 'O poveste captivantă într-un viitor distopic', 45.99, 384, 'sf', 'nemira', 'Suzanne Collins', ARRAY['distopie', 'aventura'], TRUE, 'jocurile-foamei.jpg'),
('Cronicile din Narnia', 'Aventuri fantastice într-o lume magică', 55.50, 778, 'fantasy', 'arthur', 'C.S. Lewis', ARRAY['magie', 'aventura'], TRUE, 'cronicile.jpg'),
('Harry Potter și Piatra Filosofală', 'Primul volum din seria Harry Potter', 60.00, 320, 'fantasy', 'arthur', 'J.K. Rowling', ARRAY['magie', 'scoala'], TRUE, 'rsz_harry-potter-si-piatra-filosofala-cover_big_fixed.jpg'),
('Dune', 'Un clasic al genului science fiction', 70.99, 412, 'sf', 'nemira', 'Frank Herbert', ARRAY['planete', 'politica'], FALSE, 'rsz_1seriedune.png'),
('Pe aripile vântului', 'O poveste de dragoste epică', 30.50, 1024, 'romance', 'TREI', 'Margaret Mitchell', ARRAY['istoric', 'dragoste'], FALSE, 'aripile.jpg'),
('Mândrie și prejudecată', 'Un clasic al literaturii romantice', 35.00, 279, 'romance', 'TREI', 'Jane Austen', ARRAY['dragoste', 'societate'], TRUE, 'mandrie_poza.jpg'),
('Sherlock Holmes: Aventurile', 'Colecția de povestiri despre faimosul detectiv', 40.00, 325, 'mystery', 'TREI', 'Arthur Conan Doyle', ARRAY['detectiv', 'crima'], TRUE, 'SHERLOCK-POZA.jpg'),
('Distanța dintre noi', 'Doi frați, o singură tragedie. Două civilizații, o singură viață. Un trecut de coșmar, o revoluție și o iubire ce trece dincolo de moarte.', 25.99, 418, 'fictiune', 'nemira', 'Jhumpa Lahiri', ARRAY['frati', 'aventuri'], FALSE, 'rsz_distanta-dintre-noi-jhumpa-lahiri.jpg'),
('1984', 'Un roman distopic despre un regim totalitar', 45.00, 328, 'sf', 'TREI', 'George Orwell', ARRAY['distopie', 'politica'], TRUE, '1984_carte.jpg'),
('Codul lui Da Vinci', 'Un thriller care explorează mistere religioase', 50.00, 489, 'mystery', 'nemira', 'Dan Brown', ARRAY['thriller', 'mister'], TRUE, 'codul_vinci.jpg'),
('Cimitirul animalelor', 'Un roman horror despre un cimitir straniu', 35.99, 374, 'horror', 'TREI', 'Stephen King', ARRAY['groaza', 'mister'], FALSE, 'cimitirul-animalelor.jpg'),
('Jurnalul Annei Frank', 'Un jurnal autentic din perioada Holocaustului', 27.50, 320, 'beletristica', 'nemira', 'Anne Frank', ARRAY['istorie', 'jurnal'], TRUE, 'anne_frank.jpg'),
('Lord of the Rings: The Fellowship of the Ring', 'Primul volum din seria Stăpânul Inelelor', 75.00, 423, 'fantasy', 'leda edge', 'J.R.R. Tolkien', ARRAY['aventura', 'epic'], TRUE, 'lord-of-rings.jpg'),
('Culegere matematica clasa a 5-a', 'Exercitii de algebra, aritmetica si geometrie si teste de antrenament cu raspunsuri', 32.50, 312, 'scoala', 'paralela 45', 'Maria Zaharia', ARRAY['academic', 'copii'], TRUE, 'culegere.jpg'),
('Războiul lumilor', 'Un clasic al genului science fiction despre invazii extraterestre', 40.00, 303, 'sf', 'leda edge', 'H.G. Wells', ARRAY['extraterestri', 'invazie'], FALSE, 'razboiul-lumilor.jpg');
