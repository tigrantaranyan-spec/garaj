<?php
header('Content-Type: application/json; charset=utf-8');
require_once 'includes/db.php';

$data = json_decode(file_get_contents('php://input'), true) ?: $_POST;
$action = $data['action'] ?? 'login';

if ($action === 'login') {
    $email = trim($data['email'] ?? '');
    $name = trim($data['name'] ?? '');
    $phone = trim($data['phone'] ?? '');
    $agreed = !empty($data['agreed']);

    if (!$agreed) {
        echo json_encode(['success' => false, 'message' => 'Պետք է համաձայնել կայքի կանոններին'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL) || mb_strlen($name) < 2 || mb_strlen($phone) < 6) {
        echo json_encode(['success' => false, 'message' => 'Լրացրեք Google հաշիվը, անունը և պարտադիր հեռախոսահամարը'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    if (containsProfanityServer($name)) {
        echo json_encode(['success' => false, 'message' => 'Անունը պարունակում է արգելված բառեր'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $shouldBeAdmin = (strcasecmp($email, trim($ADMIN_EMAIL)) === 0) ? 1 : 0;

    $stmt = $pdo->prepare("SELECT * FROM users WHERE google_email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if ($user) {
        if (!empty($user['is_banned']) && !$shouldBeAdmin) {
            echo json_encode(['success' => false, 'message' => 'Ձեր հաշիվը արգելափակված է ադմինիստրացիայի կողմից'], JSON_UNESCAPED_UNICODE);
            exit;
        }
        $upd = $pdo->prepare("UPDATE users SET name = ?, phone = ?, is_admin = ? WHERE id = ?");
        $upd->execute([$name, $phone, $shouldBeAdmin, $user['id']]);
        $user['name'] = $name;
        $user['phone'] = $phone;
        $user['is_admin'] = $shouldBeAdmin;
    } else {
        $ins = $pdo->prepare("INSERT INTO users (google_email, name, phone, whatsapp, is_admin, is_banned) VALUES (?, ?, ?, ?, ?, 0)");
        $ins->execute([$email, $name, $phone, $phone, $shouldBeAdmin]);
        $userId = (int)$pdo->lastInsertId();
        $user = [
            'id' => $userId,
            'google_email' => $email,
            'name' => $name,
            'phone' => $phone,
            'whatsapp' => $phone,
            'seller_type' => 'Անհատ',
            'is_admin' => $shouldBeAdmin,
            'is_banned' => 0
        ];
    }

    $adminStatus = isUserAdmin($user, $ADMIN_EMAIL);

    $_SESSION['user_id'] = (int)$user['id'];
    $_SESSION['user'] = [
        'id' => (int)$user['id'],
        'email' => $user['google_email'],
        'name' => $user['name'],
        'phone' => $user['phone'],
        'whatsapp' => $user['whatsapp'] ?? $user['phone'],
        'sellerType' => $user['seller_type'] ?? 'Անհատ',
        'isAdmin' => $adminStatus
    ];

    echo json_encode(['success' => true, 'user' => $_SESSION['user']], JSON_UNESCAPED_UNICODE);
    exit;
}

if ($action === 'update') {
    if (!isset($_SESSION['user_id'])) {
        echo json_encode(['success' => false, 'message' => 'Մուտք գործեք հաշիվ'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $name = trim($data['name'] ?? '');
    $phone = trim($data['phone'] ?? '');
    $whatsapp = trim($data['whatsapp'] ?? '');
    $sellerType = trim($data['sellerType'] ?? 'Անհատ');

    if (mb_strlen($name) < 2 || mb_strlen($phone) < 6) {
        echo json_encode(['success' => false, 'message' => 'Անունը և հեռախոսահամարը պարտադիր են'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    if (containsProfanityServer($name)) {
        echo json_encode(['success' => false, 'message' => 'Անունը պարունակում է արգելված բառեր'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $upd = $pdo->prepare("UPDATE users SET name = ?, phone = ?, whatsapp = ?, seller_type = ? WHERE id = ?");
    $upd->execute([$name, $phone, $whatsapp, $sellerType, $_SESSION['user_id']]);

    $_SESSION['user']['name'] = $name;
    $_SESSION['user']['phone'] = $phone;
    $_SESSION['user']['whatsapp'] = $whatsapp;
    $_SESSION['user']['sellerType'] = $sellerType;

    echo json_encode(['success' => true, 'user' => $_SESSION['user']], JSON_UNESCAPED_UNICODE);
    exit;
}