<?php
require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $settings = readJsonFile('settings.json', []);
    jsonResponse(['success' => true, 'data' => $settings]);
} elseif ($method === 'POST') {
    checkAuth();
    $input = json_decode(file_get_contents('php://input'), true);

    if (!is_array($input)) {
        jsonResponse(['success' => false, 'message' => 'Geçersiz veri biçimi.'], 400);
    }

    $current = readJsonFile('settings.json', []);
    // Mevcut ayarlar ile gelen ayarları harmanla
    $updated = array_merge($current, $input);

    if (writeJsonFile('settings.json', $updated)) {
        jsonResponse(['success' => true, 'message' => 'Site ayarları ve metinleri başarıyla güncellendi.', 'data' => $updated]);
    } else {
        jsonResponse(['success' => false, 'message' => 'Ayarlar kaydedilirken bir hata oluştu.'], 500);
    }
} else {
    jsonResponse(['success' => false, 'message' => 'Geçersiz istek metodu.'], 405);
}
