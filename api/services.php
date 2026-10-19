<?php
require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $services = readJsonFile('services.json', []);
    jsonResponse(['success' => true, 'data' => $services]);
} elseif ($method === 'POST') {
    checkAuth();
    $input = json_decode(file_get_contents('php://input'), true);

    if (!is_array($input)) {
        jsonResponse(['success' => false, 'message' => 'Geçersiz veri biçimi.'], 400);
    }

    $services = readJsonFile('services.json', []);
    $action = $input['action'] ?? 'save';

    if ($action === 'delete') {
        $id = $input['id'] ?? '';
        $filtered = array_values(array_filter($services, function($s) use ($id) {
            return ($s['id'] ?? '') !== $id;
        }));

        if (writeJsonFile('services.json', $filtered)) {
            jsonResponse(['success' => true, 'message' => 'Hizmet başarıyla silindi.', 'data' => $filtered]);
        } else {
            jsonResponse(['success' => false, 'message' => 'Hizmet silinirken hata oluştu.'], 500);
        }
    } else {
        // Ekle veya Güncelle
        $id = !empty($input['id']) ? $input['id'] : ('srv-' . time());
        $input['id'] = $id;

        $found = false;
        foreach ($services as $key => $serv) {
            if (($serv['id'] ?? '') === $id) {
                $services[$key] = array_merge($serv, $input);
                $found = true;
                break;
            }
        }

        if (!$found) {
            $services[] = $input;
        }

        if (writeJsonFile('services.json', $services)) {
            jsonResponse(['success' => true, 'message' => 'Hizmet başarıyla kaydedildi.', 'data' => $services]);
        } else {
            jsonResponse(['success' => false, 'message' => 'Hizmet kaydedilemedi.'], 500);
        }
    }
} else {
    jsonResponse(['success' => false, 'message' => 'Geçersiz istek metodu.'], 405);
}
