<?php
/**
 * Can Yapı Antalya - CMS Backend Yapılandırması ve Yardımcı Fonksiyonları
 */

// Oturum başlat
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// JSON Yanıt Başlığı ve Önbellek Engelleme
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('Expires: 0');

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
 * Yönetici oturum kontrolü (Genişletilmiş ve cPanel/Apache Uyumlu)
 */
function checkAuth() {
    // 1. Session kontrolü
    if (!empty($_SESSION['canyapi_admin_logged']) && $_SESSION['canyapi_admin_logged'] === true) {
        return true;
    }

    // 2. HTTP Header token kontrolü
    $headers = function_exists('getallheaders') ? getallheaders() : [];
    $rawToken = $headers['X-Admin-Token'] 
        ?? $headers['x-admin-token'] 
        ?? $headers['Authorization'] 
        ?? $headers['authorization']
        ?? $_SERVER['HTTP_X_ADMIN_TOKEN'] 
        ?? $_SERVER['HTTP_AUTHORIZATION'] 
        ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] 
        ?? $_GET['token'] 
        ?? $_POST['token'] 
        ?? '';

    // JSON body token kontrolü
    if (empty($rawToken)) {
        $bodyInput = @json_decode(file_get_contents('php://input'), true);
        if (is_array($bodyInput)) {
            $rawToken = $bodyInput['_token'] ?? $bodyInput['token'] ?? '';
        }
    }

    if (!empty($rawToken)) {
        $token = trim(str_replace('Bearer ', '', $rawToken));
        if (in_array($token, ADMIN_PASSWORDS, true) || $token === md5('canyapi_05458320190')) {
            $_SESSION['canyapi_admin_logged'] = true;
            return true;
        }
    }

    jsonResponse([
        'success' => false,
        'message' => 'Yetkisiz erişim. Lütfen admin paneline tekrar giriş yapınız.'
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
 * Güvenli JSON dosya yazma (Atomik & Doğrudan Güvenli Yazma)
 */
function writeJsonFile($filename, $data) {
    if (!is_dir(DATA_DIR)) {
        @mkdir(DATA_DIR, 0755, true);
    }
    $filePath = DATA_DIR . '/' . $filename;
    $json = json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    if ($json === false) {
        return false;
    }

    // Doğrudan kilitli yazma
    $bytes = @file_put_contents($filePath, $json, LOCK_EX);
    if ($bytes !== false) {
        @chmod($filePath, 0666);
        return true;
    }

    // Geçici dosya üzerinden yedek deneme
    $tempPath = $filePath . '.tmp';
    if (@file_put_contents($tempPath, $json, LOCK_EX) !== false) {
        if (@rename($tempPath, $filePath)) {
            @chmod($filePath, 0666);
            return true;
        }
    }
    return false;
}
