<?php
header('Content-Type: application/json; charset=utf-8');
require_once 'includes/db.php';

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true) ?: $_POST;

if ($method === 'GET') {
    if (empty($_SESSION['user_id'])) {
        echo json_encode(['success' => true, 'offers' => []], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $stmt = $pdo->prepare("
        SELECT o.*, c.brand, c.model, c.year, c.price AS original_price, c.currency AS original_currency
        FROM price_offers o
        INNER JOIN cars c ON o.car_id = c.id
        WHERE c.user_id = ?
        ORDER BY o.id DESC
    ");
    $stmt->execute([(int)$_SESSION['user_id']]);
    echo json_encode(['success' => true, 'offers' => $stmt->fetchAll()], JSON_UNESCAPED_UNICODE);
    exit;
}

$action = $input['action'] ?? 'create';

if ($action === 'create') {
    $carId = (int)($input['car_id'] ?? 0);
    $buyerName = trim($input['buyer_name'] ?? '');
    $buyerPhone = trim($input['buyer_phone'] ?? '');
    $offeredPrice = (float)($input['offered_price'] ?? 0);
    $currency = trim($input['currency'] ?? 'USD');

    if ($carId <= 0 || mb_strlen($buyerName) < 2 || mb_strlen($buyerPhone) < 6 || $offeredPrice <= 0) {
        echo json_encode(['success' => false, 'message' => 'Լրացրեք անունը, հեռախոսահամարը և առաջարկվող գինը'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    if (containsProfanityServer($buyerName)) {
        echo json_encode(['success' => false, 'message' => 'Արգելված բառեր'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $ins = $pdo->prepare("
        INSERT INTO price_offers (car_id, buyer_name, buyer_phone, offered_price, currency)
        VALUES (?, ?, ?, ?, ?)
    ");
    $ins->execute([$carId, $buyerName, $buyerPhone, $offeredPrice, $currency]);

    echo json_encode(['success' => true, 'message' => 'Ձեր գնային առաջարկը ուղարկվեց վաճառողին'], JSON_UNESCAPED_UNICODE);
    exit;
}

if ($action === 'respond') {
    if (empty($_SESSION['user_id'])) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Մուտք գործեք հաշիվ'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $offerId = (int)($input['offer_id'] ?? 0);
    $decision = $input['decision'] ?? '';
    if ($offerId <= 0 || !in_array($decision, ['accepted', 'rejected'], true)) {
        echo json_encode(['success' => false, 'message' => 'Սխալ հարցում'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $check = $pdo->prepare("
        SELECT o.id FROM price_offers o
        INNER JOIN cars c ON o.car_id = c.id
        WHERE o.id = ? AND c.user_id = ?
    ");
    $check->execute([$offerId, (int)$_SESSION['user_id']]);
    if (!$check->fetch()) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Մուտքն արգելված է'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $pdo->prepare("UPDATE price_offers SET status = ? WHERE id = ?")->execute([$decision, $offerId]);
    echo json_encode(['success' => true], JSON_UNESCAPED_UNICODE);
    exit;
}