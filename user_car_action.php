<?php
header('Content-Type: application/json; charset=utf-8');
require_once 'includes/db.php';

$input = json_decode(file_get_contents('php://input'), true) ?: $_POST;
$carId = (int)($input['car_id'] ?? 0);
$action = $input['action'] ?? '';

// Увеличение счётчика просмотров доступно всем посетителям
if ($carId > 0 && $action === 'view') {
    $pdo->prepare("UPDATE cars SET views_count = views_count + 1 WHERE id = ?")->execute([$carId]);
    echo json_encode(['success' => true], JSON_UNESCAPED_UNICODE);
    exit;
}

if (empty($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Մուտք գործեք հաշիվ'], JSON_UNESCAPED_UNICODE);
    exit;
}

$userId = (int)$_SESSION['user_id'];

if ($carId <= 0 || !in_array($action, ['mark_sold', 'delete'], true)) {
    echo json_encode(['success' => false, 'message' => 'Սխալ հարցում'], JSON_UNESCAPED_UNICODE);
    exit;
}

$check = $pdo->prepare("SELECT id FROM cars WHERE id = ? AND user_id = ?");
$check->execute([$carId, $userId]);
if (!$check->fetch()) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Հայտարարությունը չի գտնվել'], JSON_UNESCAPED_UNICODE);
    exit;
}

if ($action === 'mark_sold') {
    $pdo->prepare("UPDATE cars SET status = 'sold' WHERE id = ? AND user_id = ?")->execute([$carId, $userId]);
} elseif ($action === 'delete') {
    $pdo->prepare("DELETE FROM cars WHERE id = ? AND user_id = ?")->execute([$carId, $userId]);
}

echo json_encode(['success' => true], JSON_UNESCAPED_UNICODE);