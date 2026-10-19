<?php
require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $action = $input['action'] ?? 'login';

    if ($action === 'logout') {
        $_SESSION['canyapi_admin_logged'] = false;
        session_destroy();
        jsonResponse(['success' => true, 'message' => 'Oturum kapatıldı.']);
    }

    $username = trim($input['username'] ?? '');
    $password = trim($input['password'] ?? '');

    if ($username === ADMIN_USER && in_array($password, ADMIN_PASSWORDS, true)) {
        $_SESSION['canyapi_admin_logged'] = true;
        $_SESSION['canyapi_admin_user'] = ADMIN_USER;
        $_SESSION['canyapi_admin_time'] = time();

        $token = md5('canyapi_05458320190');

        jsonResponse([
            'success' => true,
            'message' => 'Giriş başarılı.',
            'token' => $token,
            'user' => ADMIN_USER
        ]);
    } else {
        jsonResponse([
            'success' => false,
            'message' => 'Kullanıcı adı veya şifre hatalı.'
        ], 401);
    }
} elseif ($method === 'GET') {
    // Oturum durumunu kontrol et
    $isLogged = !empty($_SESSION['canyapi_admin_logged']) && $_SESSION['canyapi_admin_logged'] === true;
    jsonResponse([
        'success' => true,
        'authenticated' => $isLogged,
        'user' => $isLogged ? ADMIN_USER : null
    ]);
} else {
    jsonResponse(['success' => false, 'message' => 'Geçersiz metod.'], 405);
}
