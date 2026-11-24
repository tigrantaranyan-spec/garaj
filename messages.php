<?php
header('Content-Type: application/json; charset=utf-8');
require_once 'includes/db.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $stmt = $pdo->query("SELECT * FROM messages ORDER BY id DESC LIMIT 100");
    echo json_encode(['success' => true, 'messages' => $stmt->fetchAll()], JSON_UNESCAPED_UNICODE);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true) ?: $_POST;
$text = trim($input['message_text'] ?? '');

if ($text === '' || containsProfanityServer($text)) {
    echo json_encode(['success' => false, 'message' => 'Սխալ կամ արգելված հաղորդագրություն'], JSON_UNESCAPED_UNICODE);
    exit;
}

$stmt = $pdo->prepare("
    INSERT INTO messages (car_id, sender_email, sender_name, receiver_phone, car_title, message_text)
    VALUES (?, ?, ?, ?, ?, ?)
");
$stmt->execute([
    !empty($input['car_id']) ? (int)$input['car_id'] : null,
    trim($input['sender_email'] ?? 'guest@garaj.am'),
    trim($input['sender_name'] ?? 'Հաճախորդ'),
    trim($input['receiver_phone'] ?? ''),
    trim($input['car_title'] ?? ''),
    $text
]);

echo json_encode(['success' => true], JSON_UNESCAPED_UNICODE);