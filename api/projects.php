<?php
require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $projects = readJsonFile('projects.json', []);
    jsonResponse(['success' => true, 'data' => $projects]);
} elseif ($method === 'POST') {
    checkAuth();
    $input = json_decode(file_get_contents('php://input'), true);

    if (!is_array($input)) {
        jsonResponse(['success' => false, 'message' => 'Geçersiz veri biçimi.'], 400);
    }

    $projects = readJsonFile('projects.json', []);
    $action = $input['action'] ?? 'save';

    if ($action === 'delete') {
        $id = $input['id'] ?? '';
        $filtered = array_values(array_filter($projects, function($p) use ($id) {
            return ($p['id'] ?? '') !== $id;
        }));

        if (writeJsonFile('projects.json', $filtered)) {
            jsonResponse(['success' => true, 'message' => 'Proje başarıyla silindi.', 'data' => $filtered]);
        } else {
            jsonResponse(['success' => false, 'message' => 'Proje silinirken hata oluştu.'], 500);
        }
    } else {
        // Ekleme veya Güncelleme
        $id = !empty($input['id']) ? $input['id'] : ('proj-' . time());
        $input['id'] = $id;

        $found = false;
        foreach ($projects as $key => $proj) {
            if (($proj['id'] ?? '') === $id) {
                $projects[$key] = array_merge($proj, $input);
                $found = true;
                break;
            }
        }

        if (!$found) {
            // Başa ekle
            array_unshift($projects, $input);
        }

        if (writeJsonFile('projects.json', $projects)) {
            jsonResponse(['success' => true, 'message' => 'Proje başarıyla kaydedildi.', 'data' => $projects]);
        } else {
            jsonResponse(['success' => false, 'message' => 'Proje kaydedilemedi.'], 500);
        }
    }
} else {
    jsonResponse(['success' => false, 'message' => 'Geçersiz istek metodu.'], 405);
}
