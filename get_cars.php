<?php
header('Content-Type: application/json; charset=utf-8');
require_once 'includes/db.php';

function formatCarRow(array $row, PDOStatement $imgStmt): array {
    $imgStmt->execute([$row['id']]);
    $imgs = $imgStmt->fetchAll(PDO::FETCH_COLUMN);

    return [
        'id' => (int)$row['id'],
        'userId' => (int)$row['user_id'],
        'vehicleType' => $row['vehicle_type'],
        'category' => $row['category'],
        'mileageState' => $row['mileage_state'],
        'sellerType' => $row['seller_type'],
        'region' => $row['region'],
        'city' => $row['city'],
        'village' => $row['village'],
        'brand' => $row['brand'],
        'model' => $row['model'],
        'year' => (int)$row['year'],
        'mileage' => (int)$row['mileage'],
        'damage' => $row['damage'],
        'gas' => $row['gas'],
        'steering' => $row['steering'],
        'customs' => $row['customs'],
        'color' => $row['color'],
        'tireSize' => $row['tire_size'],
        'headlights' => $row['headlights'],
        'interiorColor' => $row['interior_color'],
        'interiorType' => $row['interior_type'],
        'sunroof' => $row['sunroof'],
        'comfort' => json_decode($row['comfort'] ?: '[]', true),
        'price' => (float)$row['price'],
        'currency' => $row['currency'],
        'description' => $row['description'],
        'phone' => $row['contact_phone'],
        'whatsapp' => $row['contact_whatsapp'],
        'vinStatus' => $row['vin_status'],
        'vinCode' => $row['vin_code'],
        'isVip' => (int)($row['is_vip'] ?? 0),
        'viewsCount' => (int)($row['views_count'] ?? 0),
        'status' => $row['status'],
        'images' => $imgs
    ];
}

$imgStmt = $pdo->prepare("SELECT image_path FROM car_images WHERE car_id = ? ORDER BY is_main DESC, id ASC");

$activeStmt = $pdo->query("
    SELECT * FROM cars
    WHERE status = 'active'
    ORDER BY is_vip DESC, (vin_status = 'provided') DESC, id DESC
");
$activeCars = [];
foreach ($activeStmt->fetchAll() as $row) {
    $activeCars[] = formatCarRow($row, $imgStmt);
}

$myCars = [];
if (!empty($_SESSION['user_id'])) {
    $myStmt = $pdo->prepare("SELECT * FROM cars WHERE user_id = ? ORDER BY id DESC");
    $myStmt->execute([(int)$_SESSION['user_id']]);
    foreach ($myStmt->fetchAll() as $row) {
        $myCars[] = formatCarRow($row, $imgStmt);
    }
}

$pendingCars = [];
if (!empty($_SESSION['user']['isAdmin'])) {
    $pendStmt = $pdo->query("SELECT * FROM cars WHERE status = 'pending' ORDER BY id DESC");
    foreach ($pendStmt->fetchAll() as $row) {
        $pendingCars[] = formatCarRow($row, $imgStmt);
    }
}

echo json_encode([
    'success' => true,
    'cars' => $activeCars,
    'my_cars' => $myCars,
    'pending' => $pendingCars
], JSON_UNESCAPED_UNICODE);