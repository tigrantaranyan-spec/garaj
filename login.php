<?php
header('Content-Type: application/json; charset=utf-8');
require_once 'includes/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Սխալ հարցում'], JSON_UNESCAPED_UNICODE);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
if (!$data) {
    $data = $_POST;
}

$phone = trim($data['phone'] ?? '');
$password = $data['password'] ?? '';

if (empty($phone) || empty($password)) {
    echo json_encode(['success' => false, 'message' => 'Լրացրեք բոլոր դաշտերը'], JSON_UNESCAPED_UNICODE);
    exit;
}

$stmt = $pdo->prepare("SELECT id, name, phone, password_hash FROM users WHERE phone = ?");
$stmt->execute([$phone]);
$user = $stmt->fetch();

if (!$user || !password_verify($password, $user['password_hash'])) {
    echo json_encode(['success' => false, 'message' => 'Սխալ հեռախոսահամար կամ գաղտնաբառ'], JSON_UNESCAPED_UNICODE);
    exit;
}

$_SESSION['user_id'] = $user['id'];
$_SESSION['user_name'] = $user['name'];
$_SESSION['user_phone'] = $user['phone'];

echo json_encode([
    'success' => true,
    'message' => 'Մուտքը հաջողվեց',
    'user' => [
        'id' => $user['id'],
        'name' => $user['name'],
        'phone' => $user['phone']
    ]
], JSON_UNESCAPED_UNICODE);