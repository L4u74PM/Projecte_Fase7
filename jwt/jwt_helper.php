<?php


define('SECRET_KEY', 'ClaveSecretaSuperSeguraDeEdgeEco');

// Función per codificar dades
function base64url_encode($data) {
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

// decodificar
function base64url_decode($data) {
    return base64_decode(strtr($data, '-_', '+/'));
}

// Función para generar un JWT
function generar_jwt($payload) {
    $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
    
    // Añadimos tiempo de expiración 
    $payload['exp'] = time() + (2 * 60 * 60);
    $payload_json = json_encode($payload);

    $base64_header = base64url_encode($header);
    $base64_payload = base64url_encode($payload_json);

    // Crear la firma
    $firma = hash_hmac('sha256', $base64_header . "." . $base64_payload, SECRET_KEY, true);
    $base64_firma = base64url_encode($firma);

    return $base64_header . "." . $base64_payload . "." . $base64_firma;
}

// Funció per verificar un JWT
function verificar_jwt($token) {
    $partes = explode('.', $token);
    if (count($partes) !== 3) return false;

    list($base64_header, $base64_payload, $base64_firma) = $partes;

    // comprobar si es vàlida la firma
    $firma_verificacion = hash_hmac('sha256', $base64_header . "." . $base64_payload, SECRET_KEY, true);
    $base64_firma_verificacion = base64url_encode($firma_verificacion);

    
    if ($base64_firma !== $base64_firma_verificacion) {
        return false;
    }

    $payload = json_decode(base64url_decode($base64_payload), true);

    // Comprobar si el token ha expirado
    if (isset($payload['exp']) && $payload['exp'] < time()) {
        return false; 
    }

    return $payload; // retorna el payload si el token es válid
}