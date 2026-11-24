<?php
header('Content-Type: application/json; charset=utf-8');
require_once 'includes/db.php';

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true) ?: $_POST;

if ($method === 'POST' && ($input['action'] ?? '') === 'report') {
    $carId = !empty($input['car_id']) ? (int)$input['car_id'] : null;
    $reason = trim($input['reason'] ?? '');
    $reporter = $_SESSION['user']['email'] ?? 'guest@garaj.am';
    if (mb_strlen($reason) < 3) {
        echo json_encode(['success' => false, 'message' => 'Նշեք բողոքի պատճառը'], JSON_UNESCAPED_UNICODE);
        exit;
    }
    $pdo->prepare("INSERT INTO reports (car_id, reporter_email, reason) VALUES (?, ?, ?)")
        ->execute([$carId, $reporter, $reason]);
    echo json_encode(['success' => true], JSON_UNESCAPED_UNICODE);
    exit;
}

if (empty($_SESSION['user']['isAdmin'])) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Միայն ադմինիստրատորի համար'], JSON_UNESCAPED_UNICODE);
    exit;
}

$adminEmail = $_SESSION['user']['email'] ?? 'admin';

if ($method === 'GET') {
    $users = $pdo->query("SELECT id, google_email, name, phone, seller_type, is_banned, is_admin, created_at FROM users ORDER BY id DESC")->fetchAll();
    $reports = $pdo->query("SELECT * FROM reports ORDER BY id DESC LIMIT 100")->fetchAll();
    $logs = $pdo->query("SELECT * FROM audit_logs ORDER BY id DESC LIMIT 100")->fetchAll();

    $stats = [
        'total_users' => (int)$pdo->query("SELECT COUNT(*) FROM users")->fetchColumn(),
        'banned_users' => (int)$pdo->query("SELECT COUNT(*) FROM users WHERE is_banned = 1")->fetchColumn(),
        'active_cars' => (int)$pdo->query("SELECT COUNT(*) FROM cars WHERE status = 'active'")->fetchColumn(),
        'pending_cars' => (int)$pdo->query("SELECT COUNT(*) FROM cars WHERE status = 'pending'")->fetchColumn(),
        'total_reports' => (int)$pdo->query("SELECT COUNT(*) FROM reports")->fetchColumn()
    ];

    echo json_encode([
        'success' => true,
        'stats' => $stats,
        'users' => $users,
        'reports' => $reports,
        'logs' => $logs
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$action = $input['action'] ?? 'ban';
if ($action === 'ban') {
    $targetId = (int)($input['user_id'] ?? 0);
    $banState = !empty($input['is_banned']) ? 1 : 0;
    if ($targetId <= 0) {
        echo json_encode(['success' => false, 'message' => 'Սխալ օգտատեր'], JSON_UNESCAPED_UNICODE);
        exit;
    }
    $pdo->prepare("UPDATE users SET is_banned = ? WHERE id = ?")->execute([$banState, $targetId]);
    $msg = $banState ? "Արգելափակեց օգտատիրոջը #$targetId" : "Ապաարգելափակեց օգտատիրոջը #$targetId";
    $pdo->prepare("INSERT INTO audit_logs (admin_email, action_text) VALUES (?, ?)")->execute([$adminEmail, $msg]);
    echo json_encode(['success' => true], JSON_UNESCAPED_UNICODE);
    exit;
}

if ($action === 'delete_report') {
    $repId = (int)($input['report_id'] ?? 0);
    $pdo->prepare("DELETE FROM reports WHERE id = ?")->execute([$repId]);
    $pdo->prepare("INSERT INTO audit_logs (admin_email, action_text) VALUES (?, ?)")
        ->execute([$adminEmail, "Փակեց բողոքը #$repId"]);
    echo json_encode(['success' => true], JSON_UNESCAPED_UNICODE);
    exit;
}