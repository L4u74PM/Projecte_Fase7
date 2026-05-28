<?php
$arxiu = __DIR__.'/nodes.db';
$db = new SQLite3($arxiu);
$db->exec("CREATE TABLE IF NOT EXISTS nodes(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nom TEXT NOT NULL,
    lloc TEXT NOT NULL,
    tipus TEXT NOT NULL,
    email TEXT NOT NULL,
    lat REAL,
    lng REAL
)");

$db->exec("CREATE TABLE IF NOT EXISTS usuaris (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    correu TEXT NOT NULL UNIQUE,
    contrasenya TEXT NOT NULL   
);");



// Insertar dades inicials
$db->exec("INSERT INTO nodes (nom, lloc, tipus, email, lat, lng) VALUES ('Node BCN', 'Barcelona', 'reutilitzat', 'admin@edgeeco.com', 41.3851, 2.1734)");
echo "Base de dades inicialitzada.";
//insertar un administrador per a poder accedir al sistema
$hash_admin = password_hash('123456', PASSWORD_DEFAULT);
$db->exec("INSERT OR IGNORE INTO usuaris (correu, contrasenya) VALUES ('admin@edgeeco.com', '$hash_admin')");
?>