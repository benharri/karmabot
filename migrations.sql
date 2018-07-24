-- DROP TABLE karma;

CREATE TABLE IF NOT EXISTS karma
(
    user_id varchar(100) unique,
    karma integer default 0
);
