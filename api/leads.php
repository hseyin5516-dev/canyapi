<?php
require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];
$leadsFile = DATA_DIR . '/leads.json';

function getLeadsData($file) {
    if (!file_exists($file)) {
        file_put_contents($file, json_encode([], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        return [];
    }
    $content = file_get_contents($file);
    $data = json_decode($content, true);
    return is_array($data) ? $data : [];
}

function saveLeadsData($file, $data) {
    return file_put_contents($file, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES), LOCK_EX);
}

if ($method === 'GET') {
    checkAuth();
    $leads = getLeadsData($leadsFile);
    jsonResponse(['success' => true, 'data' => $leads]);
}

if ($method === 'POST') {
    $rawInput = file_get_contents('php://input');
    $input = json_decode($rawInput, true);

    // Form data (multipart/form-data veya x-www-form-urlencoded) ile geldiyse $_POST'tan al
    if (!$input && !empty($_POST)) {
        $input = $_POST;
    }

    if (!$input) {
        $input = [];
    }

    $action = $input['action'] ?? '';

    // 1. Yönetici İşlemleri (Auth Gerekir)
    if ($action === 'status') {
        checkAuth();
        $id = $input['id'] ?? '';
        $newStatus = trim($input['status'] ?? 'Yeni');
        $leads = getLeadsData($leadsFile);
        $found = false;

        foreach ($leads as &$lead) {
            if ($lead['id'] === $id) {
                $lead['status'] = $newStatus;
                $lead['updatedAt'] = date('d.m.Y H:i:s');
                $found = true;
                break;
            }
        }

        if ($found) {
            saveLeadsData($leadsFile, $leads);
            jsonResponse(['success' => true, 'message' => 'Talep durumu güncellendi.']);
        } else {
            jsonResponse(['success' => false, 'message' => 'Talep bulunamadı.'], 404);
        }
    }

    if ($action === 'delete') {
        checkAuth();
        $id = $input['id'] ?? '';
        $leads = getLeadsData($leadsFile);
        $filtered = array_values(array_filter($leads, function($l) use ($id) {
            return $l['id'] !== $id;
        }));

        saveLeadsData($leadsFile, $filtered);
        jsonResponse(['success' => true, 'message' => 'Talep başarıyla silindi.']);
    }

    // 2. Müşteri Tarafından Yeni Talep Gönderimi (Public)
    $name = trim($input['name'] ?? '');
    $phone = trim($input['phone'] ?? '');

    if (empty($name) || empty($phone)) {
        jsonResponse(['success' => false, 'message' => 'Lütfen adınızı ve telefon numaranızı eksiksiz girin.'], 400);
    }

    $leads = getLeadsData($leadsFile);

    $leadId = 'CY-' . date('ymd') . '-' . strtoupper(substr(uniqid(), -4));
    $isDiscovery = !empty($input['isDiscovery']) && ($input['isDiscovery'] === true || $input['isDiscovery'] === 'true' || $input['isDiscovery'] === 1 || $input['isDiscovery'] === '1');

    $newLead = [
        'id' => $leadId,
        'date' => date('d.m.Y H:i'),
        'timestamp' => time(),
        'name' => htmlspecialchars($name, ENT_QUOTES, 'UTF-8'),
        'phone' => htmlspecialchars($phone, ENT_QUOTES, 'UTF-8'),
        'service' => htmlspecialchars(trim($input['service'] ?? 'Genel Bilgi / Teklif'), ENT_QUOTES, 'UTF-8'),
        'location' => htmlspecialchars(trim($input['location'] ?? 'Antalya'), ENT_QUOTES, 'UTF-8'),
        'message' => htmlspecialchars(trim($input['message'] ?? $input['details'] ?? ''), ENT_QUOTES, 'UTF-8'),
        'isDiscovery' => $isDiscovery,
        'status' => 'Yeni',
        'ip' => $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0'
    ];

    // En yeni talep en başta
    array_unshift($leads, $newLead);

    // Maksimum 500 talep sakla
    if (count($leads) > 500) {
        $leads = array_slice($leads, 0, 500);
    }

    saveLeadsData($leadsFile, $leads);

    jsonResponse([
        'success' => true,
        'id' => $leadId,
        'message' => 'Talebiniz başarıyla alındı. Uzman ekibimiz en kısa sürede sizinle iletişime geçecektir.'
    ]);
}

jsonResponse(['success' => false, 'message' => 'Geçersiz istek metodu.'], 405);
