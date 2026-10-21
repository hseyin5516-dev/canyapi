<?php
/**
 * Can Yapı Antalya - Güvenli ve Otomatik WebP Dönüştürücülü Fotoğraf Yükleme API'si
 * 
 * Özellikler:
 * - Yüklenen PNG, JPG, JPEG, GIF fotoğrafları otomatik olarak modern WebP formatına dönüştürür.
 * - Telefonlardan yüklenen dev fotoğrafları (3000px-4000px) kaliteyi bozmadan en fazla 1600px'e akıllıca ölçekler.
 * - PNG şeffaflık (alpha channel) bilgisini korur.
 * - Telefon çekimlerindeki EXIF yön bilgisini (Orientation) otomatik düzeltir (fotoğrafların yan dönmesini önler).
 * - Sunucuda WebP desteği olmasa bile geriye uyumlu olarak dosyayı güvenle kaydeder.
 */

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

// Boyut kontrolü: Maksimum 20 MB (Telefon çekimlerine tolerans)
$maxSize = 20 * 1024 * 1024;
if ($file['size'] > $maxSize) {
    jsonResponse(['success' => false, 'message' => 'Dosya boyutu çok büyük (Maksimum 20 MB).'], 400);
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
    @mkdir(UPLOADS_DIR, 0755, true);
}

// Güvenli ve temiz dosya adı kökü
$cleanName = preg_replace('/[^a-zA-Z0-9_-]/', '', str_replace(' ', '-', $originalName));
$cleanName = substr($cleanName, 0, 30);
$fileBase = 'cy_' . date('Ymd_His') . '_' . substr(md5(uniqid()), 0, 6);

/**
 * Görseli WebP formatına dönüştürür ve maksimum 1600px'e ölçekler
 */
function convertToWebpWithGd($sourceTmpPath, $mimeType, $targetWebpPath, $maxDim = 1600, $quality = 82) {
    if (!function_exists('imagewebp')) {
        return false;
    }

    $srcImg = null;
    switch ($mimeType) {
        case 'image/jpeg':
        case 'image/pjpeg':
            if (function_exists('imagecreatefromjpeg')) {
                $srcImg = @imagecreatefromjpeg($sourceTmpPath);
            }
            break;
        case 'image/png':
            if (function_exists('imagecreatefrompng')) {
                $srcImg = @imagecreatefrompng($sourceTmpPath);
            }
            break;
        case 'image/webp':
            if (function_exists('imagecreatefromwebp')) {
                $srcImg = @imagecreatefromwebp($sourceTmpPath);
            }
            break;
        case 'image/gif':
            if (function_exists('imagecreatefromgif')) {
                $srcImg = @imagecreatefromgif($sourceTmpPath);
            }
            break;
    }

    if (!$srcImg && function_exists('imagecreatefromstring')) {
        $content = @file_get_contents($sourceTmpPath);
        if ($content !== false) {
            $srcImg = @imagecreatefromstring($content);
        }
    }

    if (!$srcImg) {
        return false;
    }

    // EXIF orientation düzeltmesi (Telefonlarda dik çekilen fotoğrafların yan yatmasını engeller)
    if (function_exists('exif_read_data') && function_exists('imagerotate') && ($mimeType === 'image/jpeg' || $mimeType === 'image/pjpeg')) {
        $exif = @exif_read_data($sourceTmpPath);
        if (!empty($exif['Orientation'])) {
            switch ($exif['Orientation']) {
                case 3:
                    $srcImg = imagerotate($srcImg, 180, 0);
                    break;
                case 6:
                    $srcImg = imagerotate($srcImg, -90, 0);
                    break;
                case 8:
                    $srcImg = imagerotate($srcImg, 90, 0);
                    break;
            }
        }
    }

    $origWidth = imagesx($srcImg);
    $origHeight = imagesy($srcImg);

    if ($origWidth <= 0 || $origHeight <= 0) {
        @imagedestroy($srcImg);
        return false;
    }

    // Maksimum boyut ölçekleme (en boy oranını koru)
    $newWidth = $origWidth;
    $newHeight = $origHeight;

    if ($origWidth > $maxDim || $origHeight > $maxDim) {
        if ($origWidth >= $origHeight) {
            $newWidth = $maxDim;
            $newHeight = (int)round(($origHeight / $origWidth) * $maxDim);
        } else {
            $newHeight = $maxDim;
            $newWidth = (int)round(($origWidth / $origHeight) * $maxDim);
        }
    }

    // Yeni tuval oluştur ve şeffaflığı koru
    $destImg = imagecreatetruecolor($newWidth, $newHeight);
    imagealphablending($destImg, false);
    imagesavealpha($destImg, true);
    $transparent = imagecolorallocatealpha($destImg, 255, 255, 255, 127);
    imagefilledrectangle($destImg, 0, 0, $newWidth, $newHeight, $transparent);

    imagecopyresampled($destImg, $srcImg, 0, 0, 0, 0, $newWidth, $newHeight, $origWidth, $origHeight);

    // WebP olarak kaydet
    $saved = @imagewebp($destImg, $targetWebpPath, $quality);

    @imagedestroy($srcImg);
    @imagedestroy($destImg);

    return $saved;
}

$webpFilename = $fileBase . '.webp';
$targetWebpPath = UPLOADS_DIR . '/' . $webpFilename;

$converted = convertToWebpWithGd($file['tmp_name'], $mimeType, $targetWebpPath, 1600, 82);

if ($converted && file_exists($targetWebpPath)) {
    @chmod($targetWebpPath, 0666);
    $finalSize = filesize($targetWebpPath);
    $savedPercent = $file['size'] > 0 ? round((1 - ($finalSize / $file['size'])) * 100) : 0;

    jsonResponse([
        'success' => true,
        'message' => 'Fotoğraf başarıyla yüklendi ve WebP formatına optimize edildi.',
        'url' => 'uploads/' . $webpFilename,
        'filename' => $webpFilename,
        'format' => 'webp',
        'size' => round($finalSize / 1024, 1) . ' KB',
        'originalSize' => round($file['size'] / 1024, 1) . ' KB',
        'compressionRatio' => '%' . max(0, $savedPercent) . ' tasarruf sağlandı'
    ]);
}

// Fallback: WebP desteği yoksa orijinal formatıyla kaydet
$fallbackFilename = $fileBase . '.' . $extension;
$fallbackTargetPath = UPLOADS_DIR . '/' . $fallbackFilename;

if (move_uploaded_file($file['tmp_name'], $fallbackTargetPath)) {
    @chmod($fallbackTargetPath, 0666);
    jsonResponse([
        'success' => true,
        'message' => 'Fotoğraf başarıyla yüklendi.',
        'url' => 'uploads/' . $fallbackFilename,
        'filename' => $fallbackFilename,
        'format' => $extension,
        'size' => round($file['size'] / 1024, 1) . ' KB'
    ]);
} else {
    jsonResponse(['success' => false, 'message' => 'Dosya sunucuya kaydedilemedi.'], 500);
}
