<?php
/**
 * Can Yapı Antalya - CMS Backend Yapılandırması ve Yardımcı Fonksiyonları
 */

// Oturum başlat
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// JSON Yanıt Başlığı
header('Content-Type: application/json; charset=utf-8');

// Yönetici Giriş Bilgileri
define('ADMIN_USER', 'canyapi');
define('ADMIN_PASSWORDS', ['05458320190', '5458320190']);

// Dizin Yolları
define('DATA_DIR', __DIR__ . '/../data');
define('UPLOADS_DIR', __DIR__ . '/../uploads');

/**
 * Standart JSON yanıtı döndür
 */
function jsonResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

/**
 * Yönetici oturum kontrolü
 */
function checkAuth() {
    // 1. Session kontrolü
    if (!empty($_SESSION['canyapi_admin_logged']) && $_SESSION['canyapi_admin_logged'] === true) {
        return true;
    }

    // 2. HTTP Header token kontrolü (opsiyonel API erişimi için)
    $authHeader = $_SERVER['HTTP_X_ADMIN_TOKEN'] ?? $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (!empty($authHeader)) {
        $token = str_replace('Bearer ', '', $authHeader);
        if (in_array($token, ADMIN_PASSWORDS, true) || $token === md5('canyapi_05458320190')) {
            return true;
        }
    }

    jsonResponse([
        'success' => false,
        'message' => 'Yetkisiz erişim. Lütfen admin paneline giriş yapınız.'
    ], 401);
}

/**
 * Güvenli JSON dosya okuma
 */
function readJsonFile($filename, $default = []) {
    $filePath = DATA_DIR . '/' . $filename;
    if (!file_exists($filePath)) {
        return $default;
    }
    $content = file_get_contents($filePath);
    $data = json_decode($content, true);
    return is_array($data) ? $data : $default;
}

/**
 * Güvenli JSON dosya yazma (Atomik yazma)
 */
function writeJsonFile($filename, $data) {
    if (!is_dir(DATA_DIR)) {
        mkdir(DATA_DIR, 0755, true);
    }
    $filePath = DATA_DIR . '/' . $filename;
    $tempPath = $filePath . '.tmp';
    $json = json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

    if (file_put_contents($tempPath, $json, LOCK_EX) !== false) {
        return rename($tempPath, $filePath);
    }
    return false;
}
