<?php
header('Content-Type: application/json; charset=utf-8');
require_once 'includes/db.php';

if (empty($_SESSION['user']['isAdmin'])) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Մուտքն արգելված է'], JSON_UNESCAPED_UNICODE);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true) ?: $_POST;
$carId = (int)($input['car_id'] ?? 0);
$decision = $input['decision'] ?? '';

if ($carId <= 0 || !in_array($decision, ['approve', 'reject', 'delete', 'toggle_vip'], true)) {
    echo json_encode(['success' => false, 'message' => 'Սխալ պարամետրեր'], JSON_UNESCAPED_UNICODE);
    exit;
}

$adminEmail = $_SESSION['user']['email'] ?? 'admin';

if ($decision === 'approve') {
    $pdo->prepare("UPDATE cars SET status = 'active' WHERE id = ?")->execute([$carId]);
    $pdo->prepare("INSERT INTO audit_logs (admin_email, action_text) VALUES (?, ?)")
        ->execute([$adminEmail, "Հաստատեց հայտարարությունը #$carId"]);
} elseif ($decision === 'reject') {
    $pdo->prepare("UPDATE cars SET status = 'rejected' WHERE id = ?")->execute([$carId]);
    $pdo->prepare("INSERT INTO audit_logs (admin_email, action_text) VALUES (?, ?)")
        ->execute([$adminEmail, "Մերժեց հայտարարությունը #$carId"]);
} elseif ($decision === 'toggle_vip') {
    $pdo->prepare("UPDATE cars SET is_vip = IF(is_vip = 1, 0, 1) WHERE id = ?")->execute([$carId]);
    $pdo->prepare("INSERT INTO audit_logs (admin_email, action_text) VALUES (?, ?)")
        ->execute([$adminEmail, "Փոխեց VIP կարգավիճակը #$carId"]);
} elseif ($decision === 'delete') {
    $pdo->prepare("DELETE FROM cars WHERE id = ?")->execute([$carId]);
    $pdo->prepare("INSERT INTO audit_logs (admin_email, action_text) VALUES (?, ?)")
        ->execute([$adminEmail, "Ջնջեց հայտարարությունը #$carId"]);
}

echo json_encode(['success' => true], JSON_UNESCAPED_UNICODE);