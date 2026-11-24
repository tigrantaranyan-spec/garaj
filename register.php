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

$name = trim($data['name'] ?? '');
$phone = trim($data['phone'] ?? '');
$password = $data['password'] ?? '';

if (mb_strlen($name) < 2) {
    echo json_encode(['success' => false, 'message' => 'Մուտքագրեք ճիշտ անուն (նվազագույնը 2 տառ)'], JSON_UNESCAPED_UNICODE);
    exit;
}

if (mb_strlen($phone) < 6) {
    echo json_encode(['success' => false, 'message' => 'Մուտքագրեք հեռախոսահամար կամ էլ. փոստ'], JSON_UNESCAPED_UNICODE);
    exit;
}

if (strlen($password) < 6) {
    echo json_encode(['success' => false, 'message' => 'Գաղտնաբառը պետք է լինի առնվազն 6 նիշ'], JSON_UNESCAPED_UNICODE);
    exit;
}


$stmt = $pdo->prepare("SELECT id FROM users WHERE phone = ?");
$stmt->execute([$phone]);
if ($stmt->fetch()) {
    echo json_encode(['success' => false, 'message' => 'Այս հեռախոսահամարով հաշիվ արդեն գոյություն ունի'], JSON_UNESCAPED_UNICODE);
    exit;
}

$hash = password_hash($password, PASSWORD_DEFAULT);

$stmt = $pdo->prepare("INSERT INTO users (name, phone, password_hash) VALUES (?, ?, ?)");
$stmt->execute([$name, $phone, $hash]);

$userId = $pdo->lastInsertId();

// Сразу авторизуем пользователя
$_SESSION['user_id'] = $userId;
$_SESSION['user_name'] = $name;
$_SESSION['user_phone'] = $phone;

echo json_encode([
    'success' => true,
    'message' => 'Գրանցումը հաջողվեց',
    'user' => [
        'id' => $userId,
        'name' => $name,
        'phone' => $phone
    ]
], JSON_UNESCAPED_UNICODE);