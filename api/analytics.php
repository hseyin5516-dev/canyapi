<?php
/**
 * Can Yapı Antalya - Gerçek Zamanlı Sunucu Taraflı Ziyaretçi ve Etkileşim Analitiği API'si
 * 
 * Tüm sayfaların gerçek ziyaretçi, sayfa gösterimi, cihaz (Mobil/Masaüstü), trafik kaynağı
 * ve müşteri dönüşüm eylemlerini (WhatsApp, Telefon, Form) merkezi olarak güvenle kaydeder.
 */

require_once __DIR__ . '/config.php';

// CORS ve Güvenlik Başlıkları
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Admin-Token, Authorization');

$method = $_SERVER['REQUEST_METHOD'];
if ($method === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$analyticsFile = 'analytics.json';

// Cihaz türü tespiti
function detectDevice($ua) {
    if (preg_match('/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i', $ua)) {
        return 'tablet';
    }
    if (preg_match('/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Opera M(obi|ini)/i', $ua)) {
        return 'mobile';
    }
    return 'desktop';
}

// Trafik kaynağı tespiti
function detectSource($ref) {
    $ref = strtolower($ref);
    if (empty($ref)) return 'direct';
    if (strpos($ref, 'google.') !== false) return 'google';
    if (strpos($ref, 'whatsapp') !== false || strpos($ref, 'wa.me') !== false) return 'whatsapp';
    if (strpos($ref, 'instagram') !== false || strpos($ref, 'facebook') !== false || strpos($ref, 'tiktok') !== false || strpos($ref, 't.co') !== false) return 'social';
    return 'referral';
}

// Sayfa yolunu temizle
function cleanPath($p) {
    $p = trim($p);
    $p = preg_replace('/\/index\.html$/', '/', $p);
    $p = preg_replace('/\.html$/', '', $p);
    if (empty($p)) $p = '/';
    return $p;
}

if ($method === 'GET') {
    // Admin veya istemci için istatistikleri döndür
    $data = readJsonFile($analyticsFile, null);
    if (!$data || !is_array($data)) {
        // Henüz veri yoksa temiz sıfır başlangıç şablonu
        $today = date('Y-m-d');
        $month = date('Y-m');
        $data = [
            'created_at' => time(),
            'today_key' => $today,
            'today_visitors' => 0,
            'today_views' => 0,
            'weekly_visitors' => 0,
            'weekly_views' => 0,
            'monthly_visitors' => 0,
            'monthly_views' => 0,
            'total_views' => 0,
            'month_label' => date('F Y'),
            'devices' => ['mobile' => 0, 'desktop' => 0, 'tablet' => 0],
            'sources' => ['google' => 0, 'whatsapp' => 0, 'direct' => 0, 'social' => 0, 'referral' => 0],
            'pages' => [],
            'conversions' => [
                'whatsapp' => 0,
                'phone' => 0,
                'forms' => 0,
                'discovery' => 0,
                'total' => 0
            ],
            'recent_activity' => []
        ];
    }

    // Günlük / Haftalık / Aylık sayaçların güncellik kontrolü
    $today = date('Y-m-d');
    if (($data['today_key'] ?? '') !== $today) {
        $data['today_key'] = $today;
        $data['today_visitors'] = 0;
        $data['today_views'] = 0;
    }

    // Haftalık ve aylık sayaçları günlük kayıtlardan yeniden hesapla (son 7 gün ve bu ay)
    $dailyRecords = $data['daily_history'] ?? [];
    $sevenDaysAgo = date('Y-m-d', strtotime('-7 days'));
    $currentMonthPrefix = date('Y-m');

    $weekVis = 0;
    $weekViews = 0;
    $monthVis = 0;
    $monthViews = 0;

    foreach ($dailyRecords as $dateKey => $stat) {
        if ($dateKey >= $sevenDaysAgo) {
            $weekVis += ($stat['visitors'] ?? 0);
            $weekViews += ($stat['views'] ?? 0);
        }
        if (strpos($dateKey, $currentMonthPrefix) === 0) {
            $monthVis += ($stat['visitors'] ?? 0);
            $monthViews += ($stat['views'] ?? 0);
        }
    }

    $data['weekly_visitors'] = max($weekVis, $data['today_visitors'] ?? 0);
    $data['weekly_views'] = max($weekViews, $data['today_views'] ?? 0);
    $data['monthly_visitors'] = max($monthVis, $data['weekly_visitors'] ?? 0);
    $data['monthly_views'] = max($monthViews, $data['weekly_views'] ?? 0);

    jsonResponse(['success' => true, 'data' => $data]);

} elseif ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    if (!is_array($input)) {
        jsonResponse(['success' => false, 'message' => 'Geçersiz veri biçimi.'], 400);
    }

    $action = $input['action'] ?? 'hit';
    $data = readJsonFile($analyticsFile, []);

    $today = date('Y-m-d');
    $currentMonthPrefix = date('Y-m');

    if (!isset($data['today_key']) || $data['today_key'] !== $today) {
        $data['today_key'] = $today;
        $data['today_visitors'] = 0;
        $data['today_views'] = 0;
    }

    if (!isset($data['daily_history']) || !is_array($data['daily_history'])) {
        $data['daily_history'] = [];
    }
    if (!isset($data['daily_history'][$today])) {
        $data['daily_history'][$today] = ['visitors' => 0, 'views' => 0, 'uids' => []];
    }
    if (!isset($data['devices'])) {
        $data['devices'] = ['mobile' => 0, 'desktop' => 0, 'tablet' => 0];
    }
    if (!isset($data['sources'])) {
        $data['sources'] = ['google' => 0, 'whatsapp' => 0, 'direct' => 0, 'social' => 0, 'referral' => 0];
    }
    if (!isset($data['pages'])) {
        $data['pages'] = [];
    }
    if (!isset($data['conversions'])) {
        $data['conversions'] = ['whatsapp' => 0, 'phone' => 0, 'forms' => 0, 'discovery' => 0, 'total' => 0];
    }
    if (!isset($data['recent_activity'])) {
        $data['recent_activity'] = [];
    }

    $ua = $_SERVER['HTTP_USER_AGENT'] ?? '';
    $device = detectDevice($ua);
    $ref = $input['referrer'] ?? $_SERVER['HTTP_REFERER'] ?? '';
    $source = detectSource($ref);
    $path = cleanPath($input['path'] ?? '/');

    // Admin sayfalarını veya oturum açmış admini sayfa gösterimi olarak sayma
    $isAdminSession = !empty($_SESSION['canyapi_admin_logged']) && $_SESSION['canyapi_admin_logged'] === true;
    if (strpos($path, 'admin') !== false || $isAdminSession) {
        jsonResponse(['success' => true, 'ignored' => 'admin_session_or_page']);
    }

    $uid = $input['uid'] ?? md5(($_SERVER['REMOTE_ADDR'] ?? '') . $ua);

    if ($action === 'hit') {
        // Sayfa Gösterimi
        $data['today_views'] = ($data['today_views'] ?? 0) + 1;
        $data['total_views'] = ($data['total_views'] ?? 0) + 1;
        $data['daily_history'][$today]['views'] = ($data['daily_history'][$today]['views'] ?? 0) + 1;

        // Tekil Ziyaretçi Kontrolü
        $todayUids = $data['daily_history'][$today]['uids'] ?? [];
        if (!in_array($uid, $todayUids, true)) {
            $data['daily_history'][$today]['uids'][] = $uid;
            $data['daily_history'][$today]['visitors'] = ($data['daily_history'][$today]['visitors'] ?? 0) + 1;
            $data['today_visitors'] = ($data['today_visitors'] ?? 0) + 1;
        }

        // Cihaz ve Kaynak Sayımı
        $data['devices'][$device] = ($data['devices'][$device] ?? 0) + 1;
        $data['sources'][$source] = ($data['sources'][$source] ?? 0) + 1;

        // Sayfa Popülaritesi
        $data['pages'][$path] = ($data['pages'][$path] ?? 0) + 1;

    } elseif ($action === 'event') {
        // Hedef / Dönüşüm Eylemi (WhatsApp, Telefon, Form)
        $event = $input['event'] ?? '';
        $label = 'Etkileşim';
        $color = '#8B5CF6';

        if ($event === 'whatsapp_click') {
            $data['conversions']['whatsapp'] = ($data['conversions']['whatsapp'] ?? 0) + 1;
            $label = 'WhatsApp Sohbeti Başlatıldı';
            $color = '#25D366';
        } elseif ($event === 'phone_call_click') {
            $data['conversions']['phone'] = ($data['conversions']['phone'] ?? 0) + 1;
            $label = 'Telefon Arama Butonuna Tıklandı';
            $color = '#FF5500';
        } elseif ($event === 'quote_form_submit') {
            $data['conversions']['forms'] = ($data['conversions']['forms'] ?? 0) + 1;
            $label = 'Teklif Formu Gönderildi';
            $color = '#00B0FF';
        } elseif ($event === 'free_discovery_click') {
            $data['conversions']['discovery'] = ($data['conversions']['discovery'] ?? 0) + 1;
            $label = 'Ücretsiz Keşif Talebi';
            $color = '#10B981';
        }

        $data['conversions']['total'] = 
            ($data['conversions']['whatsapp'] ?? 0) + 
            ($data['conversions']['phone'] ?? 0) + 
            ($data['conversions']['forms'] ?? 0) + 
            ($data['conversions']['discovery'] ?? 0);

        // Canlı akışa ekle
        $devIcon = $device === 'mobile' ? '📱 Mobil' : ($device === 'tablet' ? '📲 Tablet' : '💻 Masaüstü');
        array_unshift($data['recent_activity'], [
            'title' => $label,
            'page' => $path,
            'time' => date('H:i'),
            'device' => $devIcon,
            'color' => $color
        ]);

        if (count($data['recent_activity']) > 20) {
            array_pop($data['recent_activity']);
        }
    }

    // Eski günlerin UID listelerini hafifletmek için 30 günden eskisini temizle
    if (count($data['daily_history']) > 35) {
        $keys = array_keys($data['daily_history']);
        sort($keys);
        while (count($keys) > 30) {
            $oldKey = array_shift($keys);
            unset($data['daily_history'][$oldKey]);
        }
    }

    writeJsonFile($analyticsFile, $data);
    jsonResponse(['success' => true]);

} else {
    jsonResponse(['success' => false, 'message' => 'Geçersiz istek metodu.'], 405);
}
