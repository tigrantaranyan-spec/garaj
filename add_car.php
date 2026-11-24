<?php
header('Content-Type: application/json; charset=utf-8');
require_once 'includes/db.php';

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Նախ մուտք գործեք հաշիվ'], JSON_UNESCAPED_UNICODE);
    exit;
}

$now = time();
if (!empty($_SESSION['last_car_post_at']) && ($now - (int)$_SESSION['last_car_post_at']) < 15) {
    echo json_encode(['success' => false, 'message' => 'Խնդրում ենք սպասել 15 վայրկյան նախքան նոր հայտարարություն ուղարկելը'], JSON_UNESCAPED_UNICODE);
    exit;
}

$uStmt = $pdo->prepare("SELECT is_banned FROM users WHERE id = ?");
$uStmt->execute([$_SESSION['user_id']]);
$uRow = $uStmt->fetch();
if ($uRow && !empty($uRow['is_banned'])) {
    echo json_encode(['success' => false, 'message' => 'Ձեր հաշիվը արգելափակված է'], JSON_UNESCAPED_UNICODE);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Սխալ հարցում'], JSON_UNESCAPED_UNICODE);
    exit;
}

$brand = trim($_POST['brand'] ?? '');
$model = trim($_POST['model'] ?? '');
$description = trim($_POST['description'] ?? '');

if (containsProfanityServer($brand . ' ' . $model . ' ' . $description)) {
    echo json_encode(['success' => false, 'message' => 'Հայտարարությունը պարունակում է արգելված կամ վիրավորական բառեր'], JSON_UNESCAPED_UNICODE);
    exit;
}

if (empty($_FILES['photos']['name'][0])) {
    echo json_encode(['success' => false, 'message' => 'Նկարը պարտադիր է'], JSON_UNESCAPED_UNICODE);
    exit;
}

$phone = trim($_POST['contact_phone'] ?? '');
if (mb_strlen($phone) < 6) {
    echo json_encode(['success' => false, 'message' => 'Հեռախոսահամարը պարտադիր է'], JSON_UNESCAPED_UNICODE);
    exit;
}

$uploadDir = __DIR__ . '/uploads/cars/';
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0777, true);
}

$allowedExt = ['jpg', 'jpeg', 'png', 'webp'];
$savedPaths = [];

foreach ($_FILES['photos']['tmp_name'] as $idx => $tmpName) {
    if ($_FILES['photos']['error'][$idx] !== UPLOAD_ERR_OK) {
        continue;
    }
    $origName = $_FILES['photos']['name'][$idx];
    $ext = strtolower(pathinfo($origName, PATHINFO_EXTENSION));
    if (!in_array($ext, $allowedExt, true)) {
        continue;
    }
    if (@getimagesize($tmpName) === false) {
        continue;
    }
    $newFileName = 'car_' . time() . '_' . bin2hex(random_bytes(4)) . '.' . $ext;
    if (move_uploaded_file($tmpName, $uploadDir . $newFileName)) {
        $savedPaths[] = 'uploads/cars/' . $newFileName;
    }
}

if (count($savedPaths) === 0) {
    echo json_encode(['success' => false, 'message' => 'Չհաջողվեց ներբեռնել նկարները (JPG, PNG, WEBP)'], JSON_UNESCAPED_UNICODE);
    exit;
}

$vinStatus = $_POST['vin_status'] ?? 'hidden';
$vinCode = ($vinStatus === 'provided') ? strtoupper(trim($_POST['vin_code'] ?? '')) : null;

$stmt = $pdo->prepare("
    INSERT INTO cars (
        user_id, vehicle_type, category, mileage_state, seller_type,
        region, city, village, vin_status, vin_code,
        brand, model, year, mileage, damage, gas, steering, customs,
        color, tire_size, headlights, interior_color, interior_type, sunroof,
        comfort, price, currency, description, contact_phone, contact_whatsapp
    ) VALUES (
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?
    )
");

$stmt->execute([
    $_SESSION['user_id'],
    $_POST['vehicle_type'] ?? 'Մեքենա',
    $_POST['car_category'] ?? 'Մարդատար ավտոմեքենաներ',
    $_POST['mileage_state'] ?? 'Վազքով մեքենաներ',
    $_POST['seller_type'] ?? 'Անհատ',
    $_POST['region'] ?? 'Երևան',
    $_POST['city'] ?? '',
    $_POST['village'] ?? '',
    $vinStatus,
    $vinCode,
    $brand,
    $model,
    (int)($_POST['year'] ?? 2020),
    (int)($_POST['mileage'] ?? 0),
    $_POST['damage'] ?? 'Չվթարված',
    $_POST['gas'] ?? 'Գազ չկա',
    $_POST['steering'] ?? 'Ձախ',
    $_POST['customs'] ?? 'Այո',
    $_POST['color'] ?? '',
    $_POST['tire_size'] ?? '',
    $_POST['headlights'] ?? '',
    $_POST['interior_color'] ?? '',
    $_POST['interior_type'] ?? '',
    $_POST['sunroof'] ?? '',
    $_POST['comfort'] ?? '[]',
    (float)($_POST['price'] ?? 0),
    $_POST['currency'] ?? 'USD',
    $description,
    $phone,
    trim($_POST['contact_whatsapp'] ?? '')
]);

$carId = $pdo->lastInsertId();
$_SESSION['last_car_post_at'] = $now;

$imgStmt = $pdo->prepare("INSERT INTO car_images (car_id, image_path, is_main) VALUES (?, ?, ?)");
foreach ($savedPaths as $i => $path) {
    $imgStmt->execute([$carId, $path, $i === 0 ? 1 : 0]);
}

echo json_encode(['success' => true, 'car_id' => $carId], JSON_UNESCAPED_UNICODE);