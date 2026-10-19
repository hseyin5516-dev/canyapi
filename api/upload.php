<?php
require_once __DIR__ . '/config.php';

checkAuth();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['success' => false, 'message' => 'Yalnızca POST istekleri kabul edilir.'], 405);
}

$file = $_FILES['image'] ?? $_FILES['file'] ?? null;

if (!$file || empty($file['tmp_name'])) {
    jsonResponse(['success' => false, 'message' => 'Lütfen yüklenecek bir görsel seçiniz.'], 400);
}

if ($file['error'] !== UPLOAD_ERR_OK) {
    jsonResponse(['success' => false, 'message' => 'Dosya yükleme hatası oluştu: Kod ' . $file['error']], 500);
}

// Boyut kontrolü: Maksimum 15 MB
$maxSize = 15 * 1024 * 1024;
if ($file['size'] > $maxSize) {
    jsonResponse(['success' => false, 'message' => 'Dosya boyutu çok büyük (Maksimum 15 MB).'], 400);
}

// İzin verilen uzantılar ve MIME türleri
$allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
$allowedMimes = ['image/jpeg', 'image/pjpeg', 'image/png', 'image/webp', 'image/gif'];

$finfo = finfo_open(FILEINFO_MIME_TYPE);
$mimeType = finfo_file($finfo, $file['tmp_name']);
finfo_close($finfo);

$originalName = pathinfo($file['name'], PATHINFO_FILENAME);
$extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));

if (!in_array($extension, $allowedExtensions, true) || !in_array($mimeType, $allowedMimes, true)) {
    jsonResponse(['success' => false, 'message' => 'Geçersiz dosya formatı. Yalnızca JPG, PNG, WEBP ve GIF formatındaki fotoğraflar yüklenebilir.'], 400);
}

if (!is_dir(UPLOADS_DIR)) {
    mkdir(UPLOADS_DIR, 0755, true);
}

// Güvenli ve benzersiz dosya adı oluşturma
$cleanName = preg_replace('/[^a-zA-Z0-9_-]/', '', str_replace(' ', '-', $originalName));
$cleanName = substr($cleanName, 0, 30);
$uniqueFilename = 'cy_' . date('Ymd_His') . '_' . substr(md5(uniqid()), 0, 6) . '.' . $extension;
$targetPath = UPLOADS_DIR . '/' . $uniqueFilename;

if (move_uploaded_file($file['tmp_name'], $targetPath)) {
    // Relative URL for website
    $fileUrl = 'uploads/' . $uniqueFilename;
    jsonResponse([
        'success' => true,
        'message' => 'Fotoğraf başarıyla yüklendi.',
        'url' => $fileUrl,
        'filename' => $uniqueFilename,
        'size' => round($file['size'] / 1024, 1) . ' KB'
    ]);
} else {
    jsonResponse(['success' => false, 'message' => 'Dosya sunucuya kaydedilemedi.'], 500);
}
