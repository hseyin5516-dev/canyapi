<?php
require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $blog = readJsonFile('blog.json', []);
    
    // Eğer admin değilse sadece yayında (published) olanları göster
    $isAdmin = !empty($_SESSION['canyapi_admin_logged']) && $_SESSION['canyapi_admin_logged'] === true;
    if (!$isAdmin && empty($_GET['all'])) {
        $blog = array_values(array_filter($blog, function($item) {
            return ($item['status'] ?? 'published') === 'published';
        }));
    }

    // Slug ile tekil yazı getirme
    if (!empty($_GET['slug'])) {
        $slug = $_GET['slug'];
        foreach ($blog as $item) {
            if (($item['slug'] ?? '') === $slug) {
                jsonResponse(['success' => true, 'data' => $item]);
            }
        }
        jsonResponse(['success' => false, 'message' => 'Yazı bulunamadı.'], 404);
    }

    jsonResponse(['success' => true, 'data' => $blog]);
} elseif ($method === 'POST') {
    checkAuth();
    $input = json_decode(file_get_contents('php://input'), true);

    if (!is_array($input)) {
        jsonResponse(['success' => false, 'message' => 'Geçersiz veri biçimi.'], 400);
    }

    $blog = readJsonFile('blog.json', []);
    $action = $input['action'] ?? 'save';

    if ($action === 'delete') {
        $id = $input['id'] ?? '';
        $filtered = array_values(array_filter($blog, function($b) use ($id) {
            return ($b['id'] ?? '') !== $id;
        }));

        if (writeJsonFile('blog.json', $filtered)) {
            jsonResponse(['success' => true, 'message' => 'Blog yazısı silindi.', 'data' => $filtered]);
        } else {
            jsonResponse(['success' => false, 'message' => 'Blog yazısı silinemedi.'], 500);
        }
    } else {
        // Ekle veya Güncelle
        $id = !empty($input['id']) ? $input['id'] : ('blog-' . time());
        $input['id'] = $id;

        // Otomatik slug oluşturma eğer verilmemişse
        if (empty($input['slug']) && !empty($input['title'])) {
            $slug = mb_strtolower($input['title'], 'UTF-8');
            $slug = str_replace(['ı', 'ğ', 'ü', 'ş', 'ö', 'ç', 'İ', 'Ğ', 'Ü', 'Ş', 'Ö', 'Ç'], ['i', 'g', 'u', 's', 'o', 'c', 'i', 'g', 'u', 's', 'o', 'c'], $slug);
            $slug = preg_replace('/[^a-z0-9\-]/', '-', $slug);
            $slug = preg_replace('/-+/', '-', trim($slug, '-'));
            $input['slug'] = $slug;
        }

        if (empty($input['date'])) {
            $input['date'] = date('d.m.Y');
        }

        $found = false;
        foreach ($blog as $key => $item) {
            if (($item['id'] ?? '') === $id) {
                $blog[$key] = array_merge($item, $input);
                $found = true;
                break;
            }
        }

        if (!$found) {
            array_unshift($blog, $input);
        }

        if (writeJsonFile('blog.json', $blog)) {
            jsonResponse(['success' => true, 'message' => 'Blog yazısı başarıyla kaydedildi.', 'data' => $blog]);
        } else {
            jsonResponse(['success' => false, 'message' => 'Blog yazısı kaydedilemedi.'], 500);
        }
    }
} else {
    jsonResponse(['success' => false, 'message' => 'Geçersiz istek metodu.'], 405);
}
