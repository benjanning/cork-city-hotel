CREATE TABLE IF NOT EXISTS demo_rooms (
 id INT PRIMARY KEY, name VARCHAR(80) NOT NULL, price DECIMAL(10,2) NOT NULL,
 capacity INT NOT NULL, stock INT NOT NULL
);
INSERT INTO demo_rooms (id,name,price,capacity,stock) VALUES
(1,'The City Single',80.00,1,8),(2,'The Courtyard Double',120.00,2,6),(3,'The River King',160.00,2,4);
