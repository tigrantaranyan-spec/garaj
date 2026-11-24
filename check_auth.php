<?php
header('Content-Type: application/json; charset=utf-8');
require_once 'includes/db.php';

if (isset($_SESSION['user'])) {
    $_SESSION['user']['isAdmin'] = isUserAdmin($_SESSION['user'], $ADMIN_EMAIL);
    echo json_encode(['logged_in' => true, 'user' => $_SESSION['user']], JSON_UNESCAPED_UNICODE);
} else {
    echo json_encode(['logged_in' => false], JSON_UNESCAPED_UNICODE);
}