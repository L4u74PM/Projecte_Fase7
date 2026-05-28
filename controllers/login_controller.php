<?php

require_once __DIR__ . '/jwt_helper.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $json_rebut = file_get_contents('php://input');
    $dades = json_decode($json_rebut);

    if ($dades && isset($dades->email) && isset($dades->password)) {
        
        // Validación simulada (en el futuro puedes consultar aquí tu SQLite)
        if ($dades->email === "admin@edgeeco.com" && $dades->password === "123456") {
            
            $payload = [
                "email" => $dades->email,
                "rol" => "admin"
            ];

            $token = generar_jwt($payload);

            http_response_code(200);
            echo json_encode([
                "missatge" => "Autenticació correcta",
                "token" => $token,
                "rol" => "admin"
            ]);
        } else {
            http_response_code(401);
            echo json_encode(["error" => "Credencials incorrectes"]);
        }
    } else {
        http_response_code(400);
        echo json_encode(["error" => "Dades malformades"]);
    }
}