<?php

// Desactivem la impressió d'errors en HTML per evitar trencar el format JSON
ini_set('display_errors', 0);
error_reporting(E_ALL);

// Captura d'errors crítics per retornar-los sempre en format JSON net
register_shutdown_function(function() {
    $error = error_get_last();
    if ($error !== NULL && in_array($error['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR])) {
        http_response_code(500);
        echo json_encode(['error' => 'Error intern del servidor PHP: ' . $error['message']]);
        exit;
    }
});


require_once __DIR__ . '/../dao/nodeDAO.php'; 
require_once __DIR__ . '/../jwt/jwt_helper.php'; 

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$metode = $_SERVER['REQUEST_METHOD'];
$nodeDAO = new nodeDAO();

// get
if ($metode === 'GET') {
    if (isset($_GET['id']) && !empty($_GET['id'])) {
        echo json_encode($nodeDAO->getById($_GET['id']));
    } else {
        echo json_encode($nodeDAO->getAll());
    }
    exit;
}

// Validació del token JWT per a les operacions protegides (POST, PUT, DELETE)
$auth_header = '';
if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
    $auth_header = $_SERVER['HTTP_AUTHORIZATION'];
} elseif (function_exists('apache_request_headers')) {
    $requestHeaders = apache_request_headers();
    if (isset($requestHeaders['Authorization'])) {
        $auth_header = $requestHeaders['Authorization'];
    }
}

$usuari_autenticat = false;
if (!empty($auth_header) && preg_match('/Bearer\s(\S+)/', $auth_header, $matches)) {
    $usuari_autenticat = verificar_jwt($matches[1]);
}

if (!$usuari_autenticat || $usuari_autenticat['rol'] !== 'admin') {
    http_response_code(403);
    echo json_encode(["error" => "Accés denegat. Es requereix autenticació d'administrador."]);
    exit;
}

// Lectura de les dades
$jsonRebut = file_get_contents('php://input');
$dades = json_decode($jsonRebut);

//  rutes CRUD protegides
if ($metode === 'POST') {
    if (!$dades) {
        http_response_code(400);
        echo json_encode(["error" => "Falten les dades del cos o el JSON està malformat."]);
        exit;
    }
    
    $exit = $nodeDAO->create($dades->nom, $dades->lloc, $dades->tipus, $dades->email, $dades->lat, $dades->lng);
    if ($exit) {
        http_response_code(201);
        echo json_encode(["missatge" => "Node registrat correctament."]);
    } else {
        http_response_code(500);
        echo json_encode(["error" => "Error a la base de dades en crear el node."]);
    }

} elseif ($metode === 'PUT') {
    if (!isset($_GET['id']) || empty($_GET['id'])) {
        http_response_code(400);
        echo json_encode(["error" => "Falta el paràmetre 'id' a la URL (?id=X)."]);
        exit;
    }
    
    if (!$dades) {
        http_response_code(400);
        echo json_encode(["error" => "Falten les dades del formulari o el cos de la petició està buit."]);
        exit;
    }

    $exit = $nodeDAO->update($_GET['id'], $dades->nom, $dades->lloc, $dades->tipus, $dades->email, $dades->lat, $dades->lng);
    if ($exit) {
        echo json_encode(["missatge" => "Node actualitzat correctament."]);
    } else {
        http_response_code(500);
        echo json_encode(["error" => "Error a la base de dades en actualitzar."]);
    }

} elseif ($metode === 'DELETE') {
    if (!isset($_GET['id']) || empty($_GET['id'])) {
        http_response_code(400);
        echo json_encode(["error" => "Falta el paràmetre 'id' a la URL per eliminar."]);
        exit;
    }

    $exit = $nodeDAO->delete($_GET['id']);
    if ($exit) {
        echo json_encode(["missatge" => "Node eliminat correctament."]);
    } else {
        http_response_code(500);
        echo json_encode(["error" => "Error a la base de dades en eliminar."]);
    }
} else {
    http_response_code(405);
    echo json_encode(["error" => "Mètode HTTP no permès."]);
}
?>