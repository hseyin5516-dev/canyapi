<?php
require_once __DIR__ . '/config.php';

checkAuth();

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    if (!is_dir(UPLOADS_DIR)) {
        mkdir(UPLOADS_DIR, 0755, true);
    }

    $files = [];
    $scanned = scandir(UPLOADS_DIR);

    foreach ($scanned as $file) {
        if ($file === '.' || $file === '..' || $file === '.htaccess') {
            continue;
        }

        $fullPath = UPLOADS_DIR . '/' . $file;
        if (is_file($fullPath)) {
            $files[] = [
                'name' => $file,
                'url' => 'uploads/' . $file,
                'size' => round(filesize($fullPath) / 1024, 1) . ' KB',
                'date' => date('d.m.Y H:i', filemtime($fullPath)),
                'timestamp' => filemtime($fullPath)
            ];
        }
    }

    // En yeni en üstte
    usort($files, function($a, $b) {
        return $b['timestamp'] - $a['timestamp'];
    });

    jsonResponse(['success' => true, 'data' => $files]);
} elseif ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $action = $input['action'] ?? '';
    $filename = basename($input['filename'] ?? '');

    if ($action === 'delete' && !empty($filename)) {
        $target = UPLOADS_DIR . '/' . $filename;
        if (file_exists($target) && is_file($target)) {
            unlink($target);
            jsonResponse(['success' => true, 'message' => 'Görsel silindi.']);
        } else {
            jsonResponse(['success' => false, 'message' => 'Görsel bulunamadı.'], 404);
        }
    } else {
        jsonResponse(['success' => false, 'message' => 'Geçersiz işlem.'], 400);
    }
} else {
    jsonResponse(['success' => false, 'message' => 'Geçersiz metod.'], 405);
}
